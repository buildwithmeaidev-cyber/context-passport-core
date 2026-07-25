import { describe, it, expect } from "vitest";
import { CaptureIntegrityService } from "@/services/capture/CaptureIntegrityService";
import { CaptureStatsService } from "@/services/capture/CaptureStatsService";
import { CapturePortabilityService } from "@/services/portability/CapturePortabilityService";

const svc = new CaptureIntegrityService();

describe("CaptureIntegrityService", () => {
  it("returns ok for a clean conversation", () => {
    const r = svc.validate([
      { role: "user", text: "Hello there, this is a real question." },
      { role: "assistant", text: "And here is a full, thoughtful answer." },
    ], "Chat");
    expect(r.level).toBe("ok");
  });

  it("errors on zero turns", () => {
    const r = svc.validate([], "");
    expect(r.level).toBe("error");
    expect(r.issues.some((i) => i.code === "NO_TURNS")).toBe(true);
  });

  it("warns on high duplicate rate", () => {
    const turns = Array.from({ length: 6 }, () => ({ role: "user" as const, text: "same" }));
    const r = svc.validate(turns, "t");
    expect(r.issues.some((i) => i.code === "HIGH_DUP_RATE")).toBe(true);
  });

  it("warns when first turn is assistant", () => {
    const r = svc.validate([
      { role: "assistant", text: "Answering something." },
      { role: "user", text: "Follow-up." },
    ], "t");
    expect(r.issues.some((i) => i.code === "FIRST_IS_ASSISTANT")).toBe(true);
  });
});

describe("CaptureStatsService", () => {
  const stats = new CaptureStatsService();
  it("computes duplicate rate per capture", () => {
    const cap = {
      id: "c1", providerId: "chatgpt", url: "", title: "t", capturedAt: 0,
      turns: [
        { role: "user" as const, text: "a" },
        { role: "assistant" as const, text: "b" },
        { role: "user" as const, text: "a" },
      ],
      turnHashes: [],
    };
    const s = stats.captureStats(cap);
    expect(s.totalTurns).toBe(3);
    expect(s.uniqueTurns).toBe(2);
    expect(s.duplicateTurns).toBe(1);
    expect(Math.round(s.duplicateRate * 100)).toBe(33);
    expect(s.userTurns).toBe(2);
    expect(s.assistantTurns).toBe(1);
  });
});

describe("CapturePortabilityService CSV parser (round-trip semantics)", () => {
  // We only test parseCsv indirectly via importIntoProject would require a full ProjectService.
  // Instead, run export → verify CSV escaping shape.
  it("CSV escapes commas, quotes, and newlines", async () => {
    const fakeProjects = {
      async get() {
        return {
          id: "p1", name: "My Project", description: "", createdAt: 0, updatedAt: 0,
          passport: { goals: [], status: [], decisions: [], constraints: [], progress: [], filesReferenced: [], openQuestions: [], blockers: [], nextActions: [] },
          intelligence: {} as never, memory: [], lastCaptureUndo: null,
          captures: [{
            id: "c1", providerId: "chatgpt", url: "", title: `Weird, "title"`, capturedAt: Date.parse("2025-01-01T00:00:00Z"),
            turns: [{ role: "user" as const, text: "line1\nline2, with comma" }],
            turnHashes: [],
          }],
        };
      },
    } as never;
    const port = new CapturePortabilityService(fakeProjects);
    const r = await port.exportProject("p1", "csv");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.body).toContain(`"Weird, ""title"""`);
      expect(r.value.body).toContain(`"line1\nline2, with comma"`);
    }
  });
});
