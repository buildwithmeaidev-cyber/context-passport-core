import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { continuationPreamble, visibleItems, memoryBlock } from "./_shared";
import { FACET_LABELS } from "@/core/passport";

/** Quick Summary — smallest possible prompt that still preserves momentum. */
export const quickStrategy: ContinuityRenderStrategy = {
  id: "quick",
  label: "Quick summary",
  description: "Single-paragraph synthesis. Goal · Status · top Next Action. Use when you only need a nudge.",
  premium: false,
  render({ projectName, projectDescription, passport, targetProviderId, memory }) {
    const goal = visibleItems(passport.goals)[0]?.text ?? "(no explicit goal yet)";
    const status = visibleItems(passport.status)[0]?.text;
    const next = visibleItems(passport.nextActions)[0]?.text;
    const lines: string[] = [
      `# ${projectName}`,
      projectDescription || undefined,
      continuationPreamble(targetProviderId),
      "",
      `**${FACET_LABELS.goal}:** ${goal}`,
      status ? `**${FACET_LABELS.status}:** ${status}` : undefined,
      next ? `**${FACET_LABELS.nextAction}:** ${next}` : undefined,
      memoryBlock(memory),
    ].filter(Boolean) as string[];
    const text = lines.join("\n");
    return {
      text,
      stats: { facetsIncluded: [goal, status, next].filter(Boolean).length, facetsExcluded: 0, chars: text.length },
    };
  },
};
