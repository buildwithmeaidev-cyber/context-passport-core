import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { continuationPreamble, header, renderSection, memoryBlock } from "./_shared";

function renderList(label: string, items: readonly string[]): string {
  if (!items || items.length === 0) return "";
  return `## ${label}\n${items.map((i) => `- ${i}`).join("\n")}`;
}

/** Developer Handoff — code-aware, includes domain-specific Developer insights. */
export const developerHandoffStrategy: ContinuityRenderStrategy = {
  id: "developer-handoff",
  label: "Developer handoff (Pro)",
  description: "Tech stack · Architecture · APIs · DB design · Bugs · TODOs alongside the passport. Optimized for engineering continuity.",
  premium: true,
  render({ projectName, projectDescription, passport, targetProviderId, intelligence, memory }) {
    const dev = intelligence?.developer;
    const sections = [
      renderSection("goal", passport.goals),
      renderSection("status", passport.status),
      renderSection("decision", passport.decisions),
      renderSection("constraint", passport.constraints),
      renderSection("fileRef", passport.filesReferenced),
      renderList("Tech Stack", dev?.techStack ?? []),
      renderList("Architecture", dev?.architecture ?? []),
      renderList("APIs", dev?.apis ?? []),
      renderList("Database Design", dev?.dbDesign ?? []),
      renderList("Known Bugs", dev?.bugs ?? []),
      renderList("TODOs", dev?.todos ?? []),
      renderSection("blocker", passport.blockers),
      renderSection("openQuestion", passport.openQuestions),
      renderSection("nextAction", passport.nextActions),
      memoryBlock(memory),
    ].filter(Boolean);
    const ack = `\n\n---\nIf any item conflicts with current intent, ask before proceeding. Do not silently override pinned items.`;
    const text = [
      header(projectName, projectDescription, targetProviderId),
      `> ${continuationPreamble(targetProviderId)}`,
      ...sections,
    ].join("\n\n") + ack;
    return { text, stats: { facetsIncluded: sections.length, facetsExcluded: 0, chars: text.length } };
  },
};
