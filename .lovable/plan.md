## Scope

Five additions to the extension's capture pipeline and popup UI. All local, no backend, no schema-breaking changes beyond an additive v4 → v5 migration for undo history.

---

## 1. Capture integrity check (pre-confirm)

Extend the existing preview flow (`PREVIEW_CAPTURE_ACTIVE_TAB`) with a validation pass that runs on the extracted turns before the modal renders.

- New `services/capture/CaptureIntegrityService.ts` returning `{ level: "ok" | "warn" | "error", issues: Issue[] }`.
- Checks: empty turn text, missing role, role not in enum, suspiciously short turns (<3 chars), consecutive identical turns, in-capture duplicate rate, missing title, zero user turns, zero assistant turns, first turn is assistant (likely DOM cut-off), last turn suspiciously truncated (ends mid-sentence with no punctuation and near the max char cap → likely DOM truncation).
- `PreviewResult` in `shared/messaging.ts` gains `integrity: { level, issues: [{ code, severity, message, count? }] }`.
- Preview modal renders a warning banner (yellow for `warn`, red for `error`) above the sample block. Confirm button stays enabled for `warn`, requires an extra "Capture anyway" click for `error`.

## 2. Undo last capture

- Storage v5 adds `lastCaptureUndo` per project: `{ captureId, previousActiveCaptureId, capturedAt } | null`. Migration is additive (default `null`).
- `ProjectService.ingestCapture` records undo state after every successful ingest (overwrites prior undo — single-level undo only, matches the "last capture" requirement).
- `ProjectService.undoLastCapture(projectId)` removes the capture, rebuilds the project's turn-hash registry from remaining captures, restores the prior `activeCaptureByProject` entry, clears `lastCaptureUndo`.
- Popup shows an "Undo last capture" pill in the Captures panel when undo state exists, with the capture title and a relative timestamp. Also surfaced as a toast for ~10s right after a successful capture.

## 3. Export / import captures

- New `services/portability/CapturePortabilityService.ts`.
  - `exportProject(projectId, format)` → JSON (full fidelity: captures + `turnHashes` + passport optional flag) or CSV (flat: `captureId,capturedAt,providerId,title,turnIndex,role,text`).
  - `importIntoProject(projectId, payload)` validates via a dedicated zod schema (independent of internal `Capture` schema so future format changes don't break imports), re-hashes turns, and runs the same cross-capture dedup path as normal ingest.
- Popup Captures panel gets `Export ▾` (JSON / CSV) and `Import…` buttons. Import uses a hidden `<input type="file">`; JSON only for round-trip, CSV import supported for JSON as well as CSV. Result summary reuses the preview modal styling ("Imported X captures, skipped Y duplicates").
- No new permissions — uses `Blob` + `URL.createObjectURL` for export and `FileReader` for import.

## 4. Accessibility for popup + modals

- Preview modal and delete-data modal: add `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`. Focus moves to the modal's heading on open, restored to the invoking button on close.
- Focus trap utility in `ui/focusTrap.ts` (tab/shift-tab cycle across focusable descendants, Escape closes).
- Capture switcher list becomes a `role="listbox"` with `role="option"` rows, arrow-key navigation, Enter to select, Space to toggle lock. Each row gets `aria-selected`, `aria-label` describing provider + title + timestamp + lock state.
- Buttons that are icon-only get `aria-label`. Live region (`aria-live="polite"`) added to the status paragraph so screen readers hear "Captured", "Duplicate skipped", etc.
- Existing keyboard shortcut hints in the UI stay; documented shortcuts: `↑/↓` in switcher, `Enter` confirm, `Esc` cancel/close, `L` toggle lock on focused capture.

## 5. Capture stats panel

- New `services/capture/CaptureStatsService.ts` (pure functions over stored data — no new persistence).
  - Per-capture: `totalTurns`, `uniqueTurns`, `duplicateRate` (dupes vs. current project registry at capture time, computed live from `turnHashes` intersections with other captures), `userTurns`, `assistantTurns`, `capturedAt`, `providerId`.
  - Per-project: `lastSuccessfulCaptureAt`, total captures, aggregate duplicate rate, first/last capture timestamps.
- Popup gains a collapsible "Stats" section per capture in the switcher (chevron toggle) and a compact project-level stats row at the top of the Captures panel.
- No new storage. Recomputed on popup open; cheap given the 50-capture cap.

---

## Technical notes

- Storage bump v4 → v5 is additive; `migrations[4]` sets `lastCaptureUndo = null` on each project. No data loss risk.
- No new host permissions, no network. All features run locally.
- Tests to add:
  - `tests/integrity.test.ts` — each integrity rule fires on the right fixture.
  - `tests/undo.test.ts` — ingest → undo restores captures, hashes, active lock.
  - `tests/portability.test.ts` — round-trip JSON export/import is lossless; CSV escapes commas/newlines/quotes; malformed payloads rejected via zod.
  - `tests/stats.test.ts` — duplicate rate and aggregate math on fixture projects.
  - Existing 37 tests must still pass.
- Files touched (new): `services/capture/CaptureIntegrityService.ts`, `services/capture/CaptureStatsService.ts`, `services/portability/CapturePortabilityService.ts`, `ui/focusTrap.ts`, four new test files.
- Files touched (edit): `storage/schema.ts`, `storage/migrations/index.ts`, `shared/messaging.ts`, `services/capture/CaptureService.ts`, `services/project/ProjectService.ts`, `popup/index.html`, `popup/main.ts`, `ui/tokens.css`, `docs/STORAGE_SCHEMA.md`, `docs/ARCHITECTURE.md`.
- Rebuild + repackage the extension zip at the end; no landing-page changes.
