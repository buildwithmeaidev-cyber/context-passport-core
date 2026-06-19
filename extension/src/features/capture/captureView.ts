// Feature slice: capture view bindings. NO business logic — orchestrates a
// service call and updates DOM only.

import type { CapturedConversation } from "@/core/tokens";

export interface CaptureViewDeps {
  button: HTMLButtonElement;
  status: HTMLParagraphElement;
  onCapture: () => Promise<CapturedConversation>;
  refreshSources: () => Promise<void>;
}

export function renderCapture(deps: CaptureViewDeps): void {
  deps.button.addEventListener("click", async () => {
    deps.button.disabled = true;
    deps.status.textContent = "Capturing…";
    try {
      const c = await deps.onCapture();
      deps.status.textContent = `Saved “${c.title}” (${c.turns.length} turns).`;
      await deps.refreshSources();
    } catch (e) {
      deps.status.textContent = `Failed: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      deps.button.disabled = false;
    }
  });
}
