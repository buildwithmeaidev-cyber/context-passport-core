// Run with: bunx vitest run --root extension
import { describe, it, expect, beforeEach } from "vitest";
import { StorageGateway, type StorageDriver } from "@/storage/StorageGateway";
import { CURRENT_VERSION } from "@/storage/schema";
import { ConsoleLogger } from "@/core/logger";

class MemDriver implements StorageDriver {
  store = new Map<string, unknown>();
  async get<T>(k: string) { return this.store.get(k) as T | undefined; }
  async set<T>(k: string, v: T) { this.store.set(k, v); }
  async remove(k: string) { this.store.delete(k); }
  async keys() { return [...this.store.keys()]; }
}

describe("StorageGateway", () => {
  let g: StorageGateway;
  let d: MemDriver;
  beforeEach(() => {
    d = new MemDriver();
    g = new StorageGateway(d, new ConsoleLogger("test", "error"));
  });

  it("returns null for missing keys", async () => {
    const r = await g.read("vault:conversations");
    expect(r.ok && r.value === null).toBe(true);
  });

  it("round-trips a conversation list with current version tag", async () => {
    const w = await g.write("vault:conversations", []);
    expect(w.ok).toBe(true);
    const stored = d.store.get("vault:conversations") as { __v: number };
    expect(stored.__v).toBe(CURRENT_VERSION);
    const r = await g.read("vault:conversations");
    expect(r.ok).toBe(true);
  });

  it("quarantines invalid data instead of dropping it", async () => {
    await d.set("vault:conversations", { __v: CURRENT_VERSION, data: { bogus: true } });
    const r = await g.read("vault:conversations");
    expect(r.ok).toBe(false);
    const keys = await d.keys();
    expect(keys.some((k) => k.startsWith("quarantine:vault:conversations:"))).toBe(true);
  });
});
