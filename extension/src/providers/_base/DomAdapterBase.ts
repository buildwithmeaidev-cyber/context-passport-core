import type { ProviderAdapter } from "../ProviderAdapter";
import type { ConversationTurn } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";

/**
 * Adapter contract test helper — shared between real adapters and fixtures.
 * Subclasses only override DOM selectors. Selectors will drift; isolating them
 * here is the entire point.
 */
export abstract class DomAdapterBase implements ProviderAdapter {
  abstract readonly id: string;
  abstract readonly label: string;
  abstract readonly hosts: readonly string[];

  readonly capabilities = { capture: true, inject: true } as const;

  protected abstract turnSelectors: {
    container: string;
    user: string;
    assistant: string;
    text: string;
  };

  protected abstract composerSelector: string;

  matches(url: string): boolean {
    try {
      const u = new URL(url);
      return this.hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
    } catch {
      return false;
    }
  }

  detect(): boolean {
    return !!document.querySelector(this.composerSelector);
  }

  extractConversation(): Result<{ title: string; turns: ConversationTurn[] }> {
    try {
      const nodes = Array.from(document.querySelectorAll(this.turnSelectors.container));
      const turns: ConversationTurn[] = [];
      for (const node of nodes) {
        const isUser = node.matches(this.turnSelectors.user) || !!node.querySelector(this.turnSelectors.user);
        const isAssistant = node.matches(this.turnSelectors.assistant) || !!node.querySelector(this.turnSelectors.assistant);
        const textNode = node.querySelector(this.turnSelectors.text) ?? node;
        const text = (textNode.textContent ?? "").trim();
        if (!text) continue;
        const role: ConversationTurn["role"] = isUser ? "user" : isAssistant ? "assistant" : "assistant";
        turns.push({ role, text });
      }
      const title = document.title || this.label;
      return ok({ title, turns });
    } catch (e) {
      return err(appError("ADAPTER_FAILED", "extractConversation failed", e));
    }
  }

  injectPrompt(text: string): Result<true> {
    try {
      const el = document.querySelector<HTMLElement>(this.composerSelector);
      if (!el) return err(appError("ADAPTER_FAILED", "Composer not found"));
      if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
        el.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set
          ?? Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        setter?.call(el, text);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        // contenteditable
        el.focus();
        el.textContent = text;
        el.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
      }
      return ok(true);
    } catch (e) {
      return err(appError("ADAPTER_FAILED", "injectPrompt failed", e));
    }
  }
}
