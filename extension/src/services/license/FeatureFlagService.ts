import type { StorageGateway } from "@/storage/StorageGateway";
import type { LicenseService } from "./LicenseService";

/**
 * FeatureFlagService — three-layer resolution:
 *   1. user override   (storage: flags:overrides)
 *   2. license tier    (LicenseService)
 *   3. compile-time default
 */
export class FeatureFlagService {
  private overrides: Record<string, boolean> = {};
  private loaded = false;

  constructor(
    private readonly storage: StorageGateway,
    private readonly license: LicenseService,
    private readonly defaults: Readonly<Record<string, boolean>> = {
      "providers.chatgpt.enabled": true,
      "providers.claude.enabled": true,
      "providers.gemini.enabled": true,
      "ui.showPremiumUpsell": true,
      "privacy.allowLocalStorage": true,
      "privacy.allowInjection": true,
    },
  ) {}

  async load(): Promise<void> {
    const r = await this.storage.read("flags:overrides");
    if (r.ok && r.value) this.overrides = r.value;
    this.loaded = true;
  }

  isEnabled(flag: string): boolean {
    if (!this.loaded) {
      // Conservative default if accessed before load(): use defaults only.
      return this.defaults[flag] ?? false;
    }
    if (flag in this.overrides) return this.overrides[flag] === true;
    // license-derived flags can be added here later
    void this.license;
    return this.defaults[flag] ?? false;
  }

  async set(flag: string, value: boolean): Promise<void> {
    this.overrides[flag] = value;
    await this.storage.write("flags:overrides", this.overrides);
  }
}
