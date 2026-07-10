Plan to make the Chrome extension actually work from the first click:

1. Fix the connection failure
- Add a safe popup helper that detects the active tab URL before sending messages.
- If Chrome says “Receiving end does not exist,” automatically inject the content script into the current supported AI page, then retry capture/paste.
- Show a clear status when the page is unsupported, still loading, or protected by Chrome so the user is not left with a broken error.

2. Make capture and paste reliable on real AI sites
- Update provider adapters for ChatGPT, Claude, Gemini, and Perplexity with more current selectors for conversation turns and composer fields.
- Improve text insertion so React/ProseMirror-style editors receive focus, input, paste/input events, and keep the inserted text visible.
- Add Perplexity to the default enabled provider flags so it does not silently fail.

3. Make it one-click
- Replace the confusing separate “Capture this conversation” and “Paste summary into this tab” flow with a primary action:
  - On a supported AI conversation: “Capture context”
  - After context exists: “Continue here”
  - Optional combined action: “Capture & paste handoff” when useful
- Keep advanced project/mode controls available, but visually secondary/collapsed.

4. Add an on-page quick widget so users do not open the full popup every time
- Add a small floating ContextPassport button on supported AI pages.
- The widget will offer quick actions: Capture, Continue here, and Open full controls.
- It will use the active project automatically, creating “My first project” if none exists.

5. Improve popup UI/UX
- Put the provider/site status at the top with actionable labels: Ready on ChatGPT, Open an AI chat, Reload this tab, etc.
- Add success states that say exactly what happened: captured turns, saved locally, pasted into composer.
- Reduce visual clutter by moving health recommendations and privacy details into collapsible sections.

6. Verify and package
- Add/adjust tests for message retry, provider defaults, and adapter behavior where possible.
- Rebuild the extension and repackage the downloadable zip so loading the updated extension in Chrome uses the fixed files.