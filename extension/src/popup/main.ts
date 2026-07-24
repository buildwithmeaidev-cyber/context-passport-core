import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";
import { sendToActiveTab, type DetectResult, type PreviewResult, type CaptureOptions, type CaptureMode } from "@/shared/messaging";
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

  await wirePrivacyPanel(flags);
  await maybeShowOnboarding(storage);

  const providerBadge = document.getElementById("cp-provider") as HTMLSpanElement;
  const readyTitle = document.getElementById("cp-ready-title") as HTMLElement;
  const readyDesc = document.getElementById("cp-ready-desc") as HTMLParagraphElement;
  const readyDot = document.getElementById("cp-ready-dot") as HTMLSpanElement;
  const oneClick = document.getElementById("cp-one-click") as HTMLButtonElement;
  const oneClickStatus = document.getElementById("cp-one-click-status") as HTMLParagraphElement;
  let activeProviderId: string | null = null;
  try {
    const r = await sendToActiveTab<DetectResult>({ type: "DETECT_ACTIVE_PROVIDER" });
    activeProviderId = r.providerId;
    providerBadge.textContent = r.providerId ?? "not on a supported site";
    providerBadge.dataset.state = r.providerId ? "active" : "idle";
    readyTitle.textContent = r.providerId ? `Ready on ${providerLabel(r.providerId)}` : "Open a supported AI chat";
    readyDesc.textContent = r.providerId
      ? "Capture this conversation locally and paste a handoff into the composer in one click."
      : "Use ChatGPT, Claude, Gemini, or Perplexity for capture and paste.";
    readyDot.dataset.state = r.providerId ? "active" : "idle";
    oneClick.disabled = !r.providerId;
  } catch {
    providerBadge.textContent = "not on a supported site";
    providerBadge.dataset.state = "idle";
    readyTitle.textContent = "Open a supported AI chat";
    readyDesc.textContent = "Go to ChatGPT, Claude, Gemini, or Perplexity, then open ContextPassport again.";
    readyDot.dataset.state = "idle";
    oneClick.disabled = true;
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
    healthRecs.innerHTML = report.recommendations.slice(0, 3).map((r) => `<li>${escapeHtml(r)}</li>`).join("");
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

  // Capture-mode picker (Full / Since last / Last N) — persisted in settings.
  const captureMode = await wireCaptureModePicker(storage);

  // Capture switcher with active-capture lock.
  const captureSwitcher = wireCaptureSwitcher({
    section: document.getElementById("cp-captures-section") as HTMLElement,
    select: document.getElementById("cp-capture-select") as HTMLSelectElement,
    meta: document.getElementById("cp-capture-meta") as HTMLParagraphElement,
    activateBtn: document.getElementById("cp-capture-activate") as HTMLButtonElement,
    pasteBtn: document.getElementById("cp-capture-paste") as HTMLButtonElement,
    renameBtn: document.getElementById("cp-capture-rename") as HTMLButtonElement,
    deleteBtn: document.getElementById("cp-capture-delete") as HTMLButtonElement,
    status: document.getElementById("cp-capture-switch-status") as HTMLParagraphElement,
    projects,
    continuity,
    storage,
    getProjectId: () => projectPicker.activeProjectId(),
    getTargetProvider: () => activeProviderId,
    getMode: () => (document.getElementById("cp-mode") as HTMLSelectElement | null)?.value || "balanced",
    inject: (text) => sendToActiveTab<null>({ type: "INJECT_INTO_ACTIVE_TAB", text }),
    afterMutate: async () => {
      await projectPicker.refresh();
      await refreshHealth(projectPicker.activeProjectId());
    },
  });
  await captureSwitcher.refresh();
  (document.getElementById("cp-project") as HTMLSelectElement)
    .addEventListener("change", () => captureSwitcher.refresh());

  // Advanced "Capture only" button — also routed through preview.
  const captureBtn = document.getElementById("cp-capture") as HTMLButtonElement;
  const captureStatus = document.getElementById("cp-capture-status") as HTMLParagraphElement;
  captureBtn.addEventListener("click", async () => {
    const projectId = projectPicker.activeProjectId();
    if (!projectId) { setStatus(captureStatus, "Pick or create a project first.", "error"); return; }
    captureBtn.disabled = true;
    setStatus(captureStatus, "Reading this page locally…");
    try {
      const captured = await runCaptureWithPreview(projectId, captureMode.get(), storage);
      if (!captured) { setStatus(captureStatus, "Capture cancelled.", ""); return; }
      await projectPicker.refresh();
      await refreshHealth(projectId);
      await captureSwitcher.refresh();
      setStatus(captureStatus, `✓ Captured ${captured.conversation.turns.length} turns. Saved locally.`, "success");
    } catch (e) {
      setStatus(captureStatus, friendlyError(e), "error");
    } finally {
      captureBtn.disabled = false;
    }
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

  oneClick.addEventListener("click", async () => {
    const projectId = projectPicker.activeProjectId();
    if (!projectId) { setStatus(oneClickStatus, "Pick or create a project first.", "error"); return; }
    oneClick.disabled = true;
    setStatus(oneClickStatus, "Reading this page locally…");
    try {
      const captured = await runCaptureWithPreview(projectId, captureMode.get(), storage);
      if (!captured) { setStatus(oneClickStatus, "Capture cancelled.", ""); return; }
      await projectPicker.refresh();
      await refreshHealth(projectId);
      await captureSwitcher.refresh();
      const project = await projects.get(projectId);
      if (!project) throw new Error("Project not found after capture.");
      const mode = (document.getElementById("cp-mode") as HTMLSelectElement).value || "balanced";
      // Respect the active-capture lock: if one is set, scope the paste to it.
      const activeCaptureId = await getActiveCaptureId(storage, projectId);
      const rendered = continuity.render(mode, {
        projectName: project.name,
        projectDescription: project.description,
        passport: project.passport,
        intelligence: project.intelligence,
        memory: project.memory,
        ...(activeCaptureId ? { captureId: activeCaptureId } : {}),
        ...(activeProviderId ? { targetProviderId: activeProviderId } : {}),
      });
      if (!rendered.ok) throw new Error(rendered.error.message);
      setStatus(oneClickStatus, `Captured ${captured.conversation.turns.length} turns. Pasting handoff…`);
      await sendToActiveTab<null>({ type: "INJECT_INTO_ACTIVE_TAB", text: rendered.value.text });
      setStatus(oneClickStatus, `✓ Captured and pasted ${rendered.value.stats.chars} characters. Review, then press Send.`, "success");
    } catch (e) {
      setStatus(oneClickStatus, friendlyError(e), "error");
    } finally {
      oneClick.disabled = !activeProviderId;
    }
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

function providerLabel(id: string): string {
  return ({ chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini", perplexity: "Perplexity" } as Record<string, string>)[id] ?? id;
}

function setStatus(el: HTMLParagraphElement, text: string, state: "success" | "error" | "" = ""): void {
  el.textContent = text;
  el.dataset.state = state;
}

function friendlyError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (/receiving end|could not establish connection/i.test(message)) {
    return "Could not connect to this AI page. Reload the tab once, then try again.";
  }
  return message;
}

// ===== Settings helpers =====

type Settings = import("@/storage/schema").DataMap["settings:user"];

const DEFAULT_SETTINGS: Settings = {
  activeProjectId: null,
  defaultRenderMode: "balanced",
  theme: "system",
  onboardingSeenAt: null,
  activeCaptureByProject: {},
  captureMode: "since-last",
  captureLastN: 20,
  skipCapturePreview: false,
};

async function readSettings(storage: import("@/storage/StorageGateway").StorageGateway): Promise<Settings> {
  const r = await storage.read("settings:user");
  return r.ok && r.value ? { ...DEFAULT_SETTINGS, ...r.value } : { ...DEFAULT_SETTINGS };
}

async function writeSettings(storage: import("@/storage/StorageGateway").StorageGateway, patch: Partial<Settings>): Promise<Settings> {
  const cur = await readSettings(storage);
  const next: Settings = { ...cur, ...patch };
  await storage.write("settings:user", next);
  return next;
}

async function getActiveCaptureId(storage: import("@/storage/StorageGateway").StorageGateway, projectId: string): Promise<string | null> {
  const s = await readSettings(storage);
  return s.activeCaptureByProject[projectId] ?? null;
}

async function setActiveCaptureId(storage: import("@/storage/StorageGateway").StorageGateway, projectId: string, captureId: string | null): Promise<void> {
  const s = await readSettings(storage);
  const map = { ...s.activeCaptureByProject };
  if (captureId) map[projectId] = captureId; else delete map[projectId];
  await writeSettings(storage, { activeCaptureByProject: map });
}

// ===== Capture mode picker =====

async function wireCaptureModePicker(
  storage: import("@/storage/StorageGateway").StorageGateway,
): Promise<{ get: () => CaptureOptions }> {
  const modeSelect = document.getElementById("cp-capture-mode") as HTMLSelectElement;
  const nInput = document.getElementById("cp-capture-lastn") as HTMLInputElement;
  const desc = document.getElementById("cp-capture-mode-desc") as HTMLParagraphElement;
  const s = await readSettings(storage);
  modeSelect.value = s.captureMode;
  nInput.value = String(s.captureLastN);

  const descs: Record<CaptureMode, string> = {
    "since-last": "Only capture turns that aren't already saved. Best when you keep chatting on the same page.",
    "full": "Capture every turn on screen. Use when starting fresh in a new project.",
    "last-n": "Only take the most recent N turns. Fastest for very long conversations.",
  };
  const sync = () => {
    const mode = modeSelect.value as CaptureMode;
    nInput.hidden = mode !== "last-n";
    desc.textContent = descs[mode];
  };
  sync();

  modeSelect.addEventListener("change", async () => {
    sync();
    await writeSettings(storage, { captureMode: modeSelect.value as CaptureMode });
  });
  nInput.addEventListener("change", async () => {
    const n = Math.max(1, Math.min(200, parseInt(nInput.value || "20", 10) || 20));
    nInput.value = String(n);
    await writeSettings(storage, { captureLastN: n });
  });

  return {
    get: (): CaptureOptions => ({
      mode: modeSelect.value as CaptureMode,
      lastN: parseInt(nInput.value || "20", 10) || 20,
    }),
  };
}

// ===== Pre-capture preview flow =====

interface CaptureRunResult { conversation: { turns: unknown[] } }

async function runCaptureWithPreview(
  projectId: string,
  options: CaptureOptions,
  storage: import("@/storage/StorageGateway").StorageGateway,
): Promise<CaptureRunResult | null> {
  const s = await readSettings(storage);
  if (s.skipCapturePreview) {
    return await sendToActiveTab<CaptureRunResult>({ type: "CAPTURE_ACTIVE_TAB", projectId, options });
  }
  const preview = await sendToActiveTab<PreviewResult>({ type: "PREVIEW_CAPTURE_ACTIVE_TAB", projectId, options });
  const confirmed = await showPreviewModal(preview, storage);
  if (!confirmed) return null;
  return await sendToActiveTab<CaptureRunResult>({ type: "CAPTURE_ACTIVE_TAB", projectId, options });
}

async function showPreviewModal(
  p: PreviewResult,
  storage: import("@/storage/StorageGateway").StorageGateway,
): Promise<boolean> {
  const modal = document.getElementById("cp-preview-modal") as HTMLDivElement;
  const stats = document.getElementById("cp-prev-stats") as HTMLUListElement;
  const samples = document.getElementById("cp-prev-samples") as HTMLDivElement;
  const skip = document.getElementById("cp-prev-skip") as HTMLInputElement;
  const cancel = document.getElementById("cp-prev-cancel") as HTMLButtonElement;
  const confirmBtn = document.getElementById("cp-prev-confirm") as HTMLButtonElement;

  stats.innerHTML = [
    ["Provider detected", p.providerId],
    ["Turns visible on page", p.extractedTurns],
    ["Already saved (skipped)", p.droppedDuplicates],
    ["New turns to save", p.willCapture],
  ].map(([label, value]) => {
    const empty = value === 0 || value === "0";
    return `<li class="cp-erase-row${empty ? " cp-is-empty" : ""}"><span>${escapeHtml(String(label))}</span><strong>${escapeHtml(String(value))}</strong></li>`;
  }).join("");

  const sampleHtml = (t: { role: string; text: string } | null) => t
    ? `<div class="cp-prev-sample"><span class="cp-prev-sample-role">${escapeHtml(t.role)}</span>${escapeHtml(t.text)}</div>`
    : "";
  samples.innerHTML = p.willCapture > 0
    ? `${sampleHtml(p.sampleFirst)}${p.sampleLast && p.willCapture > 1 ? sampleHtml(p.sampleLast) : ""}`
    : `<div class="cp-prev-sample" style="color:var(--cp-muted)">Nothing new to capture with this mode. Switch to Full or Last N to force a re-capture.</div>`;

  confirmBtn.disabled = p.willCapture === 0;
  confirmBtn.textContent = p.willCapture === 0 ? "Nothing to capture" : `Capture ${p.willCapture} turn${p.willCapture === 1 ? "" : "s"}`;
  skip.checked = false;
  modal.hidden = false;

  return await new Promise<boolean>((resolve) => {
    const cleanup = () => {
      modal.hidden = true;
      cancel.removeEventListener("click", onCancel);
      confirmBtn.removeEventListener("click", onConfirm);
      modal.removeEventListener("click", onBackdrop);
    };
    const onCancel = () => { cleanup(); resolve(false); };
    const onConfirm = async () => {
      if (skip.checked) await writeSettings(storage, { skipCapturePreview: true });
      cleanup(); resolve(true);
    };
    const onBackdrop = (e: MouseEvent) => { if (e.target === modal) onCancel(); };
    cancel.addEventListener("click", onCancel);
    confirmBtn.addEventListener("click", onConfirm);
    modal.addEventListener("click", onBackdrop);
  });
}

// ===== Privacy + onboarding =====

async function wirePrivacyPanel(flags: import("@/services/license/FeatureFlagService").FeatureFlagService): Promise<void> {
  const togStore = document.getElementById("cp-tog-storage") as HTMLInputElement;
  const togInject = document.getElementById("cp-tog-inject") as HTMLInputElement;
  const dotStore = document.getElementById("cp-dot-store") as HTMLSpanElement;
  const dotInject = document.getElementById("cp-dot-inject") as HTMLSpanElement;
  const badge = document.getElementById("cp-privacy-badge") as HTMLSpanElement;

  const sync = () => {
    const s = flags.isEnabled("privacy.allowLocalStorage");
    const i = flags.isEnabled("privacy.allowInjection");
    togStore.checked = s; togInject.checked = i;
    dotStore.dataset.state = s ? "on" : "off";
    dotInject.dataset.state = i ? "on" : "off";
    const allOn = s && i;
    badge.textContent = allOn ? "Local only" : "Restricted";
    badge.dataset.state = allOn ? "good" : "warn";
  };
  sync();
  togStore.addEventListener("change", async () => { await flags.set("privacy.allowLocalStorage", togStore.checked); sync(); });
  togInject.addEventListener("change", async () => { await flags.set("privacy.allowInjection", togInject.checked); sync(); });
}

async function maybeShowOnboarding(storage: import("@/storage/StorageGateway").StorageGateway): Promise<void> {
  const modal = document.getElementById("cp-onboarding") as HTMLDivElement;
  const dismiss = document.getElementById("cp-onb-dismiss") as HTMLButtonElement;
  const eraseBtn = document.getElementById("cp-onb-erase") as HTMLButtonElement;
  const s = await readSettings(storage);
  eraseBtn.addEventListener("click", () => {
    const em = document.getElementById("cp-erase-modal") as HTMLDivElement;
    em.hidden = false;
    em.dispatchEvent(new CustomEvent("cp:open"));
  });
  if (s.onboardingSeenAt) return;
  modal.hidden = false;
  dismiss.addEventListener("click", async () => {
    modal.hidden = true;
    await writeSettings(storage, { onboardingSeenAt: Date.now() });
  });
}

function wireEraseFlow(
  erase: import("@/services/privacy/EraseService").EraseService,
  afterErase: () => Promise<void>,
): void {
  const modal = document.getElementById("cp-erase-modal") as HTMLDivElement;
  const openBtn = document.getElementById("cp-erase-open") as HTMLButtonElement;
  const cancel = document.getElementById("cp-erase-cancel") as HTMLButtonElement;
  const confirmBtn = document.getElementById("cp-erase-confirm") as HTMLButtonElement;
  const close = document.getElementById("cp-erase-close") as HTMLButtonElement;
  const list = document.getElementById("cp-erase-list") as HTMLUListElement;
  const done = document.getElementById("cp-erase-done") as HTMLDivElement;
  const summary = document.getElementById("cp-erase-summary") as HTMLParagraphElement;
  const desc = document.getElementById("cp-erase-desc") as HTMLParagraphElement;

  const reset = (): void => {
    done.hidden = true; cancel.hidden = false; confirmBtn.hidden = false;
    confirmBtn.disabled = false; confirmBtn.textContent = "Yes, delete everything";
    desc.hidden = false; list.hidden = false;
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
      return `<li class="cp-erase-row${empty ? " cp-is-empty" : ""}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></li>`;
    }).join("") + `<li class="cp-erase-row cp-erase-total"><span>Storage keys to remove</span><strong>${p.totalKeys}</strong></li>`;
  };

  const close_ = (): void => { modal.hidden = true; };

  openBtn.addEventListener("click", () => { modal.hidden = false; renderPreview(); });
  modal.addEventListener("cp:open", () => { renderPreview(); });
  cancel.addEventListener("click", close_);
  close.addEventListener("click", close_);
  modal.addEventListener("click", (e) => { if (e.target === modal) close_(); });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<span class="cp-spinner"></span> Deleting…`;
    try {
      const result = await erase.eraseAll();
      list.hidden = true; desc.hidden = true; cancel.hidden = true; confirmBtn.hidden = true;
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
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Try again";
      desc.textContent = `Deletion failed: ${String(e)}. Your data is untouched.`;
      desc.dataset.state = "error";
    }
  });
}

// ===== Capture switcher with active-capture lock =====

interface CaptureSwitcherDeps {
  section: HTMLElement;
  select: HTMLSelectElement;
  meta: HTMLParagraphElement;
  activateBtn: HTMLButtonElement;
  pasteBtn: HTMLButtonElement;
  renameBtn: HTMLButtonElement;
  deleteBtn: HTMLButtonElement;
  status: HTMLParagraphElement;
  projects: import("@/services/project/ProjectService").ProjectService;
  continuity: import("@/services/continuity/ContinuityService").ContinuityService;
  storage: import("@/storage/StorageGateway").StorageGateway;
  getProjectId: () => string | null;
  getTargetProvider: () => string | null;
  getMode: () => string;
  inject: (text: string) => Promise<unknown>;
  afterMutate: () => Promise<void>;
}

function wireCaptureSwitcher(deps: CaptureSwitcherDeps): { refresh: () => Promise<void> } {
  // Browsing selection in the dropdown. Independent from the persisted "active" lock.
  let browsingCaptureId: string | null = null;

  async function refresh(): Promise<void> {
    const projectId = deps.getProjectId();
    if (!projectId) { deps.section.hidden = true; return; }
    const project = await deps.projects.get(projectId);
    if (!project || project.captures.length === 0) { deps.section.hidden = true; return; }
    deps.section.hidden = false;

    const activeId = await getActiveCaptureId(deps.storage, projectId);
    if (!browsingCaptureId || !project.captures.find((c) => c.id === browsingCaptureId)) {
      browsingCaptureId = activeId ?? project.captures[0]!.id;
    }

    deps.select.innerHTML = project.captures.map((c) => {
      const activeSuffix = c.id === activeId ? " · ★ active" : "";
      return `<option value="${c.id}" ${c.id === browsingCaptureId ? "selected" : ""}>${escapeHtml(c.title)}${activeSuffix}</option>`;
    }).join("");

    const cur = project.captures.find((c) => c.id === browsingCaptureId)!;
    const when = new Date(cur.capturedAt).toLocaleString();
    const activePill = cur.id === activeId ? ` <span class="cp-capture-active-pill">ACTIVE LOCK</span>` : "";
    deps.meta.innerHTML = `${escapeHtml(cur.providerId)} · ${cur.turns.length} turn${cur.turns.length === 1 ? "" : "s"} · ${escapeHtml(when)}${activePill}`;

    deps.activateBtn.disabled = cur.id === activeId;
    deps.activateBtn.textContent = cur.id === activeId ? "This capture is the active lock" : "Lock as active capture";
  }

  deps.select.addEventListener("change", () => { browsingCaptureId = deps.select.value; refresh(); });

  deps.activateBtn.addEventListener("click", async () => {
    const projectId = deps.getProjectId();
    if (!projectId || !browsingCaptureId) return;
    await setActiveCaptureId(deps.storage, projectId, browsingCaptureId);
    setStatus(deps.status, "✓ Active capture locked. One-click paste and this section will use this capture until you change it.", "success");
    await refresh();
  });

  deps.renameBtn.addEventListener("click", async () => {
    const projectId = deps.getProjectId();
    if (!projectId || !browsingCaptureId) return;
    const project = await deps.projects.get(projectId);
    const cur = project?.captures.find((c) => c.id === browsingCaptureId);
    const next = prompt("Rename capture:", cur?.title ?? "");
    if (!next) return;
    const r = await deps.projects.renameCapture(projectId, browsingCaptureId, next);
    if (!r.ok) { setStatus(deps.status, r.error.message, "error"); return; }
    await refresh();
    await deps.afterMutate();
    setStatus(deps.status, "✓ Renamed.", "success");
  });

  deps.deleteBtn.addEventListener("click", async () => {
    const projectId = deps.getProjectId();
    if (!projectId || !browsingCaptureId) return;
    if (!confirm("Delete this capture? Facets from it (not pinned) will also be removed.")) return;
    const r = await deps.projects.removeCapture(projectId, browsingCaptureId);
    if (!r.ok) { setStatus(deps.status, r.error.message, "error"); return; }
    const activeId = await getActiveCaptureId(deps.storage, projectId);
    if (activeId === browsingCaptureId) await setActiveCaptureId(deps.storage, projectId, null);
    browsingCaptureId = null;
    await refresh();
    await deps.afterMutate();
    setStatus(deps.status, "✓ Deleted.", "success");
  });

  deps.pasteBtn.addEventListener("click", async () => {
    const projectId = deps.getProjectId();
    if (!projectId || !browsingCaptureId) return;
    const project = await deps.projects.get(projectId);
    if (!project) return;
    const target = deps.getTargetProvider();
    deps.pasteBtn.disabled = true;
    setStatus(deps.status, "Preparing handoff for this capture…");
    try {
      const r = deps.continuity.render(deps.getMode(), {
        projectName: project.name,
        projectDescription: project.description,
        passport: project.passport,
        intelligence: project.intelligence,
        memory: project.memory,
        captureId: browsingCaptureId,
        ...(target ? { targetProviderId: target } : {}),
      });
      if (!r.ok) throw new Error(r.error.message);
      await deps.inject(r.value.text);
      setStatus(deps.status, `✓ Pasted ${r.value.stats.chars} chars from this capture. Review, then Send.`, "success");
    } catch (e) {
      setStatus(deps.status, friendlyError(e), "error");
    } finally {
      deps.pasteBtn.disabled = false;
    }
  });

  return { refresh };
}
