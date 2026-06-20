import { describe, it, expect } from "vitest";
import { ConversationTypeDetector } from "@/services/intelligence/ConversationTypeDetector";
import { DeveloperExtractor, ResearchExtractor, FounderExtractor } from "@/services/intelligence/DomainExtractors";
import { ContextHealthService } from "@/services/intelligence/ContextHealthService";
import type { ConversationTurn } from "@/core/tokens";
import type { Project } from "@/storage/schema";
import { EMPTY_PASSPORT } from "@/core/passport";

const devTurns: ConversationTurn[] = [
  { role: "user", text: "I'm building a Chrome extension in TypeScript with React. The architecture is feature-based with dependency injection." },
  { role: "assistant", text: "Use PostgreSQL for storage. Here's a snippet:\n```ts\nconst x = 1;\n```\nGET /api/users returns the list. TODO: handle pagination." },
];

const researchTurns: ConversationTurn[] = [
  { role: "user", text: "What does the literature say about sleep and memory?" },
  { role: "assistant", text: "The research suggests that REM sleep consolidates declarative memory. According to a 2019 meta-analysis, the effect size is moderate. However, contrary to that, some studies report null findings. doi: 10.1234/abc" },
];

const founderTurns: ConversationTurn[] = [
  { role: "user", text: "We're building a SaaS for indie hackers. The problem is that solo founders can't track investor outreach. Our pricing is subscription-based at $20/mo." },
  { role: "assistant", text: "Target market: 50,000 indie founders. We talked to 12 customer interviews. Risk: large players might bundle this for free." },
];

describe("ConversationTypeDetector", () => {
  it("classifies a developer conversation", () => {
    expect(new ConversationTypeDetector().detect(devTurns).type).toBe("developer");
  });
  it("classifies a research conversation", () => {
    expect(new ConversationTypeDetector().detect(researchTurns).type).toBe("research");
  });
  it("classifies a founder conversation", () => {
    expect(new ConversationTypeDetector().detect(founderTurns).type).toBe("founder");
  });
  it("falls back to general when signal is weak", () => {
    expect(new ConversationTypeDetector().detect([{ role: "user", text: "hi" }]).type).toBe("general");
  });
});

describe("Domain extractors", () => {
  it("DeveloperExtractor finds tech stack, APIs, TODOs", () => {
    const out = new DeveloperExtractor().extract(devTurns);
    expect(out.techStack).toEqual(expect.arrayContaining(["TypeScript", "React"]));
    expect(out.apis.some((a) => /GET \/api\/users/.test(a))).toBe(true);
    expect(out.todos.some((t) => /TODO/.test(t))).toBe(true);
  });
  it("ResearchExtractor finds findings, sources, contradictions", () => {
    const out = new ResearchExtractor().extract(researchTurns);
    expect(out.findings.length).toBeGreaterThan(0);
    expect(out.sources.some((s) => /doi/.test(s))).toBe(true);
    expect(out.contradictions.length).toBeGreaterThan(0);
  });
  it("FounderExtractor finds problem, validation, risks", () => {
    const out = new FounderExtractor().extract(founderTurns);
    expect(out.problem.length).toBeGreaterThan(0);
    expect(out.validation.length).toBeGreaterThan(0);
    expect(out.risks.length).toBeGreaterThan(0);
  });
});

describe("ContextHealthService", () => {
  function projectWith(overrides: Partial<Project["passport"]>): Project {
    return {
      id: "p", name: "P", description: "", createdAt: 0, updatedAt: 0,
      passport: { ...EMPTY_PASSPORT, ...overrides },
      captures: [],
      intelligence: {
        conversationType: "general",
        developer: { techStack: [], architecture: [], apis: [], dbDesign: [], bugs: [], todos: [] },
        research: { findings: [], sources: [], contradictions: [], openQuestions: [] },
        founder: { problem: [], market: [], revenueModel: [], validation: [], risks: [] },
        updatedAt: 0,
      },
      memory: [],
    };
  }
  const mkFacet = (kind: any, pinned = false) => ({
    id: crypto.randomUUID(), kind, text: "x", confidence: 0.8, pinned, dismissed: false,
    source: { captureId: "c", providerId: "p", role: "user" as const, capturedAt: 0 },
  });

  it("scores an empty project at 0 with recommendations", () => {
    const r = new ContextHealthService().evaluate(projectWith({}));
    expect(r.score).toBe(0);
    expect(r.grade).toBe("F");
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("rewards pinned goals and balanced facet coverage", () => {
    const p = projectWith({
      goals: [mkFacet("goal", true), mkFacet("goal")],
      decisions: [mkFacet("decision"), mkFacet("decision"), mkFacet("decision")],
      constraints: [mkFacet("constraint"), mkFacet("constraint")],
      status: [mkFacet("status")],
      nextActions: [mkFacet("nextAction"), mkFacet("nextAction")],
      blockers: [mkFacet("blocker")],
    });
    const r = new ContextHealthService().evaluate(p);
    expect(r.score).toBeGreaterThan(60);
    expect(["A", "B", "C"]).toContain(r.grade);
  });
});
