// Heuristic conversation-type classifier. Local, deterministic, no LLM.
// Returns the dominant domain so domain-specific extractors and handoff modes
// can specialize. Conservative: defaults to "general" when no signal dominates.

import type { ConversationTurn } from "@/core/tokens";

export type ConversationType = "developer" | "research" | "founder" | "general";

const SIGNALS: Record<Exclude<ConversationType, "general">, RegExp[]> = {
  developer: [
    /\b(typescript|javascript|python|rust|golang|react|vue|svelte|node|api|endpoint|database|sql|schema|migration|component|function|class|bug|stack trace|exception|deploy|ci\/cd|docker|kubernetes|repo|commit|pull request|merge)\b/i,
    /\b(framework|library|package|npm|pip|cargo|module|import|export|interface|type|generic)\b/i,
    /\.(ts|tsx|js|jsx|py|rs|go|sql|json|yaml|yml)\b/i,
    /```[\s\S]*?```/, // code blocks count once
  ],
  research: [
    /\b(study|paper|finding|evidence|cite|citation|source|reference|hypothesis|methodology|sample size|peer[- ]reviewed|systematic review|meta[- ]analysis|literature)\b/i,
    /\b(according to|the data shows|research suggests|results indicate|contradicts|consistent with)\b/i,
    /\bdoi:|arxiv|pubmed|google scholar/i,
  ],
  founder: [
    /\b(market|tam|sam|som|customer|user persona|revenue|monetization|monetisation|pricing|business model|moat|competitor|competitive advantage|investor|fundraise|seed|series [a-c]|valuation|runway|burn rate|mrr|arr|cac|ltv|churn)\b/i,
    /\b(go to market|gtm|product[- ]market fit|pmf|positioning|value proposition|wedge)\b/i,
    /\b(validate|validation|interview|cold outreach|landing page|waitlist)\b/i,
  ],
};

export interface DetectionScore {
  type: ConversationType;
  scores: Record<Exclude<ConversationType, "general">, number>;
}

export class ConversationTypeDetector {
  detect(turns: readonly ConversationTurn[]): DetectionScore {
    const text = turns.map((t) => t.text).join("\n");
    const scores = { developer: 0, research: 0, founder: 0 } as Record<
      Exclude<ConversationType, "general">,
      number
    >;
    for (const [kind, patterns] of Object.entries(SIGNALS) as [
      Exclude<ConversationType, "general">,
      RegExp[],
    ][]) {
      for (const re of patterns) {
        const matches = text.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"));
        if (matches) scores[kind] += matches.length;
      }
    }
    const ranked = (Object.keys(scores) as Array<keyof typeof scores>).sort(
      (a, b) => scores[b] - scores[a],
    );
    const top = ranked[0]!;
    const second = ranked[1]!;
    // Require a clear lead AND minimum signal count to avoid false positives.
    const type: ConversationType =
      scores[top] >= 3 && scores[top] >= scores[second] * 1.5 ? top : "general";
    return { type, scores };
  }
}
