import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { header, visibleItems, passportItemCount } from "./_shared";
import { FACET_LABELS } from "@/core/passport";

export const briefStrategy: ContinuityRenderStrategy = {
  id: "brief",
  label: "Brief synthesis",
  description: "Single paragraph per facet; top-confidence items only. Smallest prompt.",
  premium: false,
  render({ projectName, projectDescription, passport, targetProviderId }) {
    const lines: string[] = [];
    let included = 0;
    let excluded = 0;
    for (const [kind, field] of [
      ["goal", "goals"], ["decision", "decisions"], ["constraint", "constraints"],
      ["progress", "progress"], ["openQuestion", "openQuestions"], ["nextAction", "nextActions"],
    ] as const) {
      const items = visibleItems(passport[field]);
      if (items.length === 0) continue;
      const top = items.slice(0, 3);
      excluded += items.length - top.length;
      included += top.length;
      lines.push(`**${FACET_LABELS[kind]}:** ${top.map((i) => i.text.replace(/\n+/g, " ")).join(" · ")}`);
    }
    const text = [header(projectName, projectDescription, targetProviderId), ...lines].join("\n\n");
    void passportItemCount;
    return { text, stats: { facetsIncluded: included, facetsExcluded: excluded, chars: text.length } };
  },
};
