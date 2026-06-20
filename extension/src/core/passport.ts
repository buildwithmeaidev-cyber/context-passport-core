// Domain model for AI Work Continuity.
// A Project owns a ContextPassport: nine structured facets that survive across
// AI systems. Captures are inputs; the passport is the durable artifact.

export type FacetKind =
  | "goal"
  | "status"
  | "decision"
  | "constraint"
  | "progress"
  | "fileRef"
  | "openQuestion"
  | "blocker"
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
  status: FacetItem[];
  decisions: FacetItem[];
  constraints: FacetItem[];
  progress: FacetItem[];
  filesReferenced: FacetItem[];
  openQuestions: FacetItem[];
  blockers: FacetItem[];
  nextActions: FacetItem[];
}

export const EMPTY_PASSPORT: ContextPassport = {
  goals: [],
  status: [],
  decisions: [],
  constraints: [],
  progress: [],
  filesReferenced: [],
  openQuestions: [],
  blockers: [],
  nextActions: [],
};

export const FACET_LABELS: Record<FacetKind, string> = {
  goal: "Project Goal",
  status: "Current Status",
  decision: "Important Decisions",
  constraint: "Constraints",
  progress: "Completed Work",
  fileRef: "Files Referenced",
  openQuestion: "Open Questions",
  blocker: "Blockers",
  nextAction: "Next Actions",
};

export const FACET_TO_FIELD: Record<FacetKind, keyof ContextPassport> = {
  goal: "goals",
  status: "status",
  decision: "decisions",
  constraint: "constraints",
  progress: "progress",
  fileRef: "filesReferenced",
  openQuestion: "openQuestions",
  blocker: "blockers",
  nextAction: "nextActions",
};

/** Order used for canonical render output across all modes. */
export const FACET_ORDER: readonly FacetKind[] = [
  "goal",
  "status",
  "progress",
  "decision",
  "constraint",
  "fileRef",
  "openQuestion",
  "blocker",
  "nextAction",
];
