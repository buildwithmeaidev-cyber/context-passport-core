import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { continuationPreamble, header, renderSection, memoryBlock } from "./_shared";

/** Balanced — the sensible default for most cross-AI handoffs. */
export const balancedStrategy: ContinuityRenderStrategy = {
  id: "balanced",
  label: "Balanced handoff",
  description: "Goal · Status · Decisions · Constraints · Open Questions · Next Actions. Recommended default.",
  premium: false,
  render({ projectName, projectDescription, passport, targetProviderId, memory }) {
    const sections = [
      renderSection("goal", passport.goals),
      renderSection("status", passport.status),
      renderSection("decision", passport.decisions),
      renderSection("constraint", passport.constraints),
      renderSection("openQuestion", passport.openQuestions),
      renderSection("nextAction", passport.nextActions),
      memoryBlock(memory),
    ].filter(Boolean);
    const text = [
      header(projectName, projectDescription, targetProviderId),
      `> ${continuationPreamble(targetProviderId)}`,
      ...sections,
    ].join("\n\n");
    const included =
      passport.goals.length + passport.status.length + passport.decisions.length +
      passport.constraints.length + passport.openQuestions.length + passport.nextActions.length;
    return { text, stats: { facetsIncluded: included, facetsExcluded: passport.progress.length + passport.filesReferenced.length + passport.blockers.length, chars: text.length } };
  },
};
