import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { briefStrategy } from "./brief";
import { essentialStrategy } from "./essential";
import { fullStrategy } from "./full";
import { handoffStrategy } from "./handoff";
import { quickStrategy } from "./quick";
import { balancedStrategy } from "./balanced";
import { developerHandoffStrategy } from "./developerHandoff";
import { researchHandoffStrategy } from "./researchHandoff";
import { founderHandoffStrategy } from "./founderHandoff";

export const strategies: readonly ContinuityRenderStrategy[] = [
  // New Context Intelligence Engine modes (preferred)
  quickStrategy,
  balancedStrategy,
  developerHandoffStrategy,
  researchHandoffStrategy,
  founderHandoffStrategy,
  // Original modes — kept for backward compatibility with stored user prefs.
  briefStrategy,
  essentialStrategy,
  fullStrategy,
  handoffStrategy,
];
