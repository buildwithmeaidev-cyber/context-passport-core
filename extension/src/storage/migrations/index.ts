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

// v3 -> v4: captures gain `turnHashes`; settings gain capture-mode + active-capture-lock.
// Zod defaults fill any missing fields on read, so this is a pass-through bump.
const v3ToV4 = (_key: string, v: Versioned<unknown>): Versioned<unknown> => {
  return { __v: 4, data: v.data };
};

// v4 -> v5: projects gain `lastCaptureUndo`. Additive; zod default fills missing field.
const v4ToV5 = (key: string, v: Versioned<unknown>): Versioned<unknown> => {
  if (key === "projects" && Array.isArray(v.data)) {
    return {
      __v: 5,
      data: (v.data as Array<Record<string, unknown>>).map((p) => ({
        ...p,
        lastCaptureUndo: p.lastCaptureUndo ?? null,
      })),
    };
  }
  return { __v: 5, data: v.data };
};

// v5 -> v6: captures gain thread identity (threadKey/threadTitle) + an
// auto-generated brief; settings gain a retention policy and paste scope.
// Additive. Thread fields are backfilled from the stored URL + provider so
// existing captures separate correctly instead of staying in one mixed pile.
const v5ToV6 = (key: string, v: Versioned<unknown>): Versioned<unknown> => {
  if (key === "projects" && Array.isArray(v.data)) {
    return {
      __v: 6,
      data: (v.data as Array<Record<string, unknown>>).map((p) => ({
        ...p,
        captures: Array.isArray(p.captures)
          ? (p.captures as Array<Record<string, unknown>>).map((c) => ({
              ...c,
              threadKey: c.threadKey ?? backfillThreadKey(String(c.providerId ?? "unknown"), String(c.url ?? "")),
              threadTitle: c.threadTitle ?? String(c.title ?? "Imported conversation"),
              brief: c.brief ?? "",
              briefOneLiner: c.briefOneLiner ?? "",
            }))
          : [],
      })),
    };
  }
  if (key === "settings:user" && v.data && typeof v.data === "object") {
    const old = v.data as Record<string, unknown>;
    return {
      __v: 6,
      data: {
        ...old,
        pasteScope: old.pasteScope ?? "thread",
        retention: old.retention ?? { enabled: true, keepLastN: 25, maxAgeDays: 90 },
      },
    };
  }
  return { __v: 6, data: v.data };
};

/**
 * Local copy of the thread-key rule. Migrations must never import runtime
 * modules whose behaviour can change — a migration has to keep producing the
 * same output forever.
 */
function backfillThreadKey(providerId: string, url: string): string {
  let normalized = url.split(/[?#]/)[0] ?? "";
  try {
    const u = new URL(url);
    normalized = `${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, "").replace(/^\/u\/\d+/, "")}`;
  } catch {
    normalized = normalized.toLowerCase();
  }
  const m = normalized.match(/\/(?:c|chat|app|search|conversation)\/([a-z0-9-]{6,})/i);
  return `${providerId}::${m?.[1]?.toLowerCase() ?? normalized}`;
}

export const migrations: Record<number, (key: string, value: Versioned<unknown>) => Versioned<unknown>> = {
  1: v1ToV2,
  2: v2ToV3,
  3: v3ToV4,
  4: v4ToV5,
  5: v5ToV6,
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
