// Cross-runtime message contract.
import type { CapturedConversation } from "@/core/tokens";

export type RuntimeMessage =
  | { type: "CAPTURE_ACTIVE_TAB"; projectId: string }
  | { type: "INJECT_INTO_ACTIVE_TAB"; text: string }
  | { type: "DETECT_ACTIVE_PROVIDER" };

export type RuntimeResponse =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export interface CaptureResult {
  conversation: CapturedConversation;
}
export interface DetectResult {
  providerId: string | null;
}

export async function sendToActiveTab<T = unknown>(message: RuntimeMessage): Promise<T> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab. Open an AI conversation tab first.");
  if (!isSupportedTabUrl(tab.url)) {
    throw new Error("Open ChatGPT, Claude, Gemini, or Perplexity, then try again.");
  }

  const res = await sendWithContentScriptRetry(tab.id, message);
  if (!res.ok) throw new Error(res.error);
  return res.data as T;
}

async function sendWithContentScriptRetry(tabId: number, message: RuntimeMessage): Promise<RuntimeResponse> {
  try {
    return (await chrome.tabs.sendMessage(tabId, message)) as RuntimeResponse;
  } catch (firstError) {
    if (!isMissingReceiverError(firstError)) throw firstError;
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    await wait(80);
    try {
      return (await chrome.tabs.sendMessage(tabId, message)) as RuntimeResponse;
    } catch (secondError) {
      if (isMissingReceiverError(secondError)) {
        throw new Error("Could not connect to this AI page. Reload the tab once, then try again.");
      }
      throw secondError;
    }
  }
}

function isSupportedTabUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return [
      "chatgpt.com",
      "chat.openai.com",
      "claude.ai",
      "gemini.google.com",
      "perplexity.ai",
      "www.perplexity.ai",
    ].some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function isMissingReceiverError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /receiving end does not exist|could not establish connection/i.test(message);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
