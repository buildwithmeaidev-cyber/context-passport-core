import { type FeatureId, type PricingPlan, planById } from "./plans";

export class LicenseService {
  private currentPlan: PricingPlan = planById("free");

  plan(): PricingPlan {
    return this.currentPlan;
  }

  has(feature: FeatureId): boolean {
    return this.currentPlan.features.includes(feature);
  }

  canUseContinuityMode(modeId: string): boolean {
    return this.has(`continuity:${modeId}` as FeatureId);
  }

  canUseIntelligence(domain: "developer" | "research" | "founder"): boolean {
    return this.has(`intelligence:${domain}` as FeatureId);
  }

  canUseMemory(): boolean {
    return this.has("memory");
  }

  projectLimit(): number {
    return this.currentPlan.limits.projectsMax;
  }

  _setPlanForTesting(id: PricingPlan["id"]): void {
    this.currentPlan = planById(id);
  }
}
