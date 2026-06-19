# Architecture

ContextPassport AI is a Chrome Manifest V3 extension. The codebase is optimized for long-term maintainability: small modules, explicit boundaries, dependency injection, and pluggable registries for the parts that change most often (providers, compression modes, pricing).

## Layering

```
ui  ──────────► features ──────────► services ──────────► core / storage
 (no logic)     (composition,         (pure logic;        (primitives:
                 view bindings)        return Result<T>)   DI, Result, Logger)
                                                ▲
                                                │
                                          providers
                                       (adapters per AI site)
```

Rules:
- UI components are pure render + event dispatch. No `chrome.*` calls, no validation, no parsing.
- Features compose services for a single user goal (capture, inject, settings). They contain glue only.
- Services contain all business logic. They never touch `chrome.*` directly; they go through `StorageGateway` or accept dependencies in their constructor.
- Providers implement a single interface (`ProviderAdapter`) and are the only files allowed to query the DOM of an AI site. When a site's DOM changes, only one file needs editing.

## Runtimes

A Chrome MV3 extension has three runtimes: background service worker, content script (per matching page), and popup/options pages. Each runtime constructs its **own** DI container via `src/core/composition.ts`. Cross-runtime communication goes through `src/shared/messaging.ts` using typed messages — never via globals.

| Runtime    | Owns                                           |
|------------|------------------------------------------------|
| background | install/update hooks, schema-version marker     |
| content    | `CaptureService`, `InjectionService` (DOM-bound) |
| popup      | UI to trigger capture / select compression mode  |
| options    | feature flags, plan info, vault management       |

## Dependency Injection

`src/core/container.ts` is a 40-line token-based container. Every service is registered by `Token<T>` (see `src/core/tokens.ts`). Services receive collaborators through their constructor. **No service imports another concrete service directly.** This lets tests swap any implementation and lets the eventual server-backed `LicenseService` drop in without touching feature code.

## Provider Adapters

Contract: `src/providers/ProviderAdapter.ts`. Shared DOM logic lives in `src/providers/_base/DomAdapterBase.ts`; concrete adapters only declare CSS selectors. To add a provider:

1. Create `src/providers/<id>/<Id>Adapter.ts` extending `DomAdapterBase`.
2. Register in `src/providers/registry.ts`.
3. Add the host to `manifest.json` (`content_scripts` + `host_permissions`).

Nothing else changes. The popup, services, and storage are agnostic to provider count.

## Compression Strategies

Contract: `src/services/compression/CompressionStrategy.ts`. To add a mode:

1. Create `src/services/compression/strategies/<id>.ts`.
2. Append it to the `strategies` array in `strategies/index.ts`.
3. Mark `premium: true` if it should be gated — `LicenseService` handles the gate, the UI greys it out automatically.

## Pricing & Feature Flags

`src/services/license/plans.ts` is **data**: a list of `PricingPlan` objects mapping `planId → features[] + limits`. Changing pricing or moving a feature between tiers is a one-line edit. UI never checks `planId` directly; it asks `LicenseService.has(featureId)` or `FeatureFlagService.isEnabled(flagId)`.

`FeatureFlagService` resolves in this order: user override (storage) → license tier → compile-time defaults. This is the seam where a remote-flag service can plug in later.

## Errors

Services return `Result<T, AppError>` (`src/core/result.ts`) instead of throwing across boundaries. The top of each runtime (popup `main.ts`, content `index.ts`) is the only place that converts errors to user-facing strings. This guarantees no `try/catch` leaks into UI components.

## Storage

See `STORAGE_SCHEMA.md`. All reads/writes go through `StorageGateway` which: validates with zod, runs forward-only migrations on read, and **quarantines** invalid data into a `quarantine:*` namespace rather than dropping it. Reliability beats convenience.

## Testing

`extension/tests/` uses Vitest with the same `@/` alias as the runtime build. Three contract tests ship today:

- `storage.test.ts` — round-trip + quarantine behavior.
- `providers.test.ts` — every adapter satisfies the full contract.
- `compression.test.ts` — strategy registry + license gating.

Run: `cd extension && bun install && bunx vitest run`.

## What's intentionally **not** here

- No backend, no auth, no payments.
- No remote LLM calls — compression is purely local.
- No telemetry.

All three are buildable on top of the existing seams (`LicenseService`, `FeatureFlagService`, service-level `Result` returns) without changing feature code.
