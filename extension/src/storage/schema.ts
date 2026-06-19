import { z } from "zod";

export const CURRENT_VERSION = 2 as const;

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
  kind: z.enum(["goal", "decision", "constraint", "progress", "openQuestion", "nextAction"]),
  text: z.string(),
  source: facetSourceSchema,
  confidence: z.number().min(0).max(1),
  pinned: z.boolean().default(false),
  dismissed: z.boolean().default(false),
});

const passportSchema = z.object({
  goals: z.array(facetItemSchema).default([]),
  decisions: z.array(facetItemSchema).default([]),
  constraints: z.array(facetItemSchema).default([]),
  progress: z.array(facetItemSchema).default([]),
  openQuestions: z.array(facetItemSchema).default([]),
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

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  createdAt: z.number(),
  updatedAt: z.number(),
  passport: passportSchema,
  /** Recent captures used to build the passport. Capped — see STORAGE_SCHEMA. */
  captures: z.array(captureSchema).default([]),
});

export const schemas = {
  "projects": z.array(projectSchema),
  "settings:user": z.object({
    activeProjectId: z.string().nullable().default(null),
    defaultRenderMode: z.string().default("essential"),
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
