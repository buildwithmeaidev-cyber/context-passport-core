import type { ContextPassport, FacetItem } from "@/core/passport";
import { FACET_LABELS, FACET_TO_FIELD } from "@/core/passport";

export function visibleItems(facets: FacetItem[]): FacetItem[] {
  return facets.filter((f) => !f.dismissed).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.confidence - a.confidence);
}

export function passportItemCount(p: ContextPassport): number {
  return Object.values(FACET_TO_FIELD).reduce((n, k) => n + p[k].filter((x) => !x.dismissed).length, 0);
}

export function renderSection(
  kind: keyof typeof FACET_LABELS,
  items: FacetItem[],
): string {
  const v = visibleItems(items);
  if (v.length === 0) return "";
  const heading = `## ${FACET_LABELS[kind]}`;
  const body = v.map((i) => `- ${i.text}`).join("\n");
  return `${heading}\n${body}`;
}

export function header(projectName: string, projectDescription: string, targetProviderId?: string): string {
  const targetLine = targetProviderId ? `\n_Continuing in ${targetProviderId}._` : "";
  const desc = projectDescription ? `\n${projectDescription}` : "";
  return `# Continuing project: ${projectName}${desc}${targetLine}\n\n_The following is a working-context handoff. Treat it as ground truth unless contradicted by the user._`;
}
