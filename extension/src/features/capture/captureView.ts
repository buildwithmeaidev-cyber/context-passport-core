// Feature slice: capture view. UI-only — delegates to messaging.

export interface CaptureViewDeps {
  button: HTMLButtonElement;
  status: HTMLParagraphElement;
  getProjectId: () => string | null;
  onCapture: (projectId: string) => Promise<unknown>;
  afterCapture: () => Promise<void>;
}

export function renderCapture(deps: CaptureViewDeps): void {
  deps.button.addEventListener("click", async () => {
    const projectId = deps.getProjectId();
    if (!projectId) {
      deps.status.textContent = "Pick or create a project first.";
      return;
    }
    deps.button.disabled = true;
    deps.status.textContent = "Reading this page locally…";
    try {
      await deps.onCapture(projectId);
      await deps.afterCapture();
      deps.status.textContent = "✓ Conversation captured. Saved locally. Ready to continue in another AI.";
    } catch (e) {
      deps.status.textContent = `Couldn't capture: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      deps.button.disabled = false;
    }
  });
}
