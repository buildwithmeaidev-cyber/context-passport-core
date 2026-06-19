import type { ConversationTurn } from "@/core/tokens";

export interface CompressionInput {
  turns: readonly ConversationTurn[];
  /** Soft target in characters. Implementations may exceed by 10%. */
  targetChars?: number;
}

export interface CompressionOutput {
  text: string;
  stats: {
    inputChars: number;
    outputChars: number;
    ratio: number;
  };
}

/**
 * CompressionStrategy — pluggable local compression.
 *
 * Adding a mode:
 *   1. Create src/services/compression/strategies/<id>.ts implementing this.
 *   2. Register it in src/services/compression/strategies/index.ts.
 *   3. Optionally mark `premium: true` — UI gating is handled by LicenseService.
 *
 * No other code changes are required.
 */
export interface CompressionStrategy {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly premium: boolean;
  run(input: CompressionInput): CompressionOutput;
}
