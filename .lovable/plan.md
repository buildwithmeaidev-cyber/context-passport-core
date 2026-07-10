## Problem

When the popup opens, the "Delete all ContextPassport data?" modal (and the onboarding modal) render on top of the UI. Clicking Cancel, Close, or Confirm appears to do nothing — the modal never disappears.

## Root cause

In `extension/src/ui/tokens.css` the modal backdrop rule is:

```css
.cp-modal-backdrop {
  display: flex;
  ...
}
```

An explicit `display: flex` beats the browser's default `[hidden] { display: none }`. So even though the HTML has `hidden` on `#cp-onboarding` and `#cp-erase-modal`, and the JS in `popup/main.ts` toggles `modal.hidden = true/false` correctly, the CSS keeps both modals visible at all times. The Cancel/Close/Confirm handlers do run and do set `hidden`, but the user sees no change.

This also explains why the popup appears to open on the delete screen: the erase modal is stacked over the normal popup content from the first paint.

## Fix (CSS only, one rule)

Add a hidden-state override so the attribute wins:

```css
.cp-modal-backdrop[hidden] { display: none; }
```

Location: `extension/src/ui/tokens.css`, in the Modal section around line 395.

No JS, HTML, or business-logic changes — the existing `wireEraseFlow` / `maybeShowOnboarding` logic in `extension/src/popup/main.ts` is already correct.

## Verification

1. Rebuild the extension and repackage `public/contextpassport.zip`.
2. Open the popup on a fresh profile:
   - Onboarding modal shows once. "Got it — let's go" closes it and does not reappear on later opens.
   - Main popup (Active project / Capture / Continue / Privacy panel) is the default view.
3. Click "Delete my data" (in onboarding or in the Privacy panel):
   - Confirmation modal opens with the live inventory.
   - **Cancel** closes it.
   - Clicking the backdrop closes it.
   - **Yes, delete everything** runs `EraseService.eraseAll()`, shows the ✓ success summary, and **Close** dismisses the modal.
4. Reopen the popup — it opens directly on the Capture view, as expected.

## Out of scope

No changes to `EraseService`, storage, feature flags, or any other functionality — the deletion engine itself already works; it was just visually masked by the stuck modal.
