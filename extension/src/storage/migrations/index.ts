import type { Versioned } from "../schema";
import type { LegacyConversation } from "../schema";

/**
 * migrations[N] migrates a Versioned<unknown> from version N to N+1.
 * Append-only. Never modify an existing entry.
 */

// v1 -> v2: legacy `vault:conversations` is replaced by `projects`.
const v1ToV2 = (key: string, v: Versioned<unknown>): Versioned<unknown> => {
  if (key === "projects") {
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

// v2 -> v3: passport gains three new facets (status, filesReferenced, blockers);
// projects gain `intelligence` and `memory`. Zod defaults fill the rest.
const v2ToV3 = (key: string, v: Versioned<unknown>): Versioned<unknown> => {
  if (key === "projects" && Array.isArray(v.data)) {
    const projects = v.data as Array<Record<string, unknown>>;
    return {
      __v: 3,
      data: projects.map((p) => {
        const passport = (p.passport ?? {}) as Record<string, unknown>;
        return {
          ...p,
          passport: {
            ...passport,
            status: Array.isArray(passport.status) ? passport.status : [],
            filesReferenced: Array.isArray(passport.filesReferenced) ? passport.filesReferenced : [],
            blockers: Array.isArray(passport.blockers) ? passport.blockers : [],
          },
          intelligence: p.intelligence ?? {
            conversationType: "general",
            developer: { techStack: [], architecture: [], apis: [], dbDesign: [], bugs: [], todos: [] },
            research: { findings: [], sources: [], contradictions: [], openQuestions: [] },
            founder: { problem: [], market: [], revenueModel: [], validation: [], risks: [] },
            updatedAt: 0,
          },
          memory: Array.isArray(p.memory) ? p.memory : [],
        };
      }),
    };
  }
  return { __v: 3, data: v.data };
};

export const migrations: Record<number, (key: string, value: Versioned<unknown>) => Versioned<unknown>> = {
  1: v1ToV2,
  2: v2ToV3,
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
      goals: [], status: [], decisions: [], constraints: [],
      progress: [], filesReferenced: [], openQuestions: [], blockers: [], nextActions: [],
    },
    captures: legacy.map((c) => ({
      id: c.id,
      providerId: c.providerId,
      url: c.url,
      title: c.title,
      turns: c.turns,
      capturedAt: c.capturedAt,
    })),
    intelligence: {
      conversationType: "general",
      developer: { techStack: [], architecture: [], apis: [], dbDesign: [], bugs: [], todos: [] },
      research: { findings: [], sources: [], contradictions: [], openQuestions: [] },
      founder: { problem: [], market: [], revenueModel: [], validation: [], risks: [] },
      updatedAt: now,
    },
    memory: [],
  };
  return [project];
}
