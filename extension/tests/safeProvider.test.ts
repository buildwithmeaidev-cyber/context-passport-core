import { describe, it, expect } from "vitest";
import { SafeProviderAdapter } from "@/providers/SafeProviderAdapter";
import { ProviderRegistry } from "@/providers/registry";
import type { ProviderAdapter } from "@/providers/ProviderAdapter";
import { ok, err, appError } from "@/core/result";
import type { Logger } from "@/core/logger";

const silentLogger: Logger = { debug() {}, info() {}, warn() {}, error() {} };

function makeAdapter(overrides: Partial<ProviderAdapter> = {}): ProviderAdapter {
  return {
    id: "test",
    label: "Test",
    hosts: ["test.com"],
    capabilities: { capture: true, inject: true },
    matches: (url) => url.includes("test.com"),
    detect: () => true,
    extractConversation: () => ok({ title: "t", turns: [] }),
    injectPrompt: () => ok(true as const),
    ...overrides,
  };
}

describe("SafeProviderAdapter — provider isolation", () => {
  it("forwards successful calls", () => {
    const safe = new SafeProviderAdapter(makeAdapter(), silentLogger);
    expect(safe.extractConversation().ok).toBe(true);
    expect(safe.injectPrompt("x").ok).toBe(true);
    expect(safe.isTripped()).toBe(false);
  });

  it("converts thrown exceptions to ADAPTER_FAILED — never propagates", () => {
    const safe = new SafeProviderAdapter(
      makeAdapter({ extractConversation: () => { throw new Error("dom changed"); } }),
      silentLogger,
    );
    const r = safe.extractConversation();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("ADAPTER_FAILED");
  });

  it("trips after threshold consecutive failures and isolates the provider", () => {
    const safe = new SafeProviderAdapter(
      makeAdapter({ extractConversation: () => err(appError("ADAPTER_FAILED", "no")) }),
      silentLogger,
      3,
    );
    safe.extractConversation();
    safe.extractConversation();
    safe.extractConversation();
    expect(safe.isTripped()).toBe(true);
    const r = safe.extractConversation();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("FEATURE_DISABLED");
  });

  it("matches() and detect() never throw — return false on error", () => {
    const safe = new SafeProviderAdapter(
      makeAdapter({
        matches: () => { throw new Error("boom"); },
        detect: () => { throw new Error("boom"); },
      }),
      silentLogger,
    );
    expect(safe.matches("http://test.com")).toBe(false);
    expect(safe.detect()).toBe(false);
  });

  it("a successful call resets the failure counter", () => {
    let fail = true;
    const safe = new SafeProviderAdapter(
      makeAdapter({
        extractConversation: () =>
          fail ? err(appError("ADAPTER_FAILED", "x")) : ok({ title: "ok", turns: [] }),
      }),
      silentLogger,
      3,
    );
    safe.extractConversation();
    safe.extractConversation();
    fail = false;
    safe.extractConversation();
    fail = true;
    safe.extractConversation();
    safe.extractConversation();
    expect(safe.isTripped()).toBe(false);
  });

  it("regression: one tripped adapter does not affect siblings", () => {
    const broken = new SafeProviderAdapter(
      makeAdapter({ id: "broken", extractConversation: () => { throw new Error("x"); } }),
      silentLogger,
      1,
    );
    const healthy = new SafeProviderAdapter(makeAdapter({ id: "healthy" }), silentLogger);
    const reg = new ProviderRegistry([broken, healthy]);
    broken.extractConversation();
    expect(broken.isTripped()).toBe(true);
    const r = reg.byId("healthy")!.extractConversation();
    expect(r.ok).toBe(true);
  });
});
