import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";
import { sendToActiveTab, type DetectResult } from "@/shared/messaging";
import { renderCapture } from "@/features/capture/captureView";
import { renderInjector } from "@/features/injector/injectorView";
import { renderProjectPicker } from "@/features/projects/projectPickerView";

(async () => {
  const container = await buildContainer("popup");
  const projects = container.resolve(Tokens.Projects);
  const continuity = container.resolve(Tokens.Continuity);
  const storage = container.resolve(Tokens.Storage);

  // Detect active provider
  const providerBadge = document.getElementById("cp-provider") as HTMLSpanElement;
  let activeProviderId: string | null = null;
  try {
    const r = await sendToActiveTab<DetectResult>({ type: "DETECT_ACTIVE_PROVIDER" });
    activeProviderId = r.providerId;
    providerBadge.textContent = r.providerId ?? "not on a supported site";
    providerBadge.dataset.state = r.providerId ? "active" : "idle";
  } catch {
    providerBadge.textContent = "not on a supported site";
    providerBadge.dataset.state = "idle";
  }

  const projectPicker = await renderProjectPicker({
    select: document.getElementById("cp-project") as HTMLSelectElement,
    newButton: document.getElementById("cp-new-project") as HTMLButtonElement,
    stats: document.getElementById("cp-passport-stats") as HTMLParagraphElement,
    projects,
    storage,
  });

  renderCapture({
    button: document.getElementById("cp-capture") as HTMLButtonElement,
    status: document.getElementById("cp-capture-status") as HTMLParagraphElement,
    getProjectId: () => projectPicker.activeProjectId(),
    onCapture: (projectId) => sendToActiveTab({ type: "CAPTURE_ACTIVE_TAB", projectId }),
    afterCapture: () => projectPicker.refresh(),
  });

  await renderInjector({
    modeSelect: document.getElementById("cp-mode") as HTMLSelectElement,
    modeDesc: document.getElementById("cp-mode-desc") as HTMLParagraphElement,
    button: document.getElementById("cp-inject") as HTMLButtonElement,
    status: document.getElementById("cp-inject-status") as HTMLParagraphElement,
    projects,
    continuity,
    getProjectId: () => projectPicker.activeProjectId(),
    getTargetProvider: () => activeProviderId,
    inject: (text) => sendToActiveTab<null>({ type: "INJECT_INTO_ACTIVE_TAB", text }),
  });

  document.getElementById("cp-options")?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
})();
