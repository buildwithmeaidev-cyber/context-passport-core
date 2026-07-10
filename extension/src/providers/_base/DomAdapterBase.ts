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
      const seen = new Set<string>();
      for (const node of nodes) {
        const isUser = node.matches(this.turnSelectors.user) || !!node.querySelector(this.turnSelectors.user);
        const isAssistant = node.matches(this.turnSelectors.assistant) || !!node.querySelector(this.turnSelectors.assistant);
        const textNode = node.querySelector(this.turnSelectors.text) ?? node;
        const text = cleanText(textNode.textContent ?? "");
        if (!text) continue;
        const fingerprint = `${isUser ? "user" : isAssistant ? "assistant" : "assistant"}:${text}`;
        if (seen.has(fingerprint)) continue;
        seen.add(fingerprint);
        const role: ConversationTurn["role"] = isUser ? "user" : isAssistant ? "assistant" : "assistant";
        turns.push({ role, text });
      }
      if (turns.length === 0) {
        const fallbackText = extractReadablePageText();
        if (fallbackText) turns.push({ role: "assistant", text: fallbackText });
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
      writeToComposer(el, text);
      return ok(true);
    } catch (e) {
      return err(appError("ADAPTER_FAILED", "injectPrompt failed", e));
    }
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function writeToComposer(el: HTMLElement, text: string): void {
  el.focus();
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter?.call(el, text);
    el.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  const target = findEditableTarget(el);
  target.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(target);
  selection?.removeAllRanges();
  selection?.addRange(range);

  let inserted = false;
  try {
    inserted = document.execCommand("insertText", false, text);
  } catch {
    inserted = false;
  }
  if (!inserted || !cleanText(target.textContent ?? "").includes(text.slice(0, 40))) {
    target.textContent = text;
  }
  target.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
  target.dispatchEvent(new Event("change", { bubbles: true }));
}

function findEditableTarget(el: HTMLElement): HTMLElement {
  if (el.isContentEditable) return el;
  return el.querySelector<HTMLElement>('[contenteditable="true"]') ?? el;
}

function extractReadablePageText(): string {
  const root = document.querySelector("main") ?? document.body;
  const noisy = [
    "nav", "header", "footer", "aside", "button", "select", "textarea", "input", "script", "style",
    "#contextpassport-quick-widget",
  ].join(",");
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(noisy).forEach((n) => n.remove());
  const text = cleanText(clone.textContent ?? "");
  return text.length >= 80 ? text.slice(0, 14000) : "";
}
