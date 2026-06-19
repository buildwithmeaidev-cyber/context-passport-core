import type { CompressionStrategy } from "../CompressionStrategy";
import { noneStrategy } from "./none";
import { dedupeStrategy } from "./dedupe";
import { summarizeHeuristicStrategy } from "./summarize-heuristic";
import { aggressiveStrategy } from "./aggressive";

export const strategies: readonly CompressionStrategy[] = [
  noneStrategy,
  dedupeStrategy,
  summarizeHeuristicStrategy,
  aggressiveStrategy,
];
