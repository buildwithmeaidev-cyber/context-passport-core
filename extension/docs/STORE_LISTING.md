# Chrome Web Store Listing — ContextPassport AI

Copy-paste ready. All assets sized to current (2026) Web Store specs.

---

## Name
**ContextPassport AI — Continue Any AI Conversation Anywhere**

(45 char limit; current = 56 → use short form below if rejected.)

**Short name (fallback):** `ContextPassport AI`

## Category
**Productivity** (primary). Secondary: *Developer Tools*.

## Short description (132 chars max)
> Capture, structure, and transfer project context across ChatGPT, Claude, Gemini, and Perplexity — without rebuilding it every time.

(130 / 132)

## Detailed description

> **Stop re-explaining your project to every AI.**
>
> ContextPassport AI captures your conversation, extracts the parts
> that actually matter — goals, decisions, constraints, progress,
> open questions, next actions — and packages them into a structured
> handoff you can paste into any other AI.
>
> Move between ChatGPT, Claude, Gemini, and Perplexity without
> losing your project's history.
>
> **What gets preserved**
> • Project goal and current status
> • Important decisions and constraints
> • Completed work and files referenced
> • Open questions, blockers, and next actions
>
> **Five render modes**
> Quick · Balanced · Developer Handoff · Research Handoff · Founder Handoff
> The right one is picked automatically based on conversation type.
>
> **Built for reliability**
> • Provider isolation — if one AI site changes its layout, the others keep working
> • Versioned local storage with forward-only migrations
> • Zero network calls. Zero telemetry. Everything stays on your device.
>
> **Free** to use. **Pro** unlocks unlimited projects and history.
> **Founder** is a one-time $39 lifetime license.

## Permissions justification

Required by Chrome Web Store for every permission listed in `manifest.json`.

| Permission | One-line justification |
|---|---|
| `storage` | Save your projects and captured passports locally in your browser. No server is contacted. |
| `activeTab` | Read the conversation on the AI tab you clicked the extension icon on. |
| `scripting` | Paste the continuation prompt into the AI site's composer when you click "Continue here". |
| `host_permissions` (chatgpt.com, chat.openai.com, claude.ai, gemini.google.com, perplexity.ai) | Required so the content script can read and write the composer on each supported AI site. The extension does not run on any other host. |

**Single purpose statement** (required field):
> ContextPassport AI captures structured context from one AI chat and
> formats it for continuation in another AI chat.

## Privacy practices disclosures

| Data type | Collected? | Sold? | Used for? |
|---|---|---|---|
| Personally identifiable info | **No** | No | — |
| Health info | **No** | No | — |
| Financial info | **No** | No | — |
| Authentication info | **No** | No | — |
| Personal communications | **Stored locally only** | No | The user's own AI chats stay in `chrome.storage.local` for the user to retrieve. Never transmitted. |
| Location | **No** | No | — |
| Web history | **No** | No | — |
| User activity | **No** | No | — |
| Website content | **Stored locally only** | No | Same as personal communications. |

Certifications required for store listing:
- ☑ I do not sell or transfer user data to third parties.
- ☑ I do not use or transfer user data for purposes unrelated to the
  item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness
  or for lending purposes.

## Privacy policy (host on landing-page route `/privacy`)

> **ContextPassport AI — Privacy Policy**
> Last updated: June 2026.
>
> ContextPassport AI is a local-only Chrome extension. It does not
> collect, transmit, sell, or share any personal data.
>
> **What is stored:** captured conversations, derived passports, and
> your preferences are stored in `chrome.storage.local` on your own
> device. They are never sent to any server controlled by the
> developer or any third party.
>
> **What we do not do:** no analytics, no telemetry, no advertising
> identifiers, no remote configuration, no account system.
>
> **Network access:** the extension makes no network requests. All
> processing happens locally in your browser.
>
> **Removal:** uninstalling the extension deletes all local data.
>
> Contact: support@contextpassport.app

## Store FAQ (paste into description tail or landing page)

**Q: Do you read my chats?**
A: No. The extension reads them locally in your browser when you click
its icon. Nothing leaves your machine.

**Q: Does it work offline?**
A: Yes — there are zero network calls.

**Q: Will it keep working if ChatGPT changes its UI?**
A: If one provider breaks, the others keep working. The broken
provider trips itself and the popup shows it as "degraded" until the
next release.

**Q: Why a Founder plan?**
A: One-time payment, lifetime updates, supports a tiny indie team.

## Visual assets plan

| Asset | Size | Purpose | Brief |
|---|---|---|---|
| Icon 128×128 | 128×128 PNG | Store + toolbar | Indigo (`#6366f1`) passport monogram on dark surface (`#17171c`). |
| Icon 48×48 | 48×48 PNG | Management page | Same mark, optical-adjusted. |
| Small promo tile | 440×280 PNG | Search results | Headline "Continue any AI conversation anywhere." Mark + 4 AI logos in row. |
| Marquee promo tile | 1400×560 PNG | Featured collections | Hero composition: rendered passport card centered, soft radial behind. |
| Screenshot 1 | 1280×800 | "Capture in one click" | ChatGPT view with popup open showing extracted facets. |
| Screenshot 2 | 1280×800 | "Pick a render mode" | Popup with 5 mode tabs, Developer selected. |
| Screenshot 3 | 1280×800 | "Paste anywhere" | Claude view with prompt injected via "Continue here". |
| Screenshot 4 | 1280×800 | "Project memory" | Options page projects list with timestamps. |
| Screenshot 5 | 1280×800 | "Privacy first" | Permissions explainer panel, "0 network calls" stat. |

## Keywords (store search)

`ai context`, `chatgpt to claude`, `claude to gemini`, `ai handoff`,
`conversation transfer`, `ai memory`, `prompt manager`, `developer ai
tools`, `research assistant`, `ai productivity`, `cross ai`,
`context window`.

## Submission checklist

- [ ] `manifest.json#version` bumped
- [ ] `public/contextpassport.zip` rebuilt
- [ ] 37/37 tests passing
- [ ] Privacy policy URL live at `/privacy`
- [ ] Icons (128, 48) included in zip root
- [ ] Permissions list matches `STORE_LISTING.md` table exactly
- [ ] 5 screenshots prepared at 1280×800
- [ ] Promo tile 440×280 prepared
- [ ] Support email reachable
