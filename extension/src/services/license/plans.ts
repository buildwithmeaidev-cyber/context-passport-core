// Pricing is config-only. Adding a tier or moving a feature between tiers is
// a one-line edit. No code in features/ or services/ should hardcode a tier.

export type FeatureId =
  | "capture"
  | "inject"
  | "vault-unlimited"
  | "export"
  | `compression:${string}`;

export interface PricingPlan {
  id: "free" | "pro" | "team";
  label: string;
  monthlyPriceUsd: number;
  features: readonly FeatureId[];
  /** Soft caps. 0 means unlimited. */
  limits: {
    vaultMaxItems: number;
  };
}

export const PLANS: readonly PricingPlan[] = [
  {
    id: "free",
    label: "Free",
    monthlyPriceUsd: 0,
    features: [
      "capture",
      "inject",
      "compression:none",
      "compression:dedupe",
      "compression:summarize-heuristic",
    ],
    limits: { vaultMaxItems: 50 },
  },
  {
    id: "pro",
    label: "Pro",
    monthlyPriceUsd: 5,
    features: [
      "capture",
      "inject",
      "compression:none",
      "compression:dedupe",
      "compression:summarize-heuristic",
      "compression:aggressive",
      "vault-unlimited",
      "export",
    ],
    limits: { vaultMaxItems: 0 },
  },
  {
    id: "team",
    label: "Team",
    monthlyPriceUsd: 12,
    features: [
      "capture",
      "inject",
      "compression:none",
      "compression:dedupe",
      "compression:summarize-heuristic",
      "compression:aggressive",
      "vault-unlimited",
      "export",
    ],
    limits: { vaultMaxItems: 0 },
  },
];

export function planById(id: PricingPlan["id"]): PricingPlan {
  const p = PLANS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown plan: ${id}`);
  return p;
}
