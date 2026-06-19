// Versioned storage gateway with forward-only migrations.
// All writes are tagged with __v = CURRENT_VERSION. All reads validate and
// migrate. Invalid data is moved to a quarantine namespace, never dropped.

import { type Result, ok, err, appError } from "@/core/result";
import type { Logger } from "@/core/logger";
import { CURRENT_VERSION, schemas, type Versioned, type DataMap, type NamespaceKey } from "./schema";
import { migrations } from "./migrations";

export interface StorageDriver {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export class ChromeLocalDriver implements StorageDriver {
  async get<T>(key: string): Promise<T | undefined> {
    const r = await chrome.storage.local.get(key);
    return r[key] as T | undefined;
  }
  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }
  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }
  async keys(): Promise<string[]> {
    const all = await chrome.storage.local.get(null);
    return Object.keys(all);
  }
}

export class StorageGateway {
  constructor(private readonly driver: StorageDriver, private readonly logger: Logger) {}

  async read<K extends NamespaceKey>(key: K): Promise<Result<DataMap[K] | null>> {
    try {
      const raw = await this.driver.get<Versioned<unknown>>(key);
      if (raw === undefined) return ok(null);
      const migrated = this.migrate(key, raw);
      if (!migrated.ok) return migrated;
      const parsed = schemas[key].safeParse(migrated.value.data);
      if (!parsed.success) {
        await this.quarantine(key, raw, parsed.error.message);
        return err(appError("VALIDATION", `Invalid data at ${key}`, parsed.error));
      }
      // Persist migrated form if version changed
      if (migrated.value.__v !== raw.__v) {
        await this.driver.set(key, migrated.value);
      }
      return ok(parsed.data as DataMap[K]);
    } catch (e) {
      return err(appError("STORAGE_READ", `read(${key}) failed`, e));
    }
  }

  async write<K extends NamespaceKey>(key: K, data: DataMap[K]): Promise<Result<true>> {
    try {
      const parsed = schemas[key].safeParse(data);
      if (!parsed.success) return err(appError("VALIDATION", `write(${key}) invalid`, parsed.error));
      const wrapped: Versioned<DataMap[K]> = { __v: CURRENT_VERSION, data: parsed.data as DataMap[K] };
      await this.driver.set(key, wrapped);
      return ok(true);
    } catch (e) {
      return err(appError("STORAGE_WRITE", `write(${key}) failed`, e));
    }
  }

  async remove(key: NamespaceKey): Promise<void> {
    await this.driver.remove(key);
  }

  private migrate(key: NamespaceKey, raw: Versioned<unknown>): Result<Versioned<unknown>> {
    let current: Versioned<unknown> = raw;
    while (current.__v < CURRENT_VERSION) {
      const fn = migrations[current.__v];
      if (!fn) return err(appError("MIGRATION_FAILED", `No migration from v${current.__v}`));
      try {
        current = fn(key, current);
      } catch (e) {
        return err(appError("MIGRATION_FAILED", `migration v${current.__v} failed`, e));
      }
    }
    return ok(current);
  }

  private async quarantine(key: string, raw: unknown, reason: string): Promise<void> {
    const qKey = `quarantine:${key}:${Date.now()}`;
    this.logger.warn(`Quarantining invalid data at ${key}: ${reason}`);
    await this.driver.set(qKey, { reason, raw });
  }
}
