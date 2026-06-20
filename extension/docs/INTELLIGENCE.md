# Context Intelligence Engine

The engine sits between captures and continuity rendering. Its job is to turn
raw conversation turns into structured, durable project knowledge — never just
compressed text.

## Pipeline

```
ProviderAdapter.extractConversation()
        │
        ▼
ProjectService.ingestCapture(projectId, captured)
        │
        ├──► extractFacets()          → 9 facets merged into Passport
        │     (goal, status, decision, constraint, progress,
        │      fileRef, openQuestion, blocker, nextAction)
        │
        └──► IntelligenceService.enrich()
              ├── ConversationTypeDetector  → developer | research | founder | general
              ├── DeveloperExtractor        → techStack, architecture, apis, dbDesign, bugs, todos
              ├── ResearchExtractor         → findings, sources, contradictions, openQuestions
              └── FounderExtractor          → problem, market, revenueModel, validation, risks

ContinuityService.render(modeId, { passport, intelligence, memory, targetProviderId })
        │
        ▼
        Quick · Balanced · Developer / Research / Founder Handoff
        + provider-specific continuation preamble (ChatGPT, Claude, Gemini, Perplexity)
```

## Render Modes

| Mode | Tier | Output |
| ---- | ---- | ------ |
| `quick` | Free | Single-paragraph synthesis. Goal + Status + top Next Action. |
| `balanced` | Free | Goal · Status · Decisions · Constraints · Open Questions · Next Actions. Default. |
| `developer-handoff` | Pro | Adds Tech stack · Architecture · APIs · DB design · Bugs · TODOs. |
| `research-handoff` | Pro | Adds Findings · Sources · Contradictions · Open Research Questions. |
| `founder-handoff` | Pro | Adds Problem · Market · Revenue model · Validation · Risks. |

Legacy modes `brief`, `essential`, `full`, `handoff` remain registered for
backward compatibility with stored user preferences.

## Continuation Prompts

Each render emits a provider-tailored preamble (see `_shared.ts →
continuationPreamble`). The receiving AI is told to **treat the passport as
ground truth, not restate it, and honor pinned items**. This is what
preserves momentum instead of producing a summary the user has to re-read.

## Context Health Score (0–100)

`ContextHealthService.evaluate(project)` returns a score and ranked
recommendations. Rubric:

| Category | Weight | Signal |
| -------- | ------ | ------ |
| Goal clarity | 30 | count + pinned + avg confidence of `goals` |
| Decision quality | 25 | count + avg confidence of `decisions` |
| Requirement coverage | 25 | `constraints` + `status` |
| Next-action coverage | 20 | `nextActions` + presence of `blockers` |

Recommendations are produced for any missing axis (no goal, no pinned goal,
no constraints, no status, no next actions, etc.).

## Project Memory

`ProjectMemoryService` stores free-form notes on the project itself.
Memory is included in every render mode so anything the user wants to
permanently survive AI switches survives them.

## Extending the Engine

- **New facet kind**: add to `FacetKind`, `FACET_LABELS`, `FACET_TO_FIELD`,
  `EMPTY_PASSPORT`, schema enum, migration. Add extraction rules in
  `extractFacets.ts`.
- **New render mode**: implement `ContinuityRenderStrategy` in
  `services/continuity/strategies/<id>.ts`, register in `strategies/index.ts`,
  add `continuity:<id>` to `plans.ts` if premium.
- **New domain extractor**: implement an extractor in `DomainExtractors.ts`,
  add an insights field on the schema, wire merge in `IntelligenceService`,
  add a render mode that consumes it.
- **Replace heuristic extraction with an LLM**: implement the same
  `extractFacets()` shape in a new module and swap the import. Nothing
  downstream changes.

All of this happens without touching UI components — business logic lives in
`services/`, presentation in `features/` and `ui/`.
