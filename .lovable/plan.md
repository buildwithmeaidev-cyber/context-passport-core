## Goal

Make it explicit and controllable what ContextPassport does with user data. Add a visible "Privacy & Data" status block (popup + options + first-run onboarding) and two functional toggles enforced by the relevant services.

## What the user will see

1. **Popup — collapsible "Privacy & data" panel** (above the footer)
   - Four short status lines, each with a check icon:
     - *Extract* — facets parsed locally from the page DOM (no network call).
     - *Compress* — passport rendered locally into the chosen mode.
     - *Store* — saved in `chrome.storage.local` on this device only.
     - *Copy/Inject* — only on your click; pasted into the active AI tab's composer.
   - Two toggles:
     - **Allow local storage of captures** (default on)
     - **Allow copy / inject into pages** (default on)
   - Link: "Open full privacy details" → options page section.

2. **Options page — new "Privacy & data handling" section** at the top
   - Same toggles, plus longer explanations for each pipeline stage.
   - "Erase all local data" button (wipes `projects`, `settings:user`, `flags:overrides` via StorageGateway).
   - Network surface statement: "0 outbound requests. Verify in DevTools → Network."

3. **First-run onboarding modal** (popup, shown once)
   - Triggered when `settings:user.onboardingSeenAt` is missing.
   - 1-screen summary of the 4 pipeline stages + the 2 toggles, "Got it" dismiss.
   - Persists `onboardingSeenAt` timestamp so it never re-appears.

## Behavior of the two toggles

- `privacy.allowLocalStorage` (default `true`)
  - When `false`: `ProjectService.ingestCapture` and any passport write short-circuits and returns a typed `FEATURE_DISABLED` error surfaced in the existing capture status line. Already-stored data is left intact (the user can erase explicitly).
- `privacy.allowInjection` (default `true`)
  - When `false`: `InjectionService.inject` and the popup's "Continue here" button refuse with a clear message; the rendered text is still shown so the user can manually copy if they want.

Both toggles route through the existing `FeatureFlagService` (no new storage namespace; uses `flags:overrides`). Defaults added to the `FeatureFlagService` defaults map.

## Storage changes

- Extend `settings:user` schema with `onboardingSeenAt: number | null` (default `null`). No version bump needed — Zod default keeps existing data valid; the schema's `default(null)` handles forward compatibility on read.
- No new keys, no new migration.

## Files to add / edit

**Edit**
- `extension/src/services/license/FeatureFlagService.ts` — add `privacy.allowLocalStorage` and `privacy.allowInjection` defaults.
- `extension/src/services/project/ProjectService.ts` — gate `ingestCapture` on `privacy.allowLocalStorage`.
- `extension/src/services/injection/InjectionService.ts` — gate `inject` on `privacy.allowInjection`.
- `extension/src/storage/schema.ts` — add `onboardingSeenAt` to `settings:user`.
- `extension/src/popup/index.html` — add Privacy panel + onboarding modal markup.
- `extension/src/popup/main.ts` — wire panel toggles, render statuses, show/dismiss onboarding.
- `extension/src/options/index.html` — add Privacy section markup.
- `extension/src/options/main.ts` — wire toggles + "Erase all local data".
- `extension/src/ui/tokens.css` — minimal styles for the panel, toggle row, modal backdrop, status dots (reuse existing tokens, no new colors).
- `extension/docs/STORAGE_SCHEMA.md` — document the two new flag keys and `onboardingSeenAt`.
- `extension/docs/STORE_LISTING.md` — note the in-product privacy panel under "Privacy practices".

**No new files required** — feature lives inside existing popup/options slices.

## Verification

- `bunx vitest run` — existing 37 tests still pass.
- Manual: open popup, toggle "Allow local storage" off, click Capture → expect "Storage disabled" message and no project change. Toggle "Allow copy/inject" off, click Continue here → expect refusal, rendered text still visible.
- Repackage `public/contextpassport.zip` via the existing `extension/build.mjs` flow.

## Out of scope

- No remote sync, no cloud erase, no export-to-file (can be a follow-up).
- No changes to provider adapters or intelligence engine.
