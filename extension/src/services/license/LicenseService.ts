import { type FeatureId, type PricingPlan, planById } from "./plans";

/**
 * LicenseService — single source of truth for "can the user do X?"
 *
 * Today: always returns "free" (no backend). The public API is the same shape
 * a future server-backed implementation will use, so feature code never changes.
 */
export class LicenseService {
  private currentPlan: PricingPlan = planById("free");

  plan(): PricingPlan {
    return this.currentPlan;
  }

  has(feature: FeatureId): boolean {
    return this.currentPlan.features.includes(feature);
  }

  canUseCompression(modeId: string): boolean {
    return this.has(`compression:${modeId}` as FeatureId);
  }

  vaultLimit(): number {
    return this.currentPlan.limits.vaultMaxItems;
  }

  /** Test seam + future server integration point. Do NOT call from UI. */
  _setPlanForTesting(id: PricingPlan["id"]): void {
    this.currentPlan = planById(id);
  }
}
