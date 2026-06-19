import { describe, it, expect, beforeEach } from "vitest";
import { StorageGateway, type StorageDriver } from "@/storage/StorageGateway";
import { ConsoleLogger } from "@/core/logger";

class MemDriver implements StorageDriver {
  store = new Map<string, unknown>();
  async get<T>(k: string) { return this.store.get(k) as T | undefined; }
  async set<T>(k: string, v: T) { this.store.set(k, v); }
  async remove(k: string) { this.store.delete(k); }
  async keys() { return [...this.store.keys()]; }
}

describe("StorageGateway (v2)", () => {
  let g: StorageGateway;
  let d: MemDriver;
  beforeEach(() => {
    d = new MemDriver();
    g = new StorageGateway(d, new ConsoleLogger("test", "error"));
  });

  it("returns null for missing keys", async () => {
    const r = await g.read("projects");
    expect(r.ok && r.value === null).toBe(true);
  });

  it("round-trips an empty projects list with current version", async () => {
    const w = await g.write("projects", []);
    expect(w.ok).toBe(true);
    const r = await g.read("projects");
    expect(r.ok).toBe(true);
  });

  it("migrates v1 settings:user to v2 (preserving theme, renaming defaultCompressionMode -> defaultRenderMode)", async () => {
    await d.set("settings:user", { __v: 1, data: { defaultCompressionMode: "dedupe", theme: "dark", autoCaptureOnSubmit: true } });
    const r = await g.read("settings:user");
    expect(r.ok).toBe(true);
    if (r.ok && r.value) {
      expect(r.value.defaultRenderMode).toBe("dedupe");
      expect(r.value.theme).toBe("dark");
      expect(r.value.activeProjectId).toBe(null);
    }
  });

  it("quarantines invalid data", async () => {
    await d.set("projects", { __v: 2, data: { bogus: true } });
    const r = await g.read("projects");
    expect(r.ok).toBe(false);
    expect((await d.keys()).some((k) => k.startsWith("quarantine:projects:"))).toBe(true);
  });
});
