# Extension Update Strategy

## Versioning

- SemVer in `manifest.json`. Patch = bugfix, minor = additive features or new adapter, major = storage migration or breaking permission change.
- Adapter-only changes (CSS selector fixes) are patch releases. Adapter outages are the most frequent change driver, so they must ship fast and independently of feature work.

## Install / Update Hooks

`src/background/index.ts` handles `chrome.runtime.onInstalled` with reason `install` or `update`:

1. Build the DI container.
2. Read `meta:schemaVersion`. If missing or older than `CURRENT_VERSION`, write the marker. Per-key migrations run lazily on first read of each key (see `StorageGateway.migrate`).
3. Log to the service-worker console for diagnostic capture.

Migrations are **forward-only** and **idempotent** — re-running an already-migrated key is a no-op because `__v === CURRENT_VERSION`.

## Rollback Strategy

- Storage migrations cannot be reversed automatically. Before any destructive migration, the gateway writes the prior payload to `quarantine:<key>:<ts>`. Users can export the quarantine via the options page (planned).
- For one major version after a breaking change, the previous schema's zod definition is kept in `schema.ts` history (git) so a hotfix can re-read old data if needed.

## Remote Kill Switch (without a backend)

Adapters and risky features are gated by **feature flags** stored in `flags:overrides`. The options page exposes per-provider toggles. If a future adapter starts producing bad data after a site change, the user can disable that provider with one click and the rest of the extension keeps working. A future server-backed `FeatureFlagService` implementation can fetch the same map remotely without code changes elsewhere.

## Distribution

- **Today (sideload):** `bun run build && nix run nixpkgs#zip -- -r ../public/contextpassport.zip .` produces `public/contextpassport.zip`. The web landing page serves a "Download" button. Users follow the 4-step unpacked-install flow.
- **Tomorrow (Web Store):** the same `extension/dist/` directory is zipped and uploaded to the Chrome Web Store. No code changes — the build output is the deliverable in both cases.

## Adapter Update Cadence

Each provider adapter ships with:

- a contract test (`tests/providers.test.ts`) that verifies the public surface,
- a feature flag (`providers.<id>.enabled`) defaulting to `true`,
- a documented selector list in the adapter file.

When a site changes its DOM:

1. Update selectors in the affected `*/Adapter.ts` — single-file change.
2. Update fixture-based selector tests (future work; today selector validity is only checked at runtime).
3. Patch release.

## Pre-release Checklist

- `bunx tsc --noEmit` clean (strict mode).
- `bunx vitest run` green.
- Manual sideload smoke test: capture on each provider, inject into the other two.
- Bump version in `manifest.json` and `package.json` together.
- Rebuild zip; verify it loads as unpacked.

## Out of Scope (today)

- Automatic Web Store submission.
- Auto-update for sideloaded users (Chrome doesn't support it without the Store).
- A/B rollout — single-channel only.
