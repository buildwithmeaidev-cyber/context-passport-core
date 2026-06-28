// Real deletion engine. Wipes every byte ContextPassport has stored locally,
// reports what was removed, and verifies the store is empty afterwards.

import type { StorageGateway, StorageDriver } from "@/storage/StorageGateway";
import type { Logger } from "@/core/logger";

export interface EraseSummary {
  projectsRemoved: number;
  capturesRemoved: number;
  passportItemsRemoved: number;
  memoryNotesRemoved: number;
  settingsRemoved: boolean;
  flagsRemoved: boolean;
  quarantineRemoved: number;
  totalKeysRemoved: number;
  verifiedEmpty: boolean;
  erasedAt: number;
}

export interface ErasePreview {
  projects: number;
  captures: number;
  passportItems: number;
  memoryNotes: number;
  hasSettings: boolean;
  hasFlagOverrides: boolean;
  quarantine: number;
  totalKeys: number;
}

export class EraseService {
  constructor(
    private readonly storage: StorageGateway,
    private readonly driver: StorageDriver,
    private readonly logger: Logger,
  ) {}

  /** Inventory of what *would* be removed. Pure read; never mutates. */
  async preview(): Promise<ErasePreview> {
    const projectsR = await this.storage.read("projects");
    const settingsR = await this.storage.read("settings:user");
    const flagsR = await this.storage.read("flags:overrides");

    const projects = projectsR.ok && projectsR.value ? projectsR.value : [];
    const captures = projects.reduce((n, p) => n + (p.captures?.length ?? 0), 0);
    const passportItems = projects.reduce((n, p) => {
      const pp = p.passport ?? {};
      return n + Object.values(pp).reduce<number>((a, list) => a + (Array.isArray(list) ? list.length : 0), 0);
    }, 0);
    const memoryNotes = projects.reduce((n, p) => n + (p.memory?.length ?? 0), 0);

    const allKeys = await this.driver.keys();
    const quarantine = allKeys.filter((k) => k.startsWith("quarantine:")).length;

    return {
      projects: projects.length,
      captures,
      passportItems,
      memoryNotes,
      hasSettings: !!(settingsR.ok && settingsR.value),
      hasFlagOverrides: !!(flagsR.ok && flagsR.value),
      quarantine,
      totalKeys: allKeys.length,
    };
  }

  /** Atomically wipe everything this extension owns, then verify. */
  async eraseAll(): Promise<EraseSummary> {
    const pre = await this.preview();
    const keys = await this.driver.keys();

    // Remove every key the extension owns. We iterate to ensure each removal
    // is observable; if one fails we still attempt the rest.
    let removed = 0;
    for (const k of keys) {
      try {
        await this.driver.remove(k);
        removed++;
      } catch (e) {
        this.logger.warn(`erase: failed to remove ${k}: ${String(e)}`);
      }
    }

    const remaining = await this.driver.keys();
    const verified = remaining.length === 0;
    if (!verified) {
      this.logger.warn(`erase: ${remaining.length} key(s) remained; forcing clear()`);
      try {
        await chrome.storage.local.clear();
      } catch (e) {
        this.logger.warn(`erase: clear() failed: ${String(e)}`);
      }
    }
    const finalKeys = await this.driver.keys();

    return {
      projectsRemoved: pre.projects,
      capturesRemoved: pre.captures,
      passportItemsRemoved: pre.passportItems,
      memoryNotesRemoved: pre.memoryNotes,
      settingsRemoved: pre.hasSettings,
      flagsRemoved: pre.hasFlagOverrides,
      quarantineRemoved: pre.quarantine,
      totalKeysRemoved: removed,
      verifiedEmpty: finalKeys.length === 0,
      erasedAt: Date.now(),
    };
  }
}
