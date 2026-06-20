// Domain-specific structured extractors. Pure functions, no I/O.
// Each extractor is independently testable and can be replaced/extended
// without touching the rest of the system.

import type { ConversationTurn } from "@/core/tokens";
import type { DeveloperInsights, ResearchInsights, FounderInsights } from "@/storage/schema";

const TECH_TOKENS = [
  "TypeScript", "JavaScript", "Python", "Rust", "Go", "Java", "Kotlin", "Swift",
  "React", "Vue", "Svelte", "Next.js", "Nuxt", "Angular", "Astro",
  "Node", "Deno", "Bun", "Express", "Fastify", "Hono",
  "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "DynamoDB",
  "Tailwind", "Vite", "Webpack", "esbuild", "Manifest V3",
  "Docker", "Kubernetes", "AWS", "GCP", "Cloudflare", "Vercel", "Supabase",
  "Zod", "Prisma", "Drizzle", "TanStack",
];

function uniq(items: string[]): string[] {
  return [...new Set(items.map((s) => s.trim()).filter((s) => s.length > 0))];
}

function findAll(text: string, re: RegExp): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(re)) out.push(m[0]);
  return out;
}

export class DeveloperExtractor {
  extract(turns: readonly ConversationTurn[]): DeveloperInsights {
    const text = turns.map((t) => t.text).join("\n");
    const techStack = uniq(
      TECH_TOKENS.filter((t) => new RegExp(`\\b${escape(t)}\\b`, "i").test(text)),
    );
    const architecture = uniq([
      ...findAll(text, /\b(monorepo|microservice[s]?|monolith|serverless|edge|event[- ]driven|cqrs|hexagonal|clean architecture|feature[- ]based|provider adapter|dependency injection)\b/gi),
    ]);
    const apis = uniq(findAll(text, /\b(GET|POST|PUT|PATCH|DELETE)\s+\/[\w/{}-]+/g));
    const dbDesign = uniq(
      findAll(text, /\bCREATE TABLE\s+\w+/gi).concat(
        findAll(text, /\b(table|schema|column|primary key|foreign key|index|unique)\s+[\w_]+/gi).slice(0, 10),
      ),
    );
    const bugs = uniq(
      findAll(text, /(?:^|[\s.])(?:bug|error|fails? with|throws?|crashes?|broken)[^\n.!?]{0,160}/gi)
        .map((s) => s.trim().replace(/^[\s.]+/, ""))
        .slice(0, 20),
    );
    const todos = uniq(
      findAll(text, /(?:TODO|FIXME|HACK|XXX)[:\s][^\n]{0,160}/gi).slice(0, 20),
    );
    return { techStack, architecture, apis, dbDesign, bugs, todos };
  }
}

export class ResearchExtractor {
  extract(turns: readonly ConversationTurn[]): ResearchInsights {
    const text = turns.map((t) => t.text).join("\n");
    const findings = uniq(
      findAll(text, /(?:the (?:data|study|research) (?:shows?|suggests?|indicates?)|findings? (?:show|suggest|indicate)|results indicate)[^\n.!?]{0,200}[.!?]/gi).slice(0, 20),
    );
    const sources = uniq([
      ...findAll(text, /https?:\/\/\S+/g),
      ...findAll(text, /\bdoi:\s*\S+/gi),
      ...findAll(text, /\barxiv:\s*\S+/gi),
    ]);
    const contradictions = uniq(
      findAll(text, /(?:however|but|on the other hand|in contrast|contradicts?|disputes?|contrary to)[^\n.!?]{0,180}[.!?]/gi).slice(0, 15),
    );
    const openQuestions = uniq(
      findAll(text, /[^.!?\n]{8,180}\?/g).slice(0, 15),
    );
    return { findings, sources, contradictions, openQuestions };
  }
}

export class FounderExtractor {
  extract(turns: readonly ConversationTurn[]): FounderInsights {
    const text = turns.map((t) => t.text).join("\n");
    const problem = uniq(
      findAll(text, /(?:the problem (?:is|we['’]re solving)|pain point[s]? (?:is|are)|users? struggle with|customers? can['’]t)[^\n.!?]{0,200}[.!?]/gi).slice(0, 10),
    );
    const market = uniq(
      findAll(text, /(?:tam|sam|som|target market|target users?|customer segment|ideal customer)[^\n.!?]{0,200}[.!?]?/gi).slice(0, 10),
    );
    const revenueModel = uniq(
      findAll(text, /(?:subscription|saas|freemium|usage[- ]based|per[- ]seat|one[- ]time|marketplace fee|commission|ads|sponsorship|pricing)[^\n.!?]{0,200}[.!?]?/gi).slice(0, 10),
    );
    const validation = uniq(
      findAll(text, /(?:we (?:talked|spoke) to \d+|\d+ (?:customer|user) interviews?|waitlist of \d+|landing page conversion|signed up|paid customer)[^\n.!?]{0,200}[.!?]?/gi).slice(0, 10),
    );
    const risks = uniq(
      findAll(text, /(?:risk(?:s|y)?|concern|threat|might fail|won['’]t work if|depends on)[^\n.!?]{0,200}[.!?]/gi).slice(0, 15),
    );
    return { problem, market, revenueModel, validation, risks };
  }
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
