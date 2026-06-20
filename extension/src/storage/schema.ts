import { z } from "zod";

export const CURRENT_VERSION = 3 as const;

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
});

export const schemas = {
  "projects": z.array(projectSchema),
  "settings:user": z.object({
    activeProjectId: z.string().nullable().default(null),
    defaultRenderMode: z.string().default("balanced"),
    theme: z.enum(["system", "light", "dark"]).default("system"),
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
