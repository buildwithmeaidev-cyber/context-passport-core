import type { ProviderRegistry } from "@/providers/registry";
import type { VaultService } from "@/services/vault/VaultService";
import type { FeatureFlagService } from "@/services/license/FeatureFlagService";
import type { CapturedConversation } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";

/**
 * CaptureService — must run inside the content-script runtime (needs DOM).
 * In background/popup, use messaging.sendToActiveTab() instead.
 */
export class CaptureService {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly vault: VaultService,
    private readonly flags: FeatureFlagService,
  ) {}

  capture(url: string): Result<CapturedConversation> {
    const adapter = this.registry.resolveByUrl(url);
    if (!adapter) return err(appError("ADAPTER_NOT_FOUND", `No adapter for ${url}`));
    if (!this.flags.isEnabled(`providers.${adapter.id}.enabled`)) {
      return err(appError("FEATURE_DISABLED", `Provider ${adapter.id} is disabled.`));
    }
    const extracted = adapter.extractConversation();
    if (!extracted.ok) return err(extracted.error);
    const captured: CapturedConversation = {
      providerId: adapter.id,
      url,
      title: extracted.value.title,
      turns: extracted.value.turns,
      capturedAt: Date.now(),
    };
    return ok(captured);
  }

  async captureAndSave(url: string): Promise<Result<CapturedConversation>> {
    const c = this.capture(url);
    if (!c.ok) return c;
    const saved = await this.vault.save(c.value);
    if (!saved.ok) return err(saved.error);
    return ok(c.value);
  }
}
