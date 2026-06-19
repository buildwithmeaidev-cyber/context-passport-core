import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { briefStrategy } from "./brief";
import { essentialStrategy } from "./essential";
import { fullStrategy } from "./full";
import { handoffStrategy } from "./handoff";

export const strategies: readonly ContinuityRenderStrategy[] = [
  briefStrategy,
  essentialStrategy,
  fullStrategy,
  handoffStrategy,
];
