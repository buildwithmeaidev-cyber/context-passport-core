import type { CompressionStrategy } from "../CompressionStrategy";
import { stats } from "./none";

export const dedupeStrategy: CompressionStrategy = {
  id: "dedupe",
  label: "Dedupe",
  description: "Removes repeated turns, collapses quoted blocks, trims whitespace.",
  premium: false,
  run({ turns }) {
    const seen = new Set<string>();
    const kept = turns.filter((t) => {
      const key = `${t.role}::${t.text.trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const text = kept
      .map((t) => `## ${t.role}\n${t.text.replace(/\n{3,}/g, "\n\n").trim()}`)
      .join("\n\n");
    const input = turns.map((t) => `## ${t.role}\n${t.text}`).join("\n\n");
    return { text, stats: stats(input, text) };
  },
};
