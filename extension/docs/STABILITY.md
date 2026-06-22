# Stability & Update Strategy

ContextPassport prioritizes **stability over rapid feature development**. Every
update must preserve the guarantees below, and every release runs through the
checklist in this document before being packaged.

## Guarantees

1. **Provider isolation** — if ChatGPT changes its DOM, only the ChatGPT
   adapter fails. Claude, Gemini, Perplexity, capture, render, and storage
   continue working. Enforced by `SafeProviderAdapter` (every adapter is
   wrapped at registry construction; thrown exceptions become `Result`
   errors; after 3 consecutive failures the adapter is "tripped" and
   reports `FEATURE_DISABLED` until the next page load).

2. **Feature isolation** — features live behind `FeatureFlagService`. A
   broken feature is disabled via a flag override, not a code revert.

3. **Storage migrations** — `storage/schema.ts` defines `CURRENT_VERSION`.
   Every bump requires a forward-only migration in `storage/migrations/`.
   Migrations are idempotent and run on first read after upgrade; a failed
   migration falls back to a read-only snapshot of the previous shape
   rather than corrupting data.

4. **Versioned APIs** — message types in `shared/messaging.ts` carry a
   `v: number` field. Background and content scripts negotiate the highest
   common version; old clients keep working until they're upgraded.

5. **Feature flags** — `FeatureFlagService` resolves in three layers: user
   override → license tier → compile-time default. Any new feature ships
   behind a flag for at least one release.

6. **Error boundaries** — service boundaries return `Result<T, AppError>`,
   not throws. The UI layer renders a degraded state for `err` results; it
   never propagates an exception across a process boundary (content ↔
   background ↔ popup).

7. **Rollback support** — `public/contextpassport.zip` is the canonical
   release artifact. Older zips live in git history; rollback is "load
   the previous zip in chrome://extensions".

8. **Graceful degradation** — when a provider trips, the popup shows it as
   "degraded" rather than removing it. When a render mode fails, the popup
   falls back to the next-lower mode (Founder → Developer → Balanced →
   Quick).

## When ONE provider breaks

```
 user opens chatgpt.com
      │
      ▼
 SafeProviderAdapter(chatgpt).extractConversation()
      │  throws (DOM drift)
      ▼
 caught → returns err(ADAPTER_FAILED)
      │
      ▼
 popup shows "ChatGPT capture unavailable — try Claude/Gemini/Perplexity"
      │
      ▼
 user switches tabs, every other provider still works
```

Storage, render, popup, options, license, intelligence — all unaffected.

## Testing strategy

| Layer        | Tool   | Lives in                          | What it proves                                |
| ------------ | ------ | --------------------------------- | --------------------------------------------- |
| Unit         | vitest | `tests/extractFacets.test.ts`     | Facet extraction is deterministic.            |
| Unit         | vitest | `tests/intelligence.test.ts`      | Type detection + domain extractors.           |
| Unit         | vitest | `tests/continuity.test.ts`        | Each render strategy produces stable output.  |
| Integration  | vitest | `tests/storage.test.ts`           | Migrations run forward without data loss.     |
| Provider     | vitest | `tests/providers.test.ts`         | Adapter contract honored uniformly.           |
| Regression   | vitest | `tests/safeProvider.test.ts`      | One broken provider cannot break siblings.    |

Run all tests: `cd extension && bun install && bunx vitest run`.

### Unit tests
Pure functions only. No DOM, no `chrome.*`. Each `*.test.ts` mirrors a
`src/**/*.ts` module.

### Integration tests
Wire two or more services with an in-memory `StorageGateway`. Verify the
contract between layers, not their internals.

### Provider tests
Drive each adapter against fixture HTML, asserting the adapter contract
(`matches`, `detect`, `extractConversation`, `injectPrompt`) is honored
identically. New adapters MUST add to `tests/providers.test.ts`.

### Regression tests
Every previously-shipped failure mode gets a permanent test that pins the
fix. The first is `safeProvider.test.ts`, which encodes the
provider-isolation invariant.

## Architecture review checklist (every update)

Before opening a release:

- [ ] `bunx vitest run` passes — 0 failures, 0 skipped.
- [ ] No new public-API breakage. Any breaking change to a
      `shared/messaging.ts` type bumps its `v:` version and keeps the old
      handler for one release.
- [ ] `storage/schema.ts` `CURRENT_VERSION` was either left alone or bumped
      together with a new migration in `storage/migrations/`. The new
      migration was tested in `tests/storage.test.ts`.
- [ ] Every new provider is registered through `SafeProviderAdapter` (i.e.
      added to `createDefaultRegistry`, never instantiated raw at a call
      site).
- [ ] Every new feature has a `FeatureFlagService` flag with a sensible
      default and is gated in the UI on `isEnabled(...)`.
- [ ] Every new service boundary returns `Result<T, AppError>`; no
      `throw`s cross process boundaries.
- [ ] `manifest.json` `version` was bumped. `extension/build.mjs` was run.
      `public/contextpassport.zip` was rebuilt.
- [ ] Manual smoke test on at least one provider that wasn't touched, to
      confirm isolation.
- [ ] If a previous failure was fixed, a regression test was added.

## Backward compatibility rules

- Storage shapes are append-only between major versions. Removing a field
  requires a migration that preserves the data under a deprecated key for
  at least one release.
- License feature IDs in `services/license/plans.ts` are stable strings.
  Renaming a feature requires keeping the old ID as an alias.
- Render mode IDs (`quick`, `balanced`, `developer-handoff`, …) are
  user-visible preferences stored in `chrome.storage.local`. Never rename
  one in place; deprecate and add a migration.

## Rollback procedure

1. In `chrome://extensions`, remove the broken unpacked install.
2. Download the previous `contextpassport.zip` from git history:
   `git show <prev-commit>:public/contextpassport.zip > /tmp/old.zip`.
3. Unzip and `Load unpacked` the previous folder.
4. Storage migrations are non-destructive, so the older extension reads
   newer storage without data loss.
