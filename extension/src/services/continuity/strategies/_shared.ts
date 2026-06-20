import type { ContextPassport, FacetItem, FacetKind } from "@/core/passport";
import { FACET_LABELS, FACET_TO_FIELD, FACET_ORDER } from "@/core/passport";

export function visibleItems(facets: FacetItem[]): FacetItem[] {
  return facets
    .filter((f) => !f.dismissed)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.confidence - a.confidence);
}

export function passportItemCount(p: ContextPassport): number {
  return Object.values(FACET_TO_FIELD).reduce(
    (n, k) => n + p[k].filter((x) => !x.dismissed).length,
    0,
  );
}

export function renderSection(kind: FacetKind, items: FacetItem[]): string {
  const v = visibleItems(items);
  if (v.length === 0) return "";
  const heading = `## ${FACET_LABELS[kind]}`;
  const body = v.map((i) => `- ${i.text}`).join("\n");
  return `${heading}\n${body}`;
}

export function renderAllSections(p: ContextPassport): string[] {
  return FACET_ORDER.map((k) => renderSection(k, p[FACET_TO_FIELD[k]])).filter(Boolean);
}

/**
 * AI-specific continuation preamble. Tailored to each model's known biases so
 * the receiving AI re-establishes context rather than starting fresh.
 */
export function continuationPreamble(targetProviderId: string | undefined): string {
  switch (targetProviderId) {
    case "chatgpt":
      return "You are continuing an in-progress project. Treat the structured handoff below as ground truth. Do not restate it back to me — acknowledge briefly and proceed with the Next Actions. If anything contradicts current intent, ask before acting.";
    case "claude":
      return "Continuing an in-progress project. The structured passport below is the operating context — treat it as ground truth. Maintain explicit reasoning when it helps, but do not re-summarize the passport back to me. Honor pinned items strictly.";
    case "gemini":
      return "Continuing an existing project. Use the structured handoff below as the working context. Be concise. Skip restatement; act on Next Actions. Honor pinned items.";
    case "perplexity":
      return "Continuing project research. Use the structured handoff below as the working context. Where possible, cite sources for new claims. Treat existing findings as established unless contradicted by new evidence.";
    default:
      return "You are continuing an existing project. Treat the structured handoff below as ground truth. Do not restate it. Honor pinned items strictly.";
  }
}

export function header(
  projectName: string,
  projectDescription: string,
  targetProviderId?: string,
): string {
  const targetLine = targetProviderId ? `\n_Continuing in ${targetProviderId}._` : "";
  const desc = projectDescription ? `\n${projectDescription}` : "";
  return `# Continuing project: ${projectName}${desc}${targetLine}\n\n_The following is a working-context handoff. Treat it as ground truth unless contradicted by the user._`;
}

export function memoryBlock(memory: { text: string }[] | undefined): string {
  if (!memory || memory.length === 0) return "";
  const lines = memory.slice(0, 20).map((n) => `- ${n.text}`).join("\n");
  return `## Project Memory (persistent)\n${lines}`;
}

export function countStats(p: ContextPassport): { included: number; excluded: number } {
  return { included: passportItemCount(p), excluded: 0 };
}
