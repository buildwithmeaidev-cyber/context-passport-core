import type { ContinuityRenderStrategy, RenderInput, RenderOutput } from "./ContinuityRenderStrategy";
import { strategies as defaultStrategies } from "./strategies";
import type { LicenseService } from "@/services/license/LicenseService";
import { type Result, ok, err, appError } from "@/core/result";

export class ContinuityService {
  private readonly registry = new Map<string, ContinuityRenderStrategy>();

  constructor(private readonly license: LicenseService, strategies: readonly ContinuityRenderStrategy[] = defaultStrategies) {
    for (const s of strategies) this.registry.set(s.id, s);
  }

  list(): readonly ContinuityRenderStrategy[] {
    return [...this.registry.values()];
  }

  listForUi(): readonly (ContinuityRenderStrategy & { available: boolean })[] {
    return this.list().map((s) => ({ ...s, available: this.license.canUseContinuityMode(s.id) }));
  }

  render(modeId: string, input: RenderInput): Result<RenderOutput> {
    const strat = this.registry.get(modeId);
    if (!strat) return err(appError("VALIDATION", `Unknown render mode: ${modeId}`));
    if (strat.premium && !this.license.canUseContinuityMode(modeId)) {
      return err(appError("PREMIUM_REQUIRED", `Mode "${strat.label}" requires Pro.`));
    }
    try {
      return ok(strat.render(input));
    } catch (e) {
      return err(appError("UNKNOWN", "Render failed", e));
    }
  }
}
