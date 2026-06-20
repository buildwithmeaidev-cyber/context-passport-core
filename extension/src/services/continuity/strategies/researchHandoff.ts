import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { continuationPreamble, header, renderSection, memoryBlock } from "./_shared";

function renderList(label: string, items: readonly string[]): string {
  if (!items || items.length === 0) return "";
  return `## ${label}\n${items.map((i) => `- ${i}`).join("\n")}`;
}

export const researchHandoffStrategy: ContinuityRenderStrategy = {
  id: "research-handoff",
  label: "Research handoff (Pro)",
  description: "Findings · Sources · Contradictions · Open Questions. Optimized for analytical continuity.",
  premium: true,
  render({ projectName, projectDescription, passport, targetProviderId, intelligence, memory }) {
    const r = intelligence?.research;
    const sections = [
      renderSection("goal", passport.goals),
      renderSection("status", passport.status),
      renderList("Findings", r?.findings ?? []),
      renderList("Sources", r?.sources ?? []),
      renderList("Contradictions", r?.contradictions ?? []),
      renderList("Open Research Questions", r?.openQuestions ?? []),
      renderSection("constraint", passport.constraints),
      renderSection("nextAction", passport.nextActions),
      memoryBlock(memory),
    ].filter(Boolean);
    const text = [
      header(projectName, projectDescription, targetProviderId),
      `> ${continuationPreamble(targetProviderId)}`,
      ...sections,
    ].join("\n\n");
    return { text, stats: { facetsIncluded: sections.length, facetsExcluded: 0, chars: text.length } };
  },
};
