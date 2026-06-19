// Domain model for AI Work Continuity.
// A Project owns a ContextPassport: six structured facets that survive across
// AI systems. Captures are inputs; the passport is the durable artifact.

export type FacetKind =
  | "goal"
  | "decision"
  | "constraint"
  | "progress"
  | "openQuestion"
  | "nextAction";

export interface FacetItem {
  id: string;
  kind: FacetKind;
  text: string;
  /** Provenance: where this item was extracted from. */
  source: {
    captureId: string;
    providerId: string;
    role: "user" | "assistant" | "system";
    capturedAt: number;
  };
  /** 0..1 heuristic confidence — used for ranking and UI dimming. */
  confidence: number;
  /** True when the user manually edited or pinned this item. Survives re-merges. */
  pinned: boolean;
  /** True when the user dismissed this item. Stays hidden on future merges. */
  dismissed: boolean;
}

export interface ContextPassport {
  goals: FacetItem[];
  decisions: FacetItem[];
  constraints: FacetItem[];
  progress: FacetItem[];
  openQuestions: FacetItem[];
  nextActions: FacetItem[];
}

export const EMPTY_PASSPORT: ContextPassport = {
  goals: [],
  decisions: [],
  constraints: [],
  progress: [],
  openQuestions: [],
  nextActions: [],
};

export const FACET_LABELS: Record<FacetKind, string> = {
  goal: "Goals",
  decision: "Decisions",
  constraint: "Constraints",
  progress: "Progress",
  openQuestion: "Open Questions",
  nextAction: "Next Actions",
};

export const FACET_TO_FIELD: Record<FacetKind, keyof ContextPassport> = {
  goal: "goals",
  decision: "decisions",
  constraint: "constraints",
  progress: "progress",
  openQuestion: "openQuestions",
  nextAction: "nextActions",
};
