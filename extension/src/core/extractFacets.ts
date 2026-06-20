// Heuristic, local-only extraction of the nine continuity facets from a capture.
// No LLM. Patterns are intentionally conservative: better to miss than to lie.
//
// All patterns live here so a future swap to a model-based extractor is a
// single-file change (the public extractFacets() shape stays the same).

import type { ConversationTurn } from "./tokens";
import type { FacetItem, FacetKind } from "./passport";

interface PatternRule {
  kind: FacetKind;
  /** Regex on the lowercased sentence. */
  re: RegExp;
  /** Bonus weight added to a base confidence of 0.4. */
  weight: number;
  /** Only consider sentences spoken by these roles. */
  roles?: readonly ConversationTurn["role"][];
}

const RULES: readonly PatternRule[] = [
  // Goals
  { kind: "goal", re: /\b(my goal is|the goal is|i (?:want|need|aim) to|trying to|objective is|i'm building|we're building|let's build)\b/, weight: 0.5, roles: ["user"] },
  { kind: "goal", re: /\b(success looks like|success metric)\b/, weight: 0.4 },

  // Status — "currently / right now / so far"
  { kind: "status", re: /\b(currently|right now|so far|at the moment|as of now|state of (?:the|this) project|where we are)\b/, weight: 0.45 },
  { kind: "status", re: /\b(in progress|ongoing|wip|halfway|stuck on|working on)\b/, weight: 0.5 },

  // Decisions
  { kind: "decision", re: /\b(decided to|we'll (?:use|go with)|going with|let's use|chose to|i'll use|we picked|we chose)\b/, weight: 0.5 },
  { kind: "decision", re: /\b(use \w+ instead of|switch(?:ed)? to|adopting)\b/, weight: 0.4 },

  // Constraints
  { kind: "constraint", re: /\b(must not|can't|cannot|should not|never|do not|don't|only|no more than|limited to|at most|requires?|required to)\b/, weight: 0.45 },
  { kind: "constraint", re: /\b(budget|deadline|by (?:monday|tuesday|wednesday|thursday|friday|next week|tomorrow))\b/, weight: 0.4 },

  // Progress / Completed Work
  { kind: "progress", re: /\b(done|completed|finished|implemented|shipped|added|built|created|set up|deployed|merged)\b/, weight: 0.4 },
  { kind: "progress", re: /\b(working now|works now|is working|is live)\b/, weight: 0.5 },

  // File references
  { kind: "fileRef", re: /\b[\w\-./]+\.(?:ts|tsx|js|jsx|py|go|rs|java|kt|swift|cpp|c|h|cs|rb|php|sql|md|json|ya?ml|toml|css|scss|html)\b/, weight: 0.5 },
  { kind: "fileRef", re: /\b(src\/|app\/|lib\/|tests?\/|docs?\/)[\w\-./]+/, weight: 0.4 },

  // Open questions
  { kind: "openQuestion", re: /\?$/, weight: 0.5 },
  { kind: "openQuestion", re: /\b(unclear|not sure|don't know|tbd|to be decided|open question|still need to figure)\b/, weight: 0.5 },

  // Blockers
  { kind: "blocker", re: /\b(blocked (?:by|on)|blocker|can't proceed|stuck because|waiting on|can't move forward|breaking|broken|fails? with|error[: ]|throws)\b/, weight: 0.55 },

  // Next actions
  { kind: "nextAction", re: /\b(next (?:step|i'll|we'll)|todo|to do|need to|will (?:add|implement|build|create|deploy|test|write)|i'll (?:add|implement|build|create|deploy|test|write))\b/, weight: 0.5 },
  { kind: "nextAction", re: /^(?:add|implement|build|create|deploy|test|write|fix|refactor) /, weight: 0.4 },
];

function splitSentences(text: string): string[] {
  // Preserve code blocks as one sentence each
  const blocks: string[] = [];
  const stripped = text.replace(/```[\s\S]*?```/g, (m) => {
    blocks.push(m);
    return `\u0000${blocks.length - 1}\u0000`;
  });
  const sentences = stripped
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 600);
  return sentences.map((s) =>
    s.replace(/\u0000(\d+)\u0000/g, (_, i) => blocks[Number(i)] ?? ""),
  );
}

export interface ExtractSource {
  captureId: string;
  providerId: string;
  capturedAt: number;
}

export function extractFacets(
  turns: readonly ConversationTurn[],
  source: ExtractSource,
): FacetItem[] {
  const out: FacetItem[] = [];
  for (const turn of turns) {
    const sentences = splitSentences(turn.text);
    for (const raw of sentences) {
      const lower = raw.toLowerCase();
      // A single sentence may match multiple kinds — keep all with their own confidence.
      const seen = new Set<FacetKind>();
      for (const rule of RULES) {
        if (rule.roles && !rule.roles.includes(turn.role)) continue;
        if (seen.has(rule.kind)) continue;
        if (!rule.re.test(lower)) continue;
        seen.add(rule.kind);
        out.push({
          id: crypto.randomUUID(),
          kind: rule.kind,
          text: raw.trim(),
          source: { ...source, role: turn.role },
          confidence: clamp(0.4 + rule.weight, 0, 1),
          pinned: false,
          dismissed: false,
        });
      }
    }
  }
  return out;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
