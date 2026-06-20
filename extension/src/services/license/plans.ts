// Pricing is config-only. Adding a tier or moving a feature between tiers is
// a one-line edit. No code in features/ or services/ should hardcode a tier.

export type FeatureId =
  | "capture"
  | "inject"
  | "projects-unlimited"
  | "export"
  | "intelligence:developer"
  | "intelligence:research"
  | "intelligence:founder"
  | "memory"
  | `continuity:${string}`;

export interface PricingPlan {
  id: "free" | "pro" | "team";
  label: string;
  monthlyPriceUsd: number;
  features: readonly FeatureId[];
  limits: {
    projectsMax: number;       // 0 = unlimited
    capturesPerProject: number; // 0 = unlimited (enforced elsewhere)
  };
}

const FREE_FEATURES: FeatureId[] = [
  "capture",
  "inject",
  "continuity:quick",
  "continuity:balanced",
  // legacy modes kept usable on free
  "continuity:brief",
  "continuity:essential",
  "continuity:full",
];

const PRO_FEATURES: FeatureId[] = [
  ...FREE_FEATURES,
  "continuity:handoff",
  "continuity:developer-handoff",
  "continuity:research-handoff",
  "continuity:founder-handoff",
  "intelligence:developer",
  "intelligence:research",
  "intelligence:founder",
  "memory",
  "projects-unlimited",
  "export",
];

export const PLANS: readonly PricingPlan[] = [
  {
    id: "free",
    label: "Free",
    monthlyPriceUsd: 0,
    features: FREE_FEATURES,
    limits: { projectsMax: 3, capturesPerProject: 20 },
  },
  {
    id: "pro",
    label: "Pro",
    monthlyPriceUsd: 6,
    features: PRO_FEATURES,
    limits: { projectsMax: 0, capturesPerProject: 0 },
  },
  {
    id: "team",
    label: "Team",
    monthlyPriceUsd: 14,
    features: PRO_FEATURES,
    limits: { projectsMax: 0, capturesPerProject: 0 },
  },
];

export function planById(id: PricingPlan["id"]): PricingPlan {
  const p = PLANS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown plan: ${id}`);
  return p;
}
