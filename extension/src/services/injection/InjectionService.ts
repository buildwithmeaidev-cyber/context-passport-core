import type { ProviderRegistry } from "@/providers/registry";
import type { FeatureFlagService } from "@/services/license/FeatureFlagService";
import { type Result, err, appError } from "@/core/result";

export class InjectionService {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly flags: FeatureFlagService,
  ) {}

  inject(url: string, text: string): Result<true> {
    const adapter = this.registry.resolveByUrl(url);
    if (!adapter) return err(appError("ADAPTER_NOT_FOUND", `No adapter for ${url}`));
    if (!this.flags.isEnabled(`providers.${adapter.id}.enabled`)) {
      return err(appError("FEATURE_DISABLED", `Provider ${adapter.id} is disabled.`));
    }
    return adapter.injectPrompt(text);
  }
}
