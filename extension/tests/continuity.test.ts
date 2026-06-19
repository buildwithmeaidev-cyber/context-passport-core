import { describe, it, expect } from "vitest";
import { ContinuityService } from "@/services/continuity/ContinuityService";
import { LicenseService } from "@/services/license/LicenseService";
import { EMPTY_PASSPORT } from "@/core/passport";
import type { ContextPassport } from "@/core/passport";

const passport: ContextPassport = {
  ...EMPTY_PASSPORT,
  goals: [{ id: "g1", kind: "goal", text: "Ship continuity v1", source: { captureId: "c", providerId: "chatgpt", role: "user", capturedAt: 1 }, confidence: 0.9, pinned: true, dismissed: false }],
  decisions: [{ id: "d1", kind: "decision", text: "Use Manifest V3", source: { captureId: "c", providerId: "chatgpt", role: "user", capturedAt: 1 }, confidence: 0.8, pinned: false, dismissed: false }],
  nextActions: [{ id: "n1", kind: "nextAction", text: "Write docs", source: { captureId: "c", providerId: "chatgpt", role: "user", capturedAt: 1 }, confidence: 0.8, pinned: false, dismissed: false }],
};

describe("ContinuityService", () => {
  it("lists all built-in strategies", () => {
    const svc = new ContinuityService(new LicenseService());
    expect(svc.list().map((s) => s.id).sort()).toEqual(["brief", "essential", "full", "handoff"]);
  });

  it("essential mode renders goals/decisions/constraints/next-actions only", () => {
    const svc = new ContinuityService(new LicenseService());
    const r = svc.render("essential", { projectName: "P", projectDescription: "", passport });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.text).toContain("Ship continuity v1");
      expect(r.value.text).toContain("Use Manifest V3");
      expect(r.value.text).toContain("Write docs");
    }
  });

  it("blocks handoff on free tier", () => {
    const svc = new ContinuityService(new LicenseService());
    const r = svc.render("handoff", { projectName: "P", projectDescription: "", passport });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("PREMIUM_REQUIRED");
  });

  it("allows handoff on pro tier and includes provider preamble", () => {
    const lic = new LicenseService();
    lic._setPlanForTesting("pro");
    const svc = new ContinuityService(lic);
    const r = svc.render("handoff", { projectName: "P", projectDescription: "", passport, targetProviderId: "claude" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.text.toLowerCase()).toContain("claude");
  });
});
