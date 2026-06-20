// Orchestrates conversation-type detection and the three domain extractors.
// Called by ProjectService whenever a capture is ingested. Pure compute.

import type { ConversationTurn } from "@/core/tokens";
import type { ProjectIntelligence } from "@/storage/schema";
import { ConversationTypeDetector, type ConversationType } from "./ConversationTypeDetector";
import { DeveloperExtractor, ResearchExtractor, FounderExtractor } from "./DomainExtractors";

const EMPTY: ProjectIntelligence = {
  conversationType: "general",
  developer: { techStack: [], architecture: [], apis: [], dbDesign: [], bugs: [], todos: [] },
  research: { findings: [], sources: [], contradictions: [], openQuestions: [] },
  founder: { problem: [], market: [], revenueModel: [], validation: [], risks: [] },
  updatedAt: 0,
};

function mergeStrings(a: string[], b: string[], cap = 50): string[] {
  return [...new Set([...a, ...b])].slice(0, cap);
}

export class IntelligenceService {
  constructor(
    private readonly detector = new ConversationTypeDetector(),
    private readonly devExtractor = new DeveloperExtractor(),
    private readonly researchExtractor = new ResearchExtractor(),
    private readonly founderExtractor = new FounderExtractor(),
  ) {}

  detectType(turns: readonly ConversationTurn[]): ConversationType {
    return this.detector.detect(turns).type;
  }

  /**
   * Run all domain extractors over a capture and merge into existing
   * intelligence. Domain-specific output is cumulative — re-running over the
   * same project enriches rather than replaces.
   */
  enrich(
    existing: ProjectIntelligence | undefined,
    turns: readonly ConversationTurn[],
    now: number,
  ): ProjectIntelligence {
    const base = existing ?? EMPTY;
    const detected = this.detector.detect(turns).type;
    const dev = this.devExtractor.extract(turns);
    const res = this.researchExtractor.extract(turns);
    const fnd = this.founderExtractor.extract(turns);
    return {
      // Sticky type: once a project is classified, only override if signal is decisive.
      conversationType: base.conversationType === "general" ? detected : base.conversationType,
      developer: {
        techStack: mergeStrings(base.developer.techStack, dev.techStack),
        architecture: mergeStrings(base.developer.architecture, dev.architecture),
        apis: mergeStrings(base.developer.apis, dev.apis),
        dbDesign: mergeStrings(base.developer.dbDesign, dev.dbDesign),
        bugs: mergeStrings(base.developer.bugs, dev.bugs),
        todos: mergeStrings(base.developer.todos, dev.todos),
      },
      research: {
        findings: mergeStrings(base.research.findings, res.findings),
        sources: mergeStrings(base.research.sources, res.sources),
        contradictions: mergeStrings(base.research.contradictions, res.contradictions),
        openQuestions: mergeStrings(base.research.openQuestions, res.openQuestions),
      },
      founder: {
        problem: mergeStrings(base.founder.problem, fnd.problem),
        market: mergeStrings(base.founder.market, fnd.market),
        revenueModel: mergeStrings(base.founder.revenueModel, fnd.revenueModel),
        validation: mergeStrings(base.founder.validation, fnd.validation),
        risks: mergeStrings(base.founder.risks, fnd.risks),
      },
      updatedAt: now,
    };
  }
}
