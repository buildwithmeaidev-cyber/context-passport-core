## Scope

Six changes to the extension. All local, no backend. One additive storage bump v5 → v6.

---

## 1. Workspace-wide export bundle

`CapturePortabilityService` currently exports a single project only.

- Add `exportAll(format)`:
  - **JSON**: `{ formatVersion: 2, exportedAt, projects: [{ id, name, description, captures[] }] }`. Format version 2 is a superset; the v1 single-project reader stays supported on import.
  - **CSV**: one flat file with a leading `projectId,projectName` pair of columns added to the existing row shape.
- Popup Captures panel: the existing `Export ▾` menu gains **"All projects (JSON)"** and **"All projects (CSV)"** below the current per-project entries.

## 2. Import with per-project conflict handling

- `importIntoProject` / new `importBundle` accept `strategy: "merge" | "dedupe" | "overwrite"`.
  - **merge** — append every capture as-is, no cross-capture dedup (fastest, may duplicate).
  - **dedupe** — current behaviour: hash every turn, drop turns already in the project.
  - **overwrite** — delete the project's existing captures and passport facets sourced from them, then ingest the payload fresh.
- New import modal (reuses preview-modal styling + focus trap): after the file is read, it lists each project in the payload with a detected match in the current workspace, the capture/turn counts, and a per-row strategy `<select>`. Unmatched projects get a "Create new project" row. Confirm runs the import and shows a per-project result summary.
- Bundle imports route to matching projects by name (case-insensitive) with a manual override dropdown.

## 3. Adapter-level capture warnings

Today `CaptureIntegrityService` reports *what* is wrong, not *why*.

- Adapters gain an optional `lastExtractionDiagnostics` on `DomAdapterBase`: which selector matched, which fell back, node counts per selector, and which fields (role, text, title) came up empty.
- `SafeProviderAdapter` passes diagnostics through; a failing adapter still reports its trip reason.
- `PreviewResult.integrity` gains `diagnostics: { providerId, adapterVersion, selectorsTried: [{ selector, matched, usedFor }], missingFields: string[] }`.
- The integrity banner gets a **"Show details"** disclosure rendering that table in plain language, e.g. *"Claude adapter: message container selector `div[data-test-render-count]` matched 0 nodes — fell back to `.font-claude-message`; 3 turns have no role."*

## 4. Retention policy

- Settings gain `retention: { enabled, keepLastN, maxAgeDays }` (defaults: enabled, keepLastN 25, maxAgeDays 90; the hard 50-capture cap stays as a ceiling).
- New `services/retention/RetentionService.ts` — pure function computing which captures to prune, plus `pruneProject`/`pruneAll` that also strip passport facets sourced from pruned captures (pinned facets always survive) and rebuild turn-hash registries.
- Runs on popup open and after every ingest. Options page gets the controls plus a "Prune now" button showing what would be removed before confirming.

## 5. Context separation + deeper auto-context (the "mixed context" fix)

Root cause: every capture from a tab lands in whichever project is active, and the passport merges all of them into one flat facet pool, so ChatGPT/Claude/Gemini threads blend together and handoff text reads thin.

- **Thread identity.** Each capture gains `threadKey` (provider id + normalized conversation URL path) and `threadTitle`. Captures from the same AI conversation append to the same thread; a new conversation URL always starts a new, distinctly named thread — never merged into an existing one.
- **Auto-naming.** Thread names become `<Provider> · <topic derived from the first user turn> · <n>` and stay stable across recaptures instead of getting a new timestamped name each time. Manual rename still wins.
- **Scoped passport.** Facets carry the `threadKey` already present in `source`. The Captures panel gains a scope switch: **All threads / This thread only**, and the handoff render respects it, so pasted context is one coherent project or one coherent conversation — not a blend.
- **Deep auto-summary.** New `services/continuity/ThreadSummarizer.ts` builds, per thread, a structured brief on every ingest: topic, chronological decision timeline with timestamps, current status, code/file references, unresolved questions, and concrete next actions — with turn-level provenance. This is generated locally from the turns (no LLM) and injected at the top of every handoff render, so the pasted context is self-explanatory and usable by a receiving AI rather than a bag of quotes.
- Storage v6 migration is additive: backfill `threadKey`/`threadTitle` on existing captures from their URL + provider, default summaries to `null` and regenerate lazily.

## 6. Interactive popup

Same Linear/Raycast dark system, more life:

- Command palette (`Cmd/Ctrl+K`) for: capture, paste handoff, switch project, switch thread, export, undo.
- Animated capture flow — progress ring during extraction, count-up on turn totals, success checkmark, all ≤200ms.
- Thread rail: collapsible list grouped by provider with provider glyphs, live turn/duplicate badges, hover previews.
- Inline sparkline of captures over time in the stats row; toast stack replacing the single status line; skeletons on load.

---

## Technical notes

- Storage v5 → v6 is additive; no data loss. Migration backfills thread fields and retention defaults.
- New files: `services/retention/RetentionService.ts`, `services/continuity/ThreadSummarizer.ts`, `services/capture/AdapterDiagnostics.ts`, `ui/commandPalette.ts`, `ui/importDialog.ts`.
- Edited: `storage/schema.ts`, `storage/migrations/index.ts`, `shared/messaging.ts`, `providers/_base/DomAdapterBase.ts` + four adapters, `providers/SafeProviderAdapter.ts`, `services/capture/CaptureService.ts`, `services/capture/CaptureIntegrityService.ts`, `services/portability/CapturePortabilityService.ts`, `services/project/ProjectService.ts`, `services/continuity/strategies/*`, `popup/index.html`, `popup/main.ts`, `options/main.ts`, `ui/tokens.css`, docs.
- Tests to add: `retention.test.ts`, `threads.test.ts` (separation + naming stability + summary shape), `portability-bundle.test.ts` (all-projects round-trip, three conflict strategies), `diagnostics.test.ts`. Existing 43 tests must stay green.
- Rebuild and repackage `contextpassport.zip` at the end. No landing-page changes.
