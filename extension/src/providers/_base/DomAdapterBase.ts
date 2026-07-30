import type { ProviderAdapter } from "../ProviderAdapter";
import type { ConversationTurn } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";
import { type AdapterDiagnostics, emptyDiagnostics } from "@/services/capture/AdapterDiagnostics";

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

  /** Populated on every extractConversation() call. Read-only for callers. */
  protected diagnostics: AdapterDiagnostics | null = null;

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

  getDiagnostics(): AdapterDiagnostics | null {
    return this.diagnostics;
  }

  extractConversation(): Result<{ title: string; turns: ConversationTurn[] }> {
    const diag = emptyDiagnostics(this.id, this.label, safeUrl());
    this.diagnostics = diag;
    try {
      const nodes = Array.from(document.querySelectorAll(this.turnSelectors.container));
      diag.selectorsTried.push({
        selector: this.turnSelectors.container,
        usedFor: "message container",
        matched: nodes.length,
        fallback: false,
      });

      const turns: ConversationTurn[] = [];
      const seen = new Set<string>();
      let userMatches = 0;
      let assistantMatches = 0;
      let textSelectorHits = 0;
      let unknownRole = 0;
      let emptyText = 0;

      for (const node of nodes) {
        const isUser = node.matches(this.turnSelectors.user) || !!node.querySelector(this.turnSelectors.user);
        const isAssistant = node.matches(this.turnSelectors.assistant) || !!node.querySelector(this.turnSelectors.assistant);
        if (isUser) userMatches++;
        if (isAssistant) assistantMatches++;
        if (!isUser && !isAssistant) unknownRole++;
        const scoped = node.querySelector(this.turnSelectors.text);
        if (scoped) textSelectorHits++;
        const textNode = scoped ?? node;
        const text = cleanText(textNode.textContent ?? "");
        if (!text) { emptyText++; continue; }
        const fingerprint = `${isUser ? "user" : isAssistant ? "assistant" : "assistant"}:${text}`;
        if (seen.has(fingerprint)) continue;
        seen.add(fingerprint);
        const role: ConversationTurn["role"] = isUser ? "user" : isAssistant ? "assistant" : "assistant";
        turns.push({ role, text });
      }

      diag.selectorsTried.push(
        { selector: this.turnSelectors.user, usedFor: "user role marker", matched: userMatches, fallback: false },
        { selector: this.turnSelectors.assistant, usedFor: "assistant role marker", matched: assistantMatches, fallback: false },
        { selector: this.turnSelectors.text, usedFor: "message text", matched: textSelectorHits, fallback: false },
      );

      if (unknownRole > 0) {
        diag.missingFields.push("role");
        diag.notes.push(
          `${unknownRole} message${unknownRole === 1 ? "" : "s"} matched neither the user nor the assistant marker and were stored as assistant turns.`,
        );
      }
      if (emptyText > 0) {
        diag.missingFields.push("text");
        diag.notes.push(`${emptyText} message container${emptyText === 1 ? "" : "s"} had no readable text — the page may still be rendering.`);
      }
      if (nodes.length > 0 && textSelectorHits === 0) {
        diag.notes.push(`No element matched the message-text selector; the whole message container was read instead, which can pull in buttons and labels.`);
      }

      if (turns.length === 0) {
        const fallbackText = extractReadablePageText();
        diag.selectorsTried.push({
          selector: "main / article / body (readable text)",
          usedFor: "whole-page fallback",
          matched: fallbackText ? 1 : 0,
          fallback: true,
        });
        diag.notes.push(
          "No individual messages could be identified, so the page text was captured as a single block. Roles and turn boundaries are unavailable.",
        );
        if (fallbackText) turns.push({ role: "assistant", text: fallbackText });
      }

      const title = document.title || this.label;
      if (!document.title) diag.missingFields.push("title");
      return ok({ title, turns });
    } catch (e) {
      diag.notes.push(`The ${this.label} page reader threw an error and could not finish.`);
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

function safeUrl(): string {
  try {
    return typeof location !== "undefined" ? location.href : "";
  } catch {
    return "";
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
  return text.length >= 80 ? text.slice(0, 40000) : "";
}
