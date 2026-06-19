import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { header, renderSection } from "./_shared";

export const essentialStrategy: ContinuityRenderStrategy = {
  id: "essential",
  label: "Essential continuity",
  description: "Goals · Decisions · Constraints · Next Actions. Skip progress and open questions.",
  premium: false,
  render({ projectName, projectDescription, passport, targetProviderId }) {
    const fields = [
      renderSection("goal", passport.goals),
      renderSection("decision", passport.decisions),
      renderSection("constraint", passport.constraints),
      renderSection("nextAction", passport.nextActions),
    ].filter(Boolean);
    const included =
      passport.goals.filter((f) => !f.dismissed).length +
      passport.decisions.filter((f) => !f.dismissed).length +
      passport.constraints.filter((f) => !f.dismissed).length +
      passport.nextActions.filter((f) => !f.dismissed).length;
    const excluded =
      passport.progress.filter((f) => !f.dismissed).length +
      passport.openQuestions.filter((f) => !f.dismissed).length;
    const text = [header(projectName, projectDescription, targetProviderId), ...fields].join("\n\n");
    return { text, stats: { facetsIncluded: included, facetsExcluded: excluded, chars: text.length } };
  },
};
