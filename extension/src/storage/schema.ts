import { z } from "zod";

export const CURRENT_VERSION = 6 as const;

export interface Versioned<T> {
  __v: number;
  data: T;
}

const turnSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  text: z.string(),
});

// v1 conversation, kept for migration only.
export const legacyConversationSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  url: z.string(),
  title: z.string(),
  turns: z.array(turnSchema),
  capturedAt: z.number(),
  tags: z.array(z.string()).default([]),
});
export type LegacyConversation = z.infer<typeof legacyConversationSchema>;

const facetSourceSchema = z.object({
  captureId: z.string(),
  providerId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  capturedAt: z.number(),
});

const facetItemSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "goal",
    "status",
    "decision",
    "constraint",
    "progress",
    "fileRef",
    "openQuestion",
    "blocker",
    "nextAction",
  ]),
  text: z.string(),
  source: facetSourceSchema,
  confidence: z.number().min(0).max(1),
  pinned: z.boolean().default(false),
  dismissed: z.boolean().default(false),
});

const passportSchema = z.object({
  goals: z.array(facetItemSchema).default([]),
  status: z.array(facetItemSchema).default([]),
  decisions: z.array(facetItemSchema).default([]),
  constraints: z.array(facetItemSchema).default([]),
  progress: z.array(facetItemSchema).default([]),
  filesReferenced: z.array(facetItemSchema).default([]),
  openQuestions: z.array(facetItemSchema).default([]),
  blockers: z.array(facetItemSchema).default([]),
  nextActions: z.array(facetItemSchema).default([]),
});

const captureSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  url: z.string(),
  title: z.string(),
  turns: z.array(turnSchema),
  capturedAt: z.number(),
  /** Stable hashes for each stored turn — enables cross-capture dedup that survives DOM drift. */
  turnHashes: z.array(z.string()).default([]),
  /**
   * Conversation thread this capture belongs to (provider + conversation id).
   * Captures from different AI chats never share a key, which is what keeps
   * their context from blending together.
   */
  threadKey: z.string().default(""),
  /** Human, stable name for the thread — e.g. "Claude · Migrate billing to Stripe". */
  threadTitle: z.string().default(""),
  /** Deep auto-generated markdown brief for this capture's thread. */
  brief: z.string().default(""),
  /** One-line gist used in list rows. */
  briefOneLiner: z.string().default(""),
});


const developerInsightsSchema = z.object({
  techStack: z.array(z.string()).default([]),
  architecture: z.array(z.string()).default([]),
  apis: z.array(z.string()).default([]),
  dbDesign: z.array(z.string()).default([]),
  bugs: z.array(z.string()).default([]),
  todos: z.array(z.string()).default([]),
});

const researchInsightsSchema = z.object({
  findings: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  contradictions: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
});

const founderInsightsSchema = z.object({
  problem: z.array(z.string()).default([]),
  market: z.array(z.string()).default([]),
  revenueModel: z.array(z.string()).default([]),
  validation: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});

const intelligenceSchema = z.object({
  conversationType: z.enum(["developer", "research", "founder", "general"]).default("general"),
  developer: developerInsightsSchema.default({
    techStack: [], architecture: [], apis: [], dbDesign: [], bugs: [], todos: [],
  }),
  research: researchInsightsSchema.default({
    findings: [], sources: [], contradictions: [], openQuestions: [],
  }),
  founder: founderInsightsSchema.default({
    problem: [], market: [], revenueModel: [], validation: [], risks: [],
  }),
  updatedAt: z.number().default(0),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  createdAt: z.number(),
  updatedAt: z.number(),
  passport: passportSchema,
  /** Recent captures used to build the passport. Capped — see STORAGE_SCHEMA. */
  captures: z.array(captureSchema).default([]),
  /** Domain-specific extracted insights (developer/research/founder). */
  intelligence: intelligenceSchema.default({
    conversationType: "general",
    developer: { techStack: [], architecture: [], apis: [], dbDesign: [], bugs: [], todos: [] },
    research: { findings: [], sources: [], contradictions: [], openQuestions: [] },
    founder: { problem: [], market: [], revenueModel: [], validation: [], risks: [] },
    updatedAt: 0,
  }),
  /** Persistent project memory: free-form notes the user wants kept across sessions. */
  memory: z.array(z.object({
    id: z.string(),
    text: z.string(),
    createdAt: z.number(),
  })).default([]),
  /** Undo record for the most recent capture. Overwritten on each ingest; cleared after undo. */
  lastCaptureUndo: z.object({
    captureId: z.string(),
    previousActiveCaptureId: z.string().nullable(),
    capturedAt: z.number(),
  }).nullable().default(null),
});

export const schemas = {
  "projects": z.array(projectSchema),
  "settings:user": z.object({
    activeProjectId: z.string().nullable().default(null),
    defaultRenderMode: z.string().default("balanced"),
    theme: z.enum(["system", "light", "dark"]).default("system"),
    onboardingSeenAt: z.number().nullable().default(null),
    /** Per-project "active capture" lock — subsequent pastes use this capture until changed. */
    activeCaptureByProject: z.record(z.string(), z.string()).default({}),
    /** How much of the page to extract each time. */
    captureMode: z.enum(["full", "since-last", "last-n"]).default("since-last"),
    /** Only used when captureMode === "last-n". */
    captureLastN: z.number().int().min(1).max(200).default(20),
    /** Skip the pre-capture preview modal and capture immediately. */
    skipCapturePreview: z.boolean().default(false),
    /**
     * How much of the passport a paste uses:
     *   "thread"  — only the selected conversation thread (no mixing)
     *   "project" — every thread in the project
     */
    pasteScope: z.enum(["thread", "project"]).default("thread"),
    /** Automatic pruning of old captures. */
    retention: z.object({
      enabled: z.boolean().default(true),
      keepLastN: z.number().int().min(1).max(500).default(25),
      /** 0 disables the age rule. */
      maxAgeDays: z.number().int().min(0).max(3650).default(90),
    }).default({ enabled: true, keepLastN: 25, maxAgeDays: 90 }),
  }),

  "flags:overrides": z.record(z.string(), z.boolean()),
  "meta:schemaVersion": z.object({ version: z.number() }),
} as const;

export type DataMap = {
  "projects": z.infer<typeof schemas["projects"]>;
  "settings:user": z.infer<typeof schemas["settings:user"]>;
  "flags:overrides": z.infer<typeof schemas["flags:overrides"]>;
  "meta:schemaVersion": z.infer<typeof schemas["meta:schemaVersion"]>;
};

export type NamespaceKey = keyof typeof schemas;
export type Project = z.infer<typeof projectSchema>;
export type Capture = z.infer<typeof captureSchema>;
export type StoredFacetItem = z.infer<typeof facetItemSchema>;
export type StoredPassport = z.infer<typeof passportSchema>;
export type DeveloperInsights = z.infer<typeof developerInsightsSchema>;
export type ResearchInsights = z.infer<typeof researchInsightsSchema>;
export type FounderInsights = z.infer<typeof founderInsightsSchema>;
export type ProjectIntelligence = z.infer<typeof intelligenceSchema>;
export type ProjectMemoryNote = Project["memory"][number];
