import { describe, it, expect } from "vitest";
import { extractFacets } from "@/core/extractFacets";
import type { ConversationTurn } from "@/core/tokens";

const turns: ConversationTurn[] = [
  { role: "user", text: "My goal is to build a Chrome extension. We decided to use Manifest V3. It must not require a backend." },
  { role: "assistant", text: "I implemented the storage gateway. Next I'll add the popup UI." },
  { role: "user", text: "How should we handle premium gating?" },
];

describe("extractFacets", () => {
  const facets = extractFacets(turns, { captureId: "c1", providerId: "chatgpt", capturedAt: 1 });
  const byKind = (k: string) => facets.filter((f) => f.kind === k).map((f) => f.text);

  it("finds a goal from a user turn", () => {
    expect(byKind("goal").some((t) => /chrome extension/i.test(t))).toBe(true);
  });
  it("finds a decision", () => {
    expect(byKind("decision").some((t) => /manifest v3/i.test(t))).toBe(true);
  });
  it("finds a constraint", () => {
    expect(byKind("constraint").some((t) => /backend/i.test(t))).toBe(true);
  });
  it("finds progress", () => {
    expect(byKind("progress").some((t) => /storage gateway/i.test(t))).toBe(true);
  });
  it("finds a next action", () => {
    expect(byKind("nextAction").some((t) => /popup ui/i.test(t))).toBe(true);
  });
  it("finds an open question (?-terminated)", () => {
    expect(byKind("openQuestion").some((t) => t.endsWith("?"))).toBe(true);
  });
});
