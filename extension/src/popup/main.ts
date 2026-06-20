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
  const health = container.resolve(Tokens.Health);

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

  const healthBadge = document.getElementById("cp-health-badge") as HTMLSpanElement;
  const healthType = document.getElementById("cp-health-type") as HTMLSpanElement;
  const healthRecs = document.getElementById("cp-health-recs") as HTMLUListElement;

  async function refreshHealth(projectId: string | null): Promise<void> {
    if (!projectId) {
      healthBadge.textContent = "Health —";
      healthBadge.dataset.state = "idle";
      healthType.textContent = "";
      healthRecs.innerHTML = "";
      return;
    }
    const p = await projects.get(projectId);
    if (!p) return;
    const report = health.evaluate(p);
    healthBadge.textContent = `Health ${report.score}/100 · ${report.grade}`;
    healthBadge.dataset.state = report.score >= 70 ? "active" : report.score >= 40 ? "warn" : "bad";
    healthType.textContent = `· detected: ${p.intelligence.conversationType}`;
    healthRecs.innerHTML = report.recommendations
      .slice(0, 3)
      .map((r) => `<li>${escapeHtml(r)}</li>`)
      .join("");
  }

  const projectPicker = await renderProjectPicker({
    select: document.getElementById("cp-project") as HTMLSelectElement,
    newButton: document.getElementById("cp-new-project") as HTMLButtonElement,
    stats: document.getElementById("cp-passport-stats") as HTMLParagraphElement,
    projects,
    storage,
  });
  await refreshHealth(projectPicker.activeProjectId());
  (document.getElementById("cp-project") as HTMLSelectElement)
    .addEventListener("change", () => refreshHealth(projectPicker.activeProjectId()));

  renderCapture({
    button: document.getElementById("cp-capture") as HTMLButtonElement,
    status: document.getElementById("cp-capture-status") as HTMLParagraphElement,
    getProjectId: () => projectPicker.activeProjectId(),
    onCapture: (projectId) => sendToActiveTab({ type: "CAPTURE_ACTIVE_TAB", projectId }),
    afterCapture: async () => {
      await projectPicker.refresh();
      await refreshHealth(projectPicker.activeProjectId());
    },
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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
