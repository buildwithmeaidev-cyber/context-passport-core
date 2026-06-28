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
  const flags = container.resolve(Tokens.Flags);
  const erase = container.resolve(Tokens.Erase);

  // ===== Privacy panel + onboarding =====
  await wirePrivacyPanel(flags);
  wireEraseFlow(erase, async () => {
    await projectPicker?.refresh().catch(() => {});
    await refreshHealth(null);
  });
  await maybeShowOnboarding(storage);

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
  document.getElementById("cp-privacy-more")?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
})();

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

async function wirePrivacyPanel(flags: import("@/services/license/FeatureFlagService").FeatureFlagService): Promise<void> {
  const togStore = document.getElementById("cp-tog-storage") as HTMLInputElement;
  const togInject = document.getElementById("cp-tog-inject") as HTMLInputElement;
  const dotStore = document.getElementById("cp-dot-store") as HTMLSpanElement;
  const dotInject = document.getElementById("cp-dot-inject") as HTMLSpanElement;
  const badge = document.getElementById("cp-privacy-badge") as HTMLSpanElement;

  const sync = () => {
    const s = flags.isEnabled("privacy.allowLocalStorage");
    const i = flags.isEnabled("privacy.allowInjection");
    togStore.checked = s;
    togInject.checked = i;
    dotStore.dataset.state = s ? "on" : "off";
    dotInject.dataset.state = i ? "on" : "off";
    const allOn = s && i;
    badge.textContent = allOn ? "Local only" : "Restricted";
    badge.dataset.state = allOn ? "good" : "warn";
  };
  sync();
  togStore.addEventListener("change", async () => {
    await flags.set("privacy.allowLocalStorage", togStore.checked);
    sync();
  });
  togInject.addEventListener("change", async () => {
    await flags.set("privacy.allowInjection", togInject.checked);
    sync();
  });
}

async function maybeShowOnboarding(storage: import("@/storage/StorageGateway").StorageGateway): Promise<void> {
  const modal = document.getElementById("cp-onboarding") as HTMLDivElement;
  const dismiss = document.getElementById("cp-onb-dismiss") as HTMLButtonElement;
  const r = await storage.read("settings:user");
  const settings = r.ok && r.value
    ? r.value
    : { activeProjectId: null, defaultRenderMode: "balanced", theme: "system" as const, onboardingSeenAt: null };
  if (settings.onboardingSeenAt) return;
  modal.hidden = false;
  dismiss.addEventListener("click", async () => {
    modal.hidden = true;
    await storage.write("settings:user", { ...settings, onboardingSeenAt: Date.now() });
  });
}

