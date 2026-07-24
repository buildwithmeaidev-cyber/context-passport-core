## Goal

Make capture predictable and non-repeating:
1. **Active-capture lock** — once you pick a capture in the switcher, all pastes use only that capture until you explicitly switch (or capture a new one).
2. **Capture mode switch** — choose how much of the chat to extract: Full chat, New since last capture, or Last N turns.
3. **Stronger per-turn dedup** — repeated old turns never reappear across captures, even if the DOM shifts.
4. **Preview before confirm** — show which turns and how many will be saved before the capture is written.

## Changes

### 1. Active-capture lock
- Add `activeCaptureId?: string` to the `settings:user` schema (per-project map: `{ [projectId]: captureId }`) in `extension/src/storage/schema.ts` (bump migration).
- `ProjectService`: add `setActiveCapture(projectId, captureId | null)` and `getActiveCapture(projectId)`.
- `popup/main.ts`:
  - When the user picks a capture in the switcher, persist it as active + show a small "🔒 Locked to this capture" chip in the hero.
  - The one-click **Capture & paste handoff** and the Advanced **Paste saved handoff** both honor the lock: they render with `captureId = activeCaptureId` when set.
  - Chip has an "Unlock" affordance; a fresh capture auto-locks to the new capture.
- `ContinuityService` already supports a `captureId` filter — reuse it.

### 2. Capture mode switch
- New enum `CaptureMode = "full" | "sinceLast" | "lastN"`, stored per-project in settings with an `n` value (default 20).
- Popup UI: small segmented control under the one-click button (Full · New · Last N) plus a compact number input when Last N is chosen. Persisted between opens.
- `CaptureService.capture(url, { mode, n, sinceCaptureId })`:
  - `full` — current behavior.
  - `lastN` — slice `turns.slice(-n)` after extraction.
  - `sinceLast` — drop any turn whose key matches turns of the most recent capture on the same URL/provider (uses new registry below).

### 3. Stronger per-turn dedup registry
- New storage key `turnRegistry:v1` (Map keyed by `projectId` → `Set<hash>` serialized as arrays, capped ~5k entries with FIFO eviction).
- Hash = `sha1(role + "::" + normalize(text))` where `normalize` collapses whitespace, lowercases, strips markdown/punctuation, and clips to first 400 chars (so trivial edits still collide).
- `ProjectService.ingestCapture`:
  - Load registry for the project, filter `captured.turns` before storing.
  - Add new hashes to the registry, persist.
  - Keeps working across DOM changes because the hash is on rendered text, not DOM identity.
- Remove the current in-memory `seen` loop; it's superseded.

### 4. Preview step
- New message `PREVIEW_CAPTURE` in `shared/messaging.ts` — content script returns `{ turns, totalBeforeFilters, droppedDuplicates, droppedByMode }` without writing anything.
- Add `CaptureService.preview(url, opts)` that runs extraction + mode filter + dedup dry-run.
- Popup: clicking Capture opens a lightweight modal (`#cp-preview-modal`) showing:
  - Provider · Mode · Turn count (kept / dropped duplicates / dropped by mode)
  - Scrollable list of the first ~10 turns with role badges + truncated text
  - Buttons: **Confirm capture**, **Cancel**, and a "Skip preview next time" checkbox (stored in settings).
- One-click flow: preview → confirm → capture → render → inject (still one click if "Skip preview" is on).

## Technical notes

- Storage bump: `settings:user` v-next adds `activeCaptureByProject`, `captureMode`, `captureLastN`, `skipCapturePreview`. Migration is additive (defaults filled in).
- New key `turnRegistry:v1` is separate so it can be wiped independently and doesn't bloat the projects blob.
- `EraseService.preview()` and `eraseAll()` must include `turnRegistry:v1` in the inventory and wipe.
- Tests to add under `extension/tests/`:
  - `captureModes.test.ts` — full/sinceLast/lastN behavior.
  - `turnRegistry.test.ts` — dedup across two captures with reshuffled DOM.
  - `activeCaptureLock.test.ts` — lock persists, paste uses locked capture, new capture re-locks.

## Files touched

- `extension/src/storage/schema.ts` (+ migration)
- `extension/src/services/capture/CaptureService.ts`
- `extension/src/services/project/ProjectService.ts`
- `extension/src/services/privacy/EraseService.ts`
- `extension/src/shared/messaging.ts`
- `extension/src/content/index.ts` (handle `PREVIEW_CAPTURE`)
- `extension/src/popup/index.html` + `popup/main.ts`
- `extension/src/features/capture/captureView.ts`
- `extension/src/ui/tokens.css` (modal + segmented control + lock chip)
- `extension/tests/*` (new)

## Out of scope

- No changes to landing page, providers' selectors, or continuity render strategies beyond passing `captureId`.
- No new premium gating.
