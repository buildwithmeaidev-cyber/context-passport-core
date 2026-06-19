
# ContextPassport AI — Build Plan

A Manifest V3 Chrome extension that lets users capture conversations from one AI site (ChatGPT, Claude, Gemini), store them in a local versioned vault, compress/optimize them locally, and inject the result into another AI site. All logic runs locally — no backend, no LLM API calls.

The plan optimizes for long-term maintainability: strict TS, feature-based folders, provider adapters behind an interface, DI container, versioned storage with migrations, and a feature-flag service so pricing/premium modes can be toggled later without touching feature code.

## Deliverables

1. Chrome Extension MV3 (TypeScript strict) built with Vite, packaged to `public/contextpassport.zip`.
2. A small landing page (existing TanStack Start app) with a download button + install instructions.
3. Architecture, storage-schema, and update-strategy docs in `extension/docs/`.

## Folder structure

```text
extension/
  manifest.json
  src/
    core/                  # DI container, result/error types, logger, event bus, types
      container.ts
      logger.ts
      events.ts
      result.ts
      types.ts
    providers/             # One adapter per AI site, all implement ProviderAdapter
      ProviderAdapter.ts   # interface contract
      registry.ts          # host->adapter resolution
      chatgpt/
      claude/
      gemini/
    services/              # Pure business logic, no DOM, no UI
      capture/             # extract conversation via active adapter
      compression/         # CompressionMode strategy registry (none|dedupe|summary-heuristic|aggressive)
      injection/           # inject text via active adapter
      vault/               # CRUD over storage, search, tagging
      license/             # premium gating; today returns "free" tier, future-ready
      pricing/             # PricingPlan registry (config-driven, no code changes to add tiers)
    storage/               # Versioned storage gateway
      schema.ts            # zod schemas per version
      migrations/          # v1->v2->... pure functions
      StorageGateway.ts    # get/set with migration on read, namespaced keys
      index.ts
    features/              # Feature-based slices; UI + feature hooks only, NO business logic
      capture/
      vault-browser/
      injector/
      settings/
      premium-upsell/
    shared/                # cross-cutting utils (dom helpers, debounce, ids)
    ui/                    # presentational components + design tokens, no logic
      components/
      tokens.css
    background/            # MV3 service worker entry; wires DI container
      index.ts
    content/               # content-script entry; resolves adapter, exposes bridge
      index.ts
    popup/                 # popup entry (React), composes features
      index.html
      main.tsx
    options/               # options page entry
      index.html
      main.tsx
  tests/                   # vitest; unit tests per service + adapter contract tests
  docs/
    ARCHITECTURE.md
    STORAGE_SCHEMA.md
    UPDATE_STRATEGY.md
  vite.config.ts
  tsconfig.json            # strict: true, noUncheckedIndexedAccess, exactOptionalPropertyTypes
```

## Key architectural rules (enforced in code + docs)

- **DI container** (`core/container.ts`): tiny token-based registry. Background worker constructs the container and wires concrete services; popup/content scripts receive interfaces only. No service imports another concrete service directly.
- **Provider adapter contract** (`ProviderAdapter`): `id`, `matches(url)`, `detect()`, `extractConversation()`, `injectPrompt(text)`, `capabilities`. Adding a provider = new folder + register in `providers/registry.ts`. Nothing else changes.
- **Compression strategy registry**: each mode implements `CompressionStrategy { id, label, premium, run(input): Output }`. Adding a mode = new file + register. UI lists modes from the registry, gated by `LicenseService.can(modeId)`.
- **Pricing / feature flags**: `pricing/plans.ts` is a data file mapping `planId -> { features[], compressionModes[], price }`. `FeatureFlagService` resolves `isEnabled(flag)` from (a) local config, (b) license tier, (c) user override. UI never hardcodes "isPremium".
- **Versioned storage**: every write tagged with `__v`. On read, `StorageGateway` runs sequential migrations to current version. Schemas validated with zod; invalid data quarantined, never silently dropped.
- **No business logic in UI**: features call services via injected hooks (`useService(Token)`). Lint rule + code review checklist documented in ARCHITECTURE.md. Components are pure render + event dispatch.
- **Result type**: services return `Result<T, AppError>` instead of throwing across boundaries; UI maps errors to user-visible messages in one place.
- **Reliability**: adapter contract tests run against recorded HTML fixtures so a site DOM change fails tests before shipping. Storage migrations have round-trip tests. CI-style script `bun test` runs all of it.

## Providers at v1

ChatGPT, Claude, Gemini adapters — each minimal but real (extract last N turns, inject into composer). The adapter interface is the stable contract; sites change often, so adapters are the only churn surface.

## Compression modes at v1 (all local, no LLM)

- `none` (free)
- `dedupe` — collapse repeated turns / quoted blocks (free)
- `summarize-heuristic` — sentence-rank + keep code blocks verbatim (free)
- `aggressive` — heuristic + drop low-signal turns, hard token cap (marked premium in pricing config; gate is a one-line flag flip)

## Storage schema (v1)

Namespaces: `vault:conversations`, `vault:index`, `settings:user`, `flags:overrides`, `meta:schemaVersion`. Full field-level schema, indexes, and quota strategy live in `STORAGE_SCHEMA.md`.

## Update strategy (summary, full doc in UPDATE_STRATEGY.md)

- SemVer in `manifest.json`. Background worker runs `runMigrations(fromVersion, toVersion)` on `chrome.runtime.onInstalled` with reason `update`.
- Adapter changes ship behind a `providers.<id>.enabled` flag so a broken adapter can be remotely-disabled via a settings toggle without re-uploading.
- Rollback: storage migrations are forward-only; previous schema kept in `meta:backup:<version>` for one major version.
- Distribution: zipped unpacked build in `public/contextpassport.zip` for sideload now; Web Store listing later (same build pipeline).

## Landing page (existing TanStack app)

Replace `src/routes/index.tsx` placeholder with a single page: product blurb, "Download extension" button (blob-fetch pattern), and the 4-step unpacked-install instructions. No backend, no auth.

## Out of scope (explicitly)

- No backend, no Lovable Cloud, no auth, no payments wiring (pricing is config only).
- No LLM API calls from the extension.
- No Web Store submission automation.

## Acceptance checklist

- `bun run build` produces `extension/dist` and `public/contextpassport.zip`.
- Loading the unpacked extension in Chrome shows the popup; capture on chatgpt.com, switch to claude.ai, inject works end-to-end.
- Adding a fake 4th provider requires only a new folder + 1 registry line (verified by writing one in tests).
- Bumping schema to v2 with a migration passes round-trip tests and does not lose v1 data.
- All three docs exist and match the code.
