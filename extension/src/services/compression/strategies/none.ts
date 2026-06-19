import type { CompressionStrategy } from "../CompressionStrategy";

function joinTurns(turns: readonly { role: string; text: string }[]): string {
  return turns.map((t) => `## ${t.role}\n${t.text}`).join("\n\n");
}

export const noneStrategy: CompressionStrategy = {
  id: "none",
  label: "No compression",
  description: "Pass-through; preserves every turn verbatim.",
  premium: false,
  run({ turns }) {
    const text = joinTurns(turns);
    return { text, stats: stats(text, text) };
  },
};

function stats(input: string, output: string) {
  return {
    inputChars: input.length,
    outputChars: output.length,
    ratio: input.length === 0 ? 1 : output.length / input.length,
  };
}

export { stats };
