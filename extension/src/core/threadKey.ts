// Thread identity for captures.
//
// A "thread" is one AI conversation on one provider. Every capture belongs to
// exactly one thread, so context from different chats never blends together in
// the passport or in a pasted handoff.
//
// The key is derived from provider id + the normalized conversation URL. A new
// conversation URL always yields a new key — which is what makes each AI chat
// get its own distinct, stable name instead of one mixed pile.

import type { ConversationTurn } from "./tokens";

/** Strip query, hash, trailing slash, and locale-ish prefixes from a chat URL. */
export function normalizeConversationUrl(url: string): string {
  try {
    const u = new URL(url);
    let path = u.pathname.replace(/\/+$/, "");
    // Gemini/Google localized prefixes: /u/0/app/<id>
    path = path.replace(/^\/u\/\d+/, "");
    if (!path) path = "/";
    return `${u.hostname.toLowerCase()}${path}`;
  } catch {
    return (url || "").split(/[?#]/)[0]!.toLowerCase();
  }
}

/**
 * Stable key for the conversation. Falls back to a per-provider "unfiled"
 * bucket when the URL carries no conversation id (e.g. a brand-new chat).
 */
export function buildThreadKey(providerId: string, url: string): string {
  const normalized = normalizeConversationUrl(url);
  const id = extractConversationId(normalized);
  return `${providerId}::${id ?? normalized}`;
}

/** Pull the provider-specific conversation id out of a normalized URL. */
export function extractConversationId(normalizedUrl: string): string | null {
  const patterns: RegExp[] = [
    /\/c\/([a-z0-9-]{8,})/i, // ChatGPT
    /\/chat\/([a-z0-9-]{8,})/i, // Claude
    /\/app\/([a-z0-9-]{6,})/i, // Gemini
    /\/search\/([a-z0-9-]{6,})/i, // Perplexity
    /\/conversation\/([a-z0-9-]{6,})/i,
  ];
  for (const re of patterns) {
    const m = normalizedUrl.match(re);
    if (m?.[1]) return m[1].toLowerCase();
  }
  return null;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "so", "to", "of", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "i", "we", "you", "it", "this", "that",
  "my", "our", "your", "can", "could", "would", "should", "please", "hey", "hi",
  "hello", "help", "me", "need", "want", "how", "what", "why", "do", "does", "did",
]);

/**
 * Human topic for the thread, derived from the first substantive user turn.
 * Deterministic: recapturing the same conversation produces the same topic,
 * so the thread name stays stable instead of changing on every capture.
 */
export function deriveTopic(turns: readonly ConversationTurn[], fallback = "Conversation"): string {
  const firstUser = turns.find((t) => t.role === "user" && (t.text ?? "").trim().length > 8);
  const source = (firstUser?.text ?? turns[0]?.text ?? fallback).replace(/\s+/g, " ").trim();
  if (!source) return fallback;

  const firstSentence = source.split(/(?<=[.!?])\s/)[0] ?? source;
  const candidate = firstSentence.length >= 12 ? firstSentence : source;

  const words = candidate
    .replace(/[`*_#>|]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const meaningful = words.filter((w) => !STOP_WORDS.has(w.toLowerCase().replace(/[^a-z0-9]/gi, "")));
  const picked = (meaningful.length >= 3 ? meaningful : words).slice(0, 8).join(" ");
  const cleaned = picked.replace(/[,;:.\-–—]+$/, "").trim();
  if (!cleaned) return fallback;
  return cleaned.length > 58 ? `${cleaned.slice(0, 57).trimEnd()}…` : titleCaseFirst(cleaned);
}

function titleCaseFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Distinct, human name for a thread: "<Provider> · <topic>".
 * `ordinal` disambiguates same-topic threads inside one project.
 */
export function buildThreadTitle(providerLabel: string, topic: string, ordinal = 1): string {
  const base = `${providerLabel} · ${topic}`;
  return ordinal > 1 ? `${base} (${ordinal})` : base;
}
