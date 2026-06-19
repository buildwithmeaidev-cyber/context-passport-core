# Architecture

ContextPassport AI is an **AI Work Continuity Platform** shipped as a Chrome Manifest V3 extension. The product preserves six structured facets of a project — Goals, Decisions, Constraints, Progress, Open Questions, Next Actions — and re-emits them as a prompt the next AI can ground on. It is **not** a conversation copier.

The codebase is optimized for long-term maintainability: small modules, explicit boundaries, dependency injection, and pluggable registries for the parts that change most often (providers, continuity render modes, pricing).

## Domain model

```
Project
├── name, description, timestamps
├── ContextPassport
│   ├── goals[]            FacetItem
│   ├── decisions[]        FacetItem
│   ├── constraints[]      FacetItem
│   ├── progress[]         FacetItem
│   ├── openQuestions[]    FacetItem
│   └── nextActions[]      FacetItem
└── captures[]             Capture (raw, used for re-extraction; capped)
```

`FacetItem` carries `text`, `source` (provenance), `confidence` (heuristic), and user state (`pinned`, `dismissed`). Pinned items always survive merges and rendering caps; dismissed items never reappear.

## Continuity loop

```
  ┌─────────────────────┐    capture    ┌─────────────────────┐
  │  Active AI tab      │ ────────────► │  ProjectService     │
  │  (ChatGPT/Claude/…) │               │  .ingestCapture()   │
  └─────────────────────┘               └──────────┬──────────┘
                                                   │ extract + merge
                                                   ▼
                                        ┌─────────────────────┐
                                        │  ContextPassport    │
                                        │  (durable artifact) │
                                        └──────────┬──────────┘
                                                   │ ContinuityService.render(mode)
                                                   ▼
  ┌─────────────────────┐   inject     ┌─────────────────────┐
  │  Target AI tab      │ ◄─────────── │  Continuity prompt  │
  └─────────────────────┘              └─────────────────────┘
```

The user's mental model is "I'm working on Project X, I'll resume with a different AI." Capture, merge, and render are three explicit steps a user can run in any order.

## Layering

```
ui  ──────────► features ──────────► services ──────────► core / storage
 (no logic)     (composition,         (pure logic;        (primitives:
                 view bindings)        return Result<T>)   DI, Result, types)
                                                ▲
                                                │
                                          providers
                                       (adapters per AI site)
```

Rules:
- UI: pure render + event dispatch. No `chrome.*` calls, no parsing.
- Features: compose services for a single user goal (capture, inject, project picker). Glue only.
- Services: own all business logic. Never touch `chrome.*`; they go through `StorageGateway` or accept dependencies in their constructor.
- Providers: implement a single interface (`ProviderAdapter`). The only files allowed to query an AI site's DOM. When a site changes, one file changes.

## Runtimes

A Chrome MV3 extension has three runtimes: background service worker, content script (per matching page), and popup/options pages. Each runtime constructs its **own** DI container via `src/core/composition.ts`. Cross-runtime communication goes through `src/shared/messaging.ts` using typed messages — never globals.

| Runtime    | Owns                                                       |
|------------|------------------------------------------------------------|
| background | install/update hooks, legacy v1→v2 import, schema marker    |
| content    | `CaptureService`, `InjectionService` (DOM-bound, project-aware) |
| popup      | Project picker, capture-to-project, render-and-inject UI    |
| options    | Project list, passport viewer/editor, feature flags         |

## Dependency Injection

`src/core/container.ts` is a token-based container. Every service is registered by `Token<T>` (see `src/core/tokens.ts`). Services receive collaborators through their constructor. **No service imports another concrete service directly.** Tests and a future server-backed `LicenseService` swap in without touching feature code.

## Provider Adapters

Contract: `src/providers/ProviderAdapter.ts`. Shared DOM logic lives in `_base/DomAdapterBase.ts`. Concrete adapters only declare CSS selectors. v1 ships ChatGPT, Claude, Gemini, and **Perplexity**.

To add a provider:
1. Create `src/providers/<id>/<Id>Adapter.ts` extending `DomAdapterBase`.
2. Register in `src/providers/registry.ts`.
3. Add the host to `manifest.json` (`content_scripts` + `host_permissions`).

Nothing else changes.

## Facet Extraction

`src/core/extractFacets.ts` is a heuristic, regex-based extractor over the captured turns. It is intentionally conservative — under-extraction is recoverable in the options page (user adds an item manually or pins one); hallucinated facets are not. A future LLM-backed extractor must keep the same `(turns, source) → FacetItem[]` signature so the rest of the codebase doesn't move.

## Continuity Render Strategies

Contract: `src/services/continuity/ContinuityRenderStrategy.ts`. The pluggable registry lives in `strategies/index.ts`. Each strategy receives `(projectName, projectDescription, passport, targetProviderId?, targetChars?)` and returns a prompt string + stats.

v1 ships four modes:
- `brief` (free) — single paragraph per facet; top items only.
- `essential` (free) — Goals · Decisions · Constraints · Next Actions only.
- `full` (free) — every visible facet, every item, with headings.
- `handoff` (premium) — formal handoff with provider-specific preamble, ranked & numbered items, explicit "ask before overriding pinned items" footer.

Adding a mode = one file + one registry line.

## Pricing & Feature Flags

`src/services/license/plans.ts` is **data**: `PricingPlan[]` mapping `planId → features[] + limits`. Changing pricing or moving a feature between tiers is a one-line edit. UI never checks `planId` directly; it asks `LicenseService.has(featureId)` or `FeatureFlagService.isEnabled(flagId)`.

`FeatureFlagService` resolves in this order: user override (storage) → license tier → compile-time defaults. The seam where a remote-flag service plugs in later.

## Errors

Services return `Result<T, AppError>` (`src/core/result.ts`). The top of each runtime (popup `main.ts`, content `index.ts`) is the only place that converts errors to user-facing strings.

## Storage

See `STORAGE_SCHEMA.md`. All reads/writes go through `StorageGateway`: validates with zod, runs forward-only migrations on read, and **quarantines** invalid data into a `quarantine:*` namespace rather than dropping it. Current schema version is **2** (v1 conversations are imported into a "Legacy import" project on update).

## Testing

`extension/tests/` uses Vitest with the same `@/` alias as the runtime build. Four contract test files ship today:
- `storage.test.ts` — round-trip, v1→v2 settings migration, quarantine.
- `providers.test.ts` — every adapter satisfies the full contract.
- `extractFacets.test.ts` — heuristic extractor finds each of the six facets in a sample conversation.
- `continuity.test.ts` — strategy registry + license gating + provider-specific handoff preamble.

Run: `cd extension && bun install && bunx vitest run`.

## What's intentionally **not** here

- No backend, no auth, no payments.
- No remote LLM calls — extraction and rendering are purely local heuristics.
- No telemetry.

Each is buildable on top of the existing seams (`LicenseService`, `FeatureFlagService`, `extractFacets`, render strategy registry) without changing feature code. See `CODE_PROTECTION.md` for what monetization realistically requires.
