import type { CompressionStrategy } from "../CompressionStrategy";
import { stats } from "./none";
import { summarizeHeuristicStrategy } from "./summarize-heuristic";

export const aggressiveStrategy: CompressionStrategy = {
  id: "aggressive",
  label: "Aggressive",
  description: "Summarize + drop low-signal turns + hard character cap. Best for switching providers with strict context limits.",
  premium: true,
  run(input) {
    const summarized = summarizeHeuristicStrategy.run(input);
    const cap = input.targetChars ?? 8000;
    let text = summarized.text;
    if (text.length > cap) {
      text = text.slice(0, cap) + "\n\n[...truncated by ContextPassport aggressive mode]";
    }
    const orig = input.turns.map((t) => `## ${t.role}\n${t.text}`).join("\n\n");
    return { text, stats: stats(orig, text) };
  },
};
