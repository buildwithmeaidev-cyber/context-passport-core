import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { continuationPreamble, header, renderSection, memoryBlock } from "./_shared";

function renderList(label: string, items: readonly string[]): string {
  if (!items || items.length === 0) return "";
  return `## ${label}\n${items.map((i) => `- ${i}`).join("\n")}`;
}

export const founderHandoffStrategy: ContinuityRenderStrategy = {
  id: "founder-handoff",
  label: "Founder handoff (Pro)",
  description: "Problem · Market · Revenue model · Validation · Risks. Optimized for product-strategy continuity.",
  premium: true,
  render({ projectName, projectDescription, passport, targetProviderId, intelligence, memory }) {
    const f = intelligence?.founder;
    const sections = [
      renderSection("goal", passport.goals),
      renderSection("status", passport.status),
      renderList("Problem", f?.problem ?? []),
      renderList("Market", f?.market ?? []),
      renderList("Revenue Model", f?.revenueModel ?? []),
      renderList("Validation", f?.validation ?? []),
      renderList("Risks", f?.risks ?? []),
      renderSection("decision", passport.decisions),
      renderSection("blocker", passport.blockers),
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
