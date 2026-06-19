import type { ContinuityRenderStrategy } from "../ContinuityRenderStrategy";
import { header, visibleItems } from "./_shared";
import { FACET_LABELS, FACET_TO_FIELD } from "@/core/passport";

const PROVIDER_PREAMBLE: Record<string, string> = {
  chatgpt: "Prior assistant: ChatGPT. Maintain the same coding style and assumptions unless asked otherwise.",
  claude: "Prior assistant: Claude. Carry over its preference for explicit reasoning and structured replies.",
  gemini: "Prior assistant: Gemini. Carry over its preference for concise, structured answers.",
  perplexity: "Prior assistant: Perplexity. Carry over any cited sources where possible.",
};

export const handoffStrategy: ContinuityRenderStrategy = {
  id: "handoff",
  label: "Structured handoff (Pro)",
  description: "Formal handoff: provider-specific preamble, ranked facets, explicit open-question block. Best for switching AIs mid-project.",
  premium: true,
  render({ projectName, projectDescription, passport, targetProviderId, targetChars }) {
    const preamble = PROVIDER_PREAMBLE[targetProviderId ?? ""] ?? "Carry over context from a prior AI session.";
    const sections: string[] = [];
    let included = 0;
    let excluded = 0;
    for (const kind of Object.keys(FACET_TO_FIELD) as Array<keyof typeof FACET_TO_FIELD>) {
      const items = visibleItems(passport[FACET_TO_FIELD[kind]]);
      if (items.length === 0) continue;
      const ranked = items.slice(0, 8);
      excluded += items.length - ranked.length;
      included += ranked.length;
      const numbered = ranked.map((i, idx) => `${idx + 1}. ${i.text}${i.pinned ? "  *(pinned)*" : ""}`).join("\n");
      sections.push(`## ${FACET_LABELS[kind]}\n${numbered}`);
    }
    const ack = `\n\n---\nIf any item conflicts with current intent, ask before proceeding. Do not silently override pinned items.`;
    let text = [header(projectName, projectDescription, targetProviderId), `> ${preamble}`, ...sections].join("\n\n") + ack;
    const cap = targetChars ?? 12000;
    if (text.length > cap) text = text.slice(0, cap) + "\n\n[…truncated]";
    return { text, stats: { facetsIncluded: included, facetsExcluded: excluded, chars: text.length } };
  },
};
