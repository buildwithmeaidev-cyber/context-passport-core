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

  wireEraseFlow(erase, async () => {
    await projectPicker.refresh();
    await refreshHealth(projectPicker.activeProjectId());
  });

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
  const eraseBtn = document.getElementById("cp-onb-erase") as HTMLButtonElement;
  const r = await storage.read("settings:user");
  const settings = r.ok && r.value
    ? r.value
    : { activeProjectId: null, defaultRenderMode: "balanced", theme: "system" as const, onboardingSeenAt: null };
  eraseBtn.addEventListener("click", () => openEraseModal());
  if (settings.onboardingSeenAt) return;
  modal.hidden = false;
  dismiss.addEventListener("click", async () => {
    modal.hidden = true;
    await storage.write("settings:user", { ...settings, onboardingSeenAt: Date.now() });
  });
}

function openEraseModal(): void {
  const modal = document.getElementById("cp-erase-modal") as HTMLDivElement;
  modal.hidden = false;
  modal.dispatchEvent(new CustomEvent("cp:open"));
}

function wireEraseFlow(
  erase: import("@/services/privacy/EraseService").EraseService,
  afterErase: () => Promise<void>,
): void {
  const modal = document.getElementById("cp-erase-modal") as HTMLDivElement;
  const openBtn = document.getElementById("cp-erase-open") as HTMLButtonElement;
  const cancel = document.getElementById("cp-erase-cancel") as HTMLButtonElement;
  const confirm = document.getElementById("cp-erase-confirm") as HTMLButtonElement;
  const close = document.getElementById("cp-erase-close") as HTMLButtonElement;
  const list = document.getElementById("cp-erase-list") as HTMLUListElement;
  const done = document.getElementById("cp-erase-done") as HTMLDivElement;
  const summary = document.getElementById("cp-erase-summary") as HTMLParagraphElement;
  const desc = document.getElementById("cp-erase-desc") as HTMLParagraphElement;

  const reset = (): void => {
    done.hidden = true;
    cancel.hidden = false;
    confirm.hidden = false;
    confirm.disabled = false;
    confirm.textContent = "Yes, delete everything";
    desc.hidden = false;
    list.hidden = false;
  };

  const renderPreview = async (): Promise<void> => {
    reset();
    list.innerHTML = `<li class="cp-erase-row"><span class="cp-spinner"></span><span>Scanning local data…</span></li>`;
    const p = await erase.preview();
    const rows: Array<[string, number | string]> = [
      ["Projects", p.projects],
      ["Captured conversations", p.captures],
      ["Passport items (goals, decisions, next actions…)", p.passportItems],
      ["Project memory notes", p.memoryNotes],
      ["User settings", p.hasSettings ? "1 record" : "none"],
      ["Feature-flag overrides", p.hasFlagOverrides ? "1 record" : "none"],
      ["Quarantined data", p.quarantine],
    ];
    list.innerHTML = rows.map(([label, value]) => {
      const empty = value === 0 || value === "none";
      return `<li class="cp-erase-row${empty ? " cp-is-empty" : ""}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(String(value))}</strong>
      </li>`;
    }).join("") + `<li class="cp-erase-row cp-erase-total">
        <span>Storage keys to remove</span><strong>${p.totalKeys}</strong>
      </li>`;
  };

  const close_ = (): void => { modal.hidden = true; };

  openBtn.addEventListener("click", () => { modal.hidden = false; renderPreview(); });
  modal.addEventListener("cp:open", () => { renderPreview(); });
  cancel.addEventListener("click", close_);
  close.addEventListener("click", close_);
  modal.addEventListener("click", (e) => { if (e.target === modal) close_(); });

  confirm.addEventListener("click", async () => {
    confirm.disabled = true;
    confirm.innerHTML = `<span class="cp-spinner"></span> Deleting…`;
    try {
      const result = await erase.eraseAll();
      list.hidden = true;
      desc.hidden = true;
      cancel.hidden = true;
      confirm.hidden = true;
      done.hidden = false;
      const parts: string[] = [];
      if (result.projectsRemoved) parts.push(`${result.projectsRemoved} project${result.projectsRemoved === 1 ? "" : "s"}`);
      if (result.capturesRemoved) parts.push(`${result.capturesRemoved} capture${result.capturesRemoved === 1 ? "" : "s"}`);
      if (result.passportItemsRemoved) parts.push(`${result.passportItemsRemoved} passport item${result.passportItemsRemoved === 1 ? "" : "s"}`);
      if (result.memoryNotesRemoved) parts.push(`${result.memoryNotesRemoved} memory note${result.memoryNotesRemoved === 1 ? "" : "s"}`);
      if (result.settingsRemoved) parts.push("user settings");
      if (result.flagsRemoved) parts.push("flag overrides");
      if (result.quarantineRemoved) parts.push(`${result.quarantineRemoved} quarantined record${result.quarantineRemoved === 1 ? "" : "s"}`);
      const body = parts.length ? `Removed ${parts.join(", ")}.` : "There was nothing stored — your device is clean.";
      const verified = result.verifiedEmpty ? "Storage verified empty." : "Storage cleared (some keys required a forced reset).";
      summary.textContent = `${body} ${verified}`;
      await afterErase();
    } catch (e) {
      confirm.disabled = false;
      confirm.textContent = "Try again";
      desc.textContent = `Deletion failed: ${String(e)}. Your data is untouched.`;
      desc.dataset.state = "error";
    }
  });
}


