# New brand identity, walkthrough player, motion toggle, feature sections

## 1. New brand — distinct from Claude (60 / 30 / 10)
Drop the warm paper + clay palette and the serif headlines entirely.
- 60% dominant: cool off-white canvas `#f4f6f8` (page) — neutral, slightly blue, no warmth.
- 30% secondary: deep ink-teal `#0e2a33` for nav, demo stages, footer bands, pricing highlight and headings.
- 10% accent: signal lime `#c6f432` used only for primary CTAs, active steps, progress fills and key highlights (with ink text on it for contrast).
- Supporting: muted slate `#5b6b73` for body copy, hairline `#d9e0e4` borders.
- Type: Space Mono for headlines, labels, step numbers; Rubik for body. Square-ish 6px radius, monospace step counters (01/02…), grid lines — an "indie tech / instrument panel" feel instead of an editorial one.
- All values become semantic tokens in the stylesheet; fonts loaded in the page head.

## 2. Hero walkthrough as a full video-style player
Keeps the coded animation (no video file), wrapped in a player:
- Caption bar under the stage showing the current step's caption (e.g. "Step 2 of 6 — The popup opens on the ChatGPT tab").
- ~6 captioned steps covering the whole flow end to end: open chat → open extension → capture → compress into passport → switch to Claude → handoff pasted, review and send.
- Controls: Play, Pause, Previous step, Next step, Replay, and a clickable step timeline. Stepping pauses at the start of that step so users go at their own pace. Keyboard: Space play/pause, ← / → step.

## 3. Reduced-motion toggle
- A "Motion: Full / Reduced" switch in the nav (and in the player).
- Reduced: all loops stop, demos show their final/static frame, hover/fade effects disabled; walkthrough becomes manual step-by-step only.
- Defaults to the visitor's system setting, remembered in the browser.

## 4. Each feature in its own dedicated section
For each of the 7 features (Intelligence engine, Thread separation, Handoff modes, Capture preview, Health score, Retention & export, Local-only):
- Own section with anchor, number, title, one-line value.
- Numbered step-by-step explanation (3–4 steps).
- "Screenshot" strip: 3 static frames captured from the coded mockup at key moments, each captioned to match a step.
- The live demo beside it, with its own play/pause/replay.
- A small in-page index of features for jumping between sections.

## 5. Rest of page
Problem, providers, privacy, pricing (Free / Pro $9 / Founder $39 highlighted), comparison, FAQ, CTA restyled to the new palette. Download flow kept.

## Technical notes
- Replace tokens in `src/site.css`; swap fonts in `__root.tsx`.
- Extend `useTimeline` with `pause`, `seekStep`, step index, and a global motion context (`MotionProvider`) read by every demo.
- New `WalkthroughPlayer` (captions + controls); new `FeatureSection` that renders steps, frozen-frame screenshots (demo rendered at fixed `t`), and live demo.
- No backend, no extension changes.
