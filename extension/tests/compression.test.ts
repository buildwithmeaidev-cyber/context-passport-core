import { describe, it, expect } from "vitest";
import { CompressionService } from "@/services/compression/CompressionService";
import { LicenseService } from "@/services/license/LicenseService";

const sample = [
  { role: "user" as const, text: "Hello. This is a test." },
  { role: "assistant" as const, text: "Hi there. This is a reply." },
  { role: "user" as const, text: "Hello. This is a test." }, // duplicate
];

describe("CompressionService", () => {
  it("lists all built-in strategies", () => {
    const svc = new CompressionService(new LicenseService());
    const ids = svc.list().map((s) => s.id).sort();
    expect(ids).toEqual(["aggressive", "dedupe", "none", "summarize-heuristic"]);
  });

  it("dedupe removes duplicate turns", () => {
    const svc = new CompressionService(new LicenseService());
    const r = svc.run("dedupe", { turns: sample });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.text.match(/## user/g)!.length).toBe(1);
  });

  it("blocks aggressive mode on free tier", () => {
    const svc = new CompressionService(new LicenseService());
    const r = svc.run("aggressive", { turns: sample });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("PREMIUM_REQUIRED");
  });

  it("allows aggressive mode on pro tier", () => {
    const lic = new LicenseService();
    lic._setPlanForTesting("pro");
    const svc = new CompressionService(lic);
    const r = svc.run("aggressive", { turns: sample, targetChars: 20 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.text.length).toBeLessThanOrEqual(20 + 60);
  });
});
