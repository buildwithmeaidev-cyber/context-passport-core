import type { ContextPassport } from "@/core/passport";

export interface RenderInput {
  projectName: string;
  projectDescription: string;
  passport: ContextPassport;
  /** Optional target provider — strategies may tailor preamble per provider. */
  targetProviderId?: string;
  /** Soft target in characters. Strategies may exceed by 10%. */
  targetChars?: number;
}

export interface RenderOutput {
  text: string;
  stats: {
    facetsIncluded: number;
    facetsExcluded: number;
    chars: number;
  };
}

/**
 * ContinuityRenderStrategy — renders a Passport into a prompt that
 * re-establishes context in a new AI session.
 *
 * Adding a mode:
 *   1. Create src/services/continuity/strategies/<id>.ts implementing this.
 *   2. Register it in strategies/index.ts.
 *   3. Optionally mark `premium: true` — gating is handled by LicenseService.
 */
export interface ContinuityRenderStrategy {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly premium: boolean;
  render(input: RenderInput): RenderOutput;
}
