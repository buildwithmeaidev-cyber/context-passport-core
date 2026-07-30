// ThreadSummarizer — builds a deep, structured brief for one conversation
// thread so a receiving AI can continue the work without being re-explained
// anything.
//
// Fully local: no LLM, no network. Everything is derived from the captured
// turns with conservative heuristics. The output is deliberately verbose and
// concrete (timeline, code refs, verbatim excerpts with provenance) because
// the failure mode we're fixing is "the pasted context is too thin to use".

import type { ConversationTurn } from "@/core/tokens";
import { extractFacets } from "@/core/extractFacets";
import type { FacetItem, FacetKind } from "@/core/passport";
import { deriveTopic } from "@/core/threadKey";

export interface ThreadBriefInput {
  threadTitle: string;
  providerId: string;
  capturedAt: number;
  turns: readonly ConversationTurn[];
}

export interface ThreadBrief {
  topic: string;
  oneLiner: string;
  /** Markdown block injected at the top of every handoff render. */
  markdown: string;
  stats: {
    turns: number;
    userTurns: number;
    assistantTurns: number;
    words: number;
    codeBlocks: number;
  };
}

const MAX_ITEMS_PER_SECTION = 8;
const MAX_EXCERPT_CHARS = 420;

export class ThreadSummarizer {
  summarize(input: ThreadBriefInput): ThreadBrief {
    const turns = input.turns.filter((t) => (t.text ?? "").trim().length > 0);
    const topic = deriveTopic(turns, input.threadTitle || "Conversation");
    const facets = extractFacets(turns, {
      captureId: "thread-brief",
      providerId: input.providerId,
      capturedAt: input.capturedAt,
    });

    const byKind = (kind: FacetKind): string[] =>
      dedupe(
        facets
          .filter((f) => f.kind === kind)
          .sort((a: FacetItem, b: FacetItem) => b.confidence - a.confidence)
          .map((f) => f.text.trim()),
      ).slice(0, MAX_ITEMS_PER_SECTION);

    const userTurns = turns.filter((t) => t.role === "user");
    const assistantTurns = turns.filter((t) => t.role === "assistant");
    const words = turns.reduce((n, t) => n + t.text.split(/\s+/).filter(Boolean).length, 0);
    const code = collectCode(turns);
    const files = dedupe([...byKind("fileRef"), ...code.files]).slice(0, 14);
    const tech = code.languages;

    const goals = byKind("goal");
    const status = byKind("status");
    const decisions = byKind("decision");
    const constraints = byKind("constraint");
    const progress = byKind("progress");
    const questions = byKind("openQuestion");
    const blockers = byKind("blocker");
    const nextActions = byKind("nextAction");

    const objective =
      goals[0] ??
      firstSentence(userTurns[0]?.text ?? "") ??
      `Work on: ${topic}`;

    const oneLiner = truncate(
      `${topic} — ${status[0] ?? progress[0] ?? objective}`,
      160,
    );

    const timeline = buildTimeline(turns);
    const latestAsk = lastOf(userTurns)?.text;
    const latestAnswer = lastOf(assistantTurns)?.text;

    const md: string[] = [];
    md.push(`## Conversation brief — ${input.threadTitle}`);
    md.push(
      [
        `- **Source:** ${input.providerId}`,
        `- **Captured:** ${new Date(input.capturedAt).toISOString()}`,
        `- **Volume:** ${turns.length} turns (${userTurns.length} user / ${assistantTurns.length} assistant), ~${words} words${code.blocks > 0 ? `, ${code.blocks} code block${code.blocks === 1 ? "" : "s"}` : ""}`,
      ].join("\n"),
    );

    md.push(`### What this thread is about\n${objective}`);

    if (status.length || progress.length) {
      md.push(
        section("Where things stand right now", [
          ...status.slice(0, 4),
          ...progress.slice(0, 6).map((p) => `Done: ${p}`),
        ]),
      );
    }

    if (timeline.length > 0) {
      md.push(
        `### How we got here (chronological)\n${timeline
          .map((t, i) => `${i + 1}. **[${t.role}, turn ${t.index}]** ${t.text}`)
          .join("\n")}`,
      );
    }

    if (decisions.length) md.push(section("Decisions already made (do not relitigate)", decisions));
    if (constraints.length) md.push(section("Hard constraints", constraints));
    if (tech.length || files.length) {
      md.push(
        section("Code, files and tech referenced", [
          ...(tech.length ? [`Languages/tools seen: ${tech.join(", ")}`] : []),
          ...files,
        ]),
      );
    }
    if (blockers.length) md.push(section("Blockers", blockers));
    if (questions.length) md.push(section("Still unresolved", questions));

    const actions = nextActions.length
      ? nextActions
      : deriveFallbackActions(latestAsk, questions, blockers);
    md.push(section("Pick up here (next actions)", actions));

    if (latestAsk) {
      md.push(
        `### Most recent user message (verbatim)\n> ${quote(truncate(latestAsk, MAX_EXCERPT_CHARS))}`,
      );
    }
    if (latestAnswer) {
      md.push(
        `### Most recent assistant reply (verbatim, abridged)\n> ${quote(truncate(latestAnswer, MAX_EXCERPT_CHARS))}`,
      );
    }

    return {
      topic,
      oneLiner,
      markdown: md.filter(Boolean).join("\n\n"),
      stats: {
        turns: turns.length,
        userTurns: userTurns.length,
        assistantTurns: assistantTurns.length,
        words,
        codeBlocks: code.blocks,
      },
    };
  }
}

// ---- helpers ----

interface TimelineEntry {
  index: number;
  role: string;
  text: string;
}

/**
 * A compressed chronological trace. Keeps the first two exchanges, the last
 * three, and any turn in between that reads like a decision or a pivot.
 */
function buildTimeline(turns: readonly ConversationTurn[]): TimelineEntry[] {
  const PIVOT = /\b(decided|let's use|instead of|switch(?:ed)? to|change[sd]? to|actually|new plan|blocked|error|failed|works now|fixed|shipped|deployed)\b/i;
  const picked: TimelineEntry[] = [];
  const seen = new Set<number>();
  const push = (i: number) => {
    if (seen.has(i) || !turns[i]) return;
    seen.add(i);
    picked.push({
      index: i + 1,
      role: turns[i]!.role,
      text: truncate(firstSentences(turns[i]!.text, 2), 220),
    });
  };
  for (let i = 0; i < Math.min(2, turns.length); i++) push(i);
  for (let i = 2; i < turns.length - 3; i++) {
    if (PIVOT.test(turns[i]!.text)) push(i);
  }
  for (let i = Math.max(0, turns.length - 3); i < turns.length; i++) push(i);
  return picked.sort((a, b) => a.index - b.index).slice(0, 14);
}

function collectCode(turns: readonly ConversationTurn[]): {
  blocks: number;
  languages: string[];
  files: string[];
} {
  let blocks = 0;
  const languages = new Set<string>();
  const files = new Set<string>();
  const fileRe = /\b[\w./-]+\.(?:ts|tsx|js|jsx|py|rb|go|rs|java|kt|swift|c|cpp|h|css|scss|html|json|yml|yaml|toml|md|sql|sh|env)\b/gi;
  for (const t of turns) {
    const fences = t.text.match(/```[a-z0-9+#-]*/gi) ?? [];
    blocks += Math.floor(fences.length / 2) || (fences.length > 0 ? 1 : 0);
    for (const f of fences) {
      const lang = f.replace(/```/, "").trim();
      if (lang) languages.add(lang.toLowerCase());
    }
    for (const m of t.text.match(fileRe) ?? []) files.add(m);
  }
  return { blocks, languages: [...languages].slice(0, 10), files: [...files].slice(0, 14) };
}

function deriveFallbackActions(
  latestAsk: string | undefined,
  questions: string[],
  blockers: string[],
): string[] {
  const out: string[] = [];
  if (latestAsk) out.push(`Respond to the most recent request: ${truncate(firstSentences(latestAsk, 1), 180)}`);
  for (const b of blockers.slice(0, 2)) out.push(`Unblock: ${b}`);
  for (const q of questions.slice(0, 2)) out.push(`Answer: ${q}`);
  if (out.length === 0) out.push("Confirm the current objective with the user, then continue the work above.");
  return out;
}

function section(title: string, items: string[]): string {
  const clean = dedupe(items.filter((i) => i && i.trim())).slice(0, MAX_ITEMS_PER_SECTION);
  if (clean.length === 0) return "";
  return `### ${title}\n${clean.map((i) => `- ${truncate(i, 300)}`).join("\n")}`;
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const i of items) {
    const k = i.toLowerCase().replace(/\s+/g, " ").trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(i.replace(/\s+/g, " ").trim());
  }
  return out;
}

function firstSentence(text: string): string | undefined {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  if (!s) return undefined;
  return truncate(s.split(/(?<=[.!?])\s/)[0] ?? s, 240);
}

function firstSentences(text: string, n: number): string {
  const s = (text ?? "").replace(/\s+/g, " ").trim();
  return s.split(/(?<=[.!?])\s/).slice(0, n).join(" ");
}

function truncate(s: string, max: number): string {
  const one = (s ?? "").replace(/\s+/g, " ").trim();
  return one.length <= max ? one : `${one.slice(0, max - 1).trimEnd()}…`;
}

function quote(s: string): string {
  return s.replace(/\n/g, "\n> ");
}
