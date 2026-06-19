// Cross-runtime message contract. Use this from popup -> content/background.
import type { CapturedConversation } from "@/core/tokens";

export type RuntimeMessage =
  | { type: "CAPTURE_ACTIVE_TAB" }
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

export async function sendToActiveTab<T = unknown>(
  message: RuntimeMessage,
): Promise<T> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  const res = (await chrome.tabs.sendMessage(tab.id, message)) as RuntimeResponse;
  if (!res.ok) throw new Error(res.error);
  return res.data as T;
}
