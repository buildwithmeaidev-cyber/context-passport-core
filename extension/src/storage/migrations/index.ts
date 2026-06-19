import type { Versioned } from "../schema";
import type { LegacyConversation } from "../schema";

/**
 * migrations[N] migrates a Versioned<unknown> from version N to N+1.
 * Append-only. Never modify an existing entry.
 */

// v1 -> v2: legacy `vault:conversations` is replaced by `projects`.
// We wrap any pre-existing conversations into a single "Legacy import" project.
// The old key is left alone (gateway ignores unknown keys); STORAGE_SCHEMA.md
// documents that users can clear it manually.
const v1ToV2 = (key: string, v: Versioned<unknown>): Versioned<unknown> => {
  if (key === "projects") {
    // If someone wrote a v1 projects key directly (shouldn't happen), pass through.
    return { __v: 2, data: v.data };
  }
  if (key === "settings:user") {
    const old = (v.data ?? {}) as Record<string, unknown>;
    return {
      __v: 2,
      data: {
        activeProjectId: null,
        defaultRenderMode: typeof old["defaultCompressionMode"] === "string" ? old["defaultCompressionMode"] : "essential",
        theme: old["theme"] ?? "system",
      },
    };
  }
  return { __v: 2, data: v.data };
};

export const migrations: Record<number, (key: string, value: Versioned<unknown>) => Versioned<unknown>> = {
  1: v1ToV2,
};

/** One-shot import called by background onInstalled when bumping from v1. */
export function importLegacyConversations(
  legacy: LegacyConversation[],
  now: number,
): unknown {
  if (legacy.length === 0) return [];
  const project = {
    id: crypto.randomUUID(),
    name: "Legacy import",
    description: `Imported ${legacy.length} conversation${legacy.length === 1 ? "" : "s"} from the previous version.`,
    createdAt: now,
    updatedAt: now,
    passport: {
      goals: [], decisions: [], constraints: [],
      progress: [], openQuestions: [], nextActions: [],
    },
    captures: legacy.map((c) => ({
      id: c.id,
      providerId: c.providerId,
      url: c.url,
      title: c.title,
      turns: c.turns,
      capturedAt: c.capturedAt,
    })),
  };
  return [project];
}
