import type { CompressionStrategy, CompressionInput, CompressionOutput } from "./CompressionStrategy";
import { strategies as defaultStrategies } from "./strategies";
import type { LicenseService } from "@/services/license/LicenseService";
import { type Result, ok, err, appError } from "@/core/result";

export class CompressionService {
  private readonly registry = new Map<string, CompressionStrategy>();

  constructor(private readonly license: LicenseService, strategies: readonly CompressionStrategy[] = defaultStrategies) {
    for (const s of strategies) this.registry.set(s.id, s);
  }

  list(): readonly CompressionStrategy[] {
    return [...this.registry.values()];
  }

  /** UI uses this to render mode selector with disabled state. */
  listForUi(): readonly (CompressionStrategy & { available: boolean })[] {
    return this.list().map((s) => ({ ...s, available: this.license.canUseCompression(s.id) }));
  }

  run(modeId: string, input: CompressionInput): Result<CompressionOutput> {
    const strat = this.registry.get(modeId);
    if (!strat) return err(appError("VALIDATION", `Unknown compression mode: ${modeId}`));
    if (strat.premium && !this.license.canUseCompression(modeId)) {
      return err(appError("PREMIUM_REQUIRED", `Mode "${strat.label}" requires premium.`));
    }
    try {
      return ok(strat.run(input));
    } catch (e) {
      return err(appError("UNKNOWN", `Compression failed`, e));
    }
  }
}
