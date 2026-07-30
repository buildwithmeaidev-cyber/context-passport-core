// Adapter-level extraction diagnostics.
//
// The integrity report says *what* is wrong with a capture. Diagnostics say
// *why*: which provider adapter ran, which DOM selector matched (or matched
// nothing and fell back), and which fields came out empty. Purely descriptive
// — nothing here changes extraction behaviour.

export interface SelectorProbe {
  /** The CSS selector that was tried. */
  selector: string;
  /** What it was supposed to find: "container" | "user" | "assistant" | "text" | "composer". */
  usedFor: string;
  /** How many nodes it matched. 0 means selector drift. */
  matched: number;
  /** True when this probe only ran because an earlier one matched nothing. */
  fallback: boolean;
}

export interface AdapterDiagnostics {
  providerId: string;
  adapterLabel: string;
  /** Normalized page URL the extraction ran against. */
  url: string;
  selectorsTried: SelectorProbe[];
  /** Field names that came back empty for at least one turn. */
  missingFields: string[];
  /** Free-form notes, already written in plain language for the UI. */
  notes: string[];
}

export function emptyDiagnostics(providerId: string, adapterLabel: string, url = ""): AdapterDiagnostics {
  return { providerId, adapterLabel, url, selectorsTried: [], missingFields: [], notes: [] };
}

/**
 * Turn diagnostics into sentences a non-technical user can act on.
 * Used by the "Show details" disclosure in the integrity banner.
 */
export function explainDiagnostics(d: AdapterDiagnostics): string[] {
  const lines: string[] = [];
  const dead = d.selectorsTried.filter((p) => p.matched === 0);
  const live = d.selectorsTried.filter((p) => p.matched > 0);

  for (const p of dead) {
    lines.push(
      `${d.adapterLabel} adapter: the ${p.usedFor} selector \`${p.selector}\` matched 0 elements — the page layout likely changed.`,
    );
  }
  for (const p of live.filter((x) => x.fallback)) {
    lines.push(
      `Fell back to \`${p.selector}\` for ${p.usedFor} (${p.matched} element${p.matched === 1 ? "" : "s"}). Results may be less precise.`,
    );
  }
  if (d.missingFields.length > 0) {
    lines.push(`Fields that came back empty: ${d.missingFields.join(", ")}.`);
  }
  for (const n of d.notes) lines.push(n);
  if (lines.length === 0) {
    lines.push(`${d.adapterLabel} adapter reported no selector problems. Any warnings above come from the conversation content itself, not the page reader.`);
  }
  return lines;
}
