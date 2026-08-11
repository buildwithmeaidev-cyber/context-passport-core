# Rebuild the ContextPassport site around live, animated product demos

Full rewrite of the marketing site: calm, minimal, generously spaced — Claude-adjacent in feel but its own identity (warm paper canvas, ink-black type, a clay/amber accent, one grid, no gradients or glow). Every claim on the page is backed by a small animation that actually shows the extension doing the thing.

## Look and feel

- Warm light canvas (`#faf9f5` page, `#f2efe8` panels), near-black ink text, single clay accent, hairline borders instead of shadows.
- Demo stages sit on a near-black surface so the extension UI reads like a real screen inside the page.
- Type: one serif-ish display for headlines, clean sans for body. Big headline sizes, short lines, lots of whitespace.
- Motion: slow and quiet — fades and 4–8px rises, 200–400ms, staggered. Everything respects `prefers-reduced-motion` (animations settle on their final frame).

## The demos (all coded in React + CSS, no video files)

**1. Hero walkthrough — the full loop.** A looping scene showing a stylized ChatGPT window on the left and a Claude window on the right. Beat by beat: cursor moves to the extension icon → popup opens → "Capture & paste handoff" clicks → progress ring fills → passport facets fly out of the chat into the popup → switch to the Claude tab → handoff text types itself into the composer → done. About 14 seconds, loops, with play/pause and a scrubber of labelled beats (Capture · Compress · Transfer · Continue) the user can click to jump to any step.

**2. One short demo per feature**, each 4–6 seconds, each in its own section next to a short plain-language explanation of what it is and why it matters:

- **Context Intelligence Engine** — raw transcript lines dissolve; structured facets (Goal, Decisions, Constraints, Progress, Open questions, Next actions) assemble in their place.
- **Thread separation** — three provider threads shown as separate stacked rails; a new capture animates into the correct rail instead of the blended pile.
- **Handoff modes** — the same passport re-renders as Quick / Balanced / Developer / Research / Founder, with the panel morphing between them; user can click the mode chips.
- **Capture modes and preview** — the pre-capture modal counts up turns, flags duplicates, and shows the integrity banner clearing.
- **Context Health Score** — a 0–100 dial counting up with recommendations appearing one by one.
- **Retention and export** — old captures fading out under a keep-last-N rule, and an export bundle sliding out as a file.
- **Local-only** — a network panel that stays empty at 0 requests while capture runs.

Each demo replays on hover/click and auto-plays once when scrolled into view.

## Page structure

1. Hero — headline, one-line promise, install CTA, the full walkthrough demo.
2. The problem — six short lines, quiet type-only grid.
3. How it works — the four beats, each with its own frame from the walkthrough.
4. Features — the per-feature sections above, alternating text/demo sides.
5. Providers supported.
6. Privacy and permissions — kept, with the local-only demo.
7. Pricing (Free / Pro / Founder) and comparison table — kept, restyled.
8. FAQ, final CTA, footer.

## Technical notes

- Rewrite `src/routes/index.tsx`; move the design system out of the inline `designStyles` string into tokens in `src/styles.css` (warm palette + fonts via a `<link>` in `src/routes/__root.tsx`).
- New `src/components/demos/` directory: one component per demo plus a shared `<DemoStage>` (dark frame, replay control, in-view trigger) and a small `useTimeline(durationMs)` hook driving all beats off a single `requestAnimationFrame` clock — no per-demo timers, no animation libraries.
- Fake provider chrome (ChatGPT/Claude window shells, popup shell) built as reusable presentational components so all demos share one visual language.
- Extension download flow, zip asset, and existing head metadata preserved; head tags updated for the new copy.
- No backend, no extension code changes.
