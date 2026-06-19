import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { header, renderSection, passportItemCount } from "./_shared";
import { FACET_TO_FIELD } from "@/core/passport";

export const fullStrategy: ContinuityRenderStrategy = {
  id: "full",
  label: "Full passport",
  description: "Every facet, every visible item. Highest fidelity; longest prompt.",
  premium: false,
  render({ projectName, projectDescription, passport, targetProviderId }) {
    const sections = (Object.keys(FACET_TO_FIELD) as Array<keyof typeof FACET_TO_FIELD>)
      .map((k) => renderSection(k, passport[FACET_TO_FIELD[k]]))
      .filter(Boolean);
    const text = [header(projectName, projectDescription, targetProviderId), ...sections].join("\n\n");
    return {
      text,
      stats: { facetsIncluded: passportItemCount(passport), facetsExcluded: 0, chars: text.length },
    };
  },
};
