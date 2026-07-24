// Stable 32-bit FNV-1a hash of a normalized (role, text) turn.
// Used for cross-capture deduplication. Small, fast, deterministic — no crypto
// import required (works identically in service worker, content script, popup).

export function normalizeTurnText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function hashTurn(role: string, text: string): string {
  const input = `${role}::${normalizeTurnText(text)}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
