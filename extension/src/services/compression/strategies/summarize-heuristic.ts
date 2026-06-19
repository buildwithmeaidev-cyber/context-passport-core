import type { CompressionStrategy } from "../CompressionStrategy";
import { stats } from "./none";

// Heuristic sentence ranking: keep code blocks verbatim, score remaining
// sentences by length + keyword presence, keep top half per turn.
const KEYWORDS = ["error", "must", "should", "do not", "summary", "context", "goal", "constraint"];

function summarizeText(text: string): string {
  const code: string[] = [];
  const stripped = text.replace(/```[\s\S]*?```/g, (m) => {
    code.push(m);
    return `__CODE_${code.length - 1}__`;
  });
  const sentences = stripped.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length <= 2) return text;
  const scored = sentences.map((s) => {
    const lower = s.toLowerCase();
    const kw = KEYWORDS.reduce((n, k) => (lower.includes(k) ? n + 1 : n), 0);
    return { s, score: s.length * 0.1 + kw * 5 };
  });
  scored.sort((a, b) => b.score - a.score);
  const keep = scored.slice(0, Math.max(1, Math.ceil(scored.length / 2))).map((x) => x.s);
  // Preserve original order
  const kept = sentences.filter((s) => keep.includes(s));
  let out = kept.join(" ");
  out = out.replace(/__CODE_(\d+)__/g, (_, i) => code[Number(i)] ?? "");
  return out;
}

export const summarizeHeuristicStrategy: CompressionStrategy = {
  id: "summarize-heuristic",
  label: "Summarize (heuristic)",
  description: "Local sentence-ranking; keeps code blocks verbatim. No LLM calls.",
  premium: false,
  run({ turns }) {
    const input = turns.map((t) => `## ${t.role}\n${t.text}`).join("\n\n");
    const text = turns
      .map((t) => `## ${t.role}\n${summarizeText(t.text)}`)
      .join("\n\n");
    return { text, stats: stats(input, text) };
  },
};
