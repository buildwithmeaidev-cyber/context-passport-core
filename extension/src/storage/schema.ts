import { z } from "zod";

export const CURRENT_VERSION = 1 as const;

export interface Versioned<T> {
  __v: number;
  data: T;
}

const turnSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  text: z.string(),
});

const conversationSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  url: z.string(),
  title: z.string(),
  turns: z.array(turnSchema),
  capturedAt: z.number(),
  tags: z.array(z.string()).default([]),
});

export const schemas = {
  "vault:conversations": z.array(conversationSchema),
  "vault:index": z.object({
    byId: z.record(z.string(), z.object({ title: z.string(), providerId: z.string(), capturedAt: z.number() })),
  }),
  "settings:user": z.object({
    defaultCompressionMode: z.string().default("dedupe"),
    autoCaptureOnSubmit: z.boolean().default(false),
    theme: z.enum(["system", "light", "dark"]).default("system"),
  }),
  "flags:overrides": z.record(z.string(), z.boolean()),
  "meta:schemaVersion": z.object({ version: z.number() }),
} as const;

export type DataMap = {
  "vault:conversations": z.infer<typeof schemas["vault:conversations"]>;
  "vault:index": z.infer<typeof schemas["vault:index"]>;
  "settings:user": z.infer<typeof schemas["settings:user"]>;
  "flags:overrides": z.infer<typeof schemas["flags:overrides"]>;
  "meta:schemaVersion": z.infer<typeof schemas["meta:schemaVersion"]>;
};

export type NamespaceKey = keyof typeof schemas;
export type Conversation = z.infer<typeof conversationSchema>;
