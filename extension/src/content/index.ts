import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";
import { CaptureService } from "@/services/capture/CaptureService";
import { InjectionService } from "@/services/injection/InjectionService";
import type { RuntimeMessage, RuntimeResponse } from "@/shared/messaging";
import type { ProjectService } from "@/services/project/ProjectService";
import type { StorageGateway } from "@/storage/StorageGateway";
import type { ContinuityService } from "@/services/continuity/ContinuityService";

(async () => {
  if ((window as Window & { __contextPassportLoaded?: boolean }).__contextPassportLoaded) return;
  (window as Window & { __contextPassportLoaded?: boolean }).__contextPassportLoaded = true;

  const container = await buildContainer("content");
  const logger = container.resolve(Tokens.Logger);
  const registry = container.resolve(Tokens.ProviderRegistry);
  const projects = container.resolve(Tokens.Projects);
  const flags = container.resolve(Tokens.Flags);
  const storage = container.resolve(Tokens.Storage);
  const continuity = container.resolve(Tokens.Continuity);

  const capture = new CaptureService(registry, projects, flags);
  const injection = new InjectionService(registry, flags);

  const adapter = registry.resolveByUrl(location.href);
  logger.info(`content loaded; adapter=${adapter?.id ?? "none"}`);
  if (adapter) mountQuickWidget({ adapterId: adapter.id, capture, injection, projects, storage, continuity });

  chrome.runtime.onMessage.addListener((msg: RuntimeMessage, _sender, sendResponse) => {
    const reply = (r: RuntimeResponse) => sendResponse(r);
    (async () => {
      try {
        switch (msg.type) {
          case "DETECT_ACTIVE_PROVIDER":
            return reply({ ok: true, data: { providerId: adapter?.id ?? null } });
          case "CAPTURE_ACTIVE_TAB": {
            const opts = msg.options ?? { mode: "since-last" as const, lastN: 20 };
            const r = await capture.captureInto(msg.projectId, location.href, opts);
            if (!r.ok) return reply({ ok: false, error: `${r.error.code}: ${r.error.message}` });
            return reply({ ok: true, data: { conversation: r.value } });
          }
          case "PREVIEW_CAPTURE_ACTIVE_TAB": {
            const r = await capture.preview(msg.projectId, location.href, msg.options);
            if (!r.ok) return reply({ ok: false, error: `${r.error.code}: ${r.error.message}` });
            return reply({ ok: true, data: r.value });
          }
          case "INJECT_INTO_ACTIVE_TAB": {
            const r = injection.inject(location.href, msg.text);
            if (!r.ok) return reply({ ok: false, error: `${r.error.code}: ${r.error.message}` });
            return reply({ ok: true, data: null });
          }
        }
      } catch (e) {
        reply({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    })();
    return true;
  });
})();

interface QuickWidgetDeps {
  adapterId: string;
  capture: CaptureService;
  injection: InjectionService;
  projects: ProjectService;
  storage: StorageGateway;
  continuity: ContinuityService;
}

function mountQuickWidget(deps: QuickWidgetDeps): void {
  if (document.getElementById("contextpassport-quick-widget")) return;

  const host = document.createElement("div");
  host.id = "contextpassport-quick-widget";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .cpq-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
      .cpq-panel { width: 260px; padding: 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 10px; background: rgba(18,18,22,.96); color: #f4f4f5; box-shadow: 0 18px 50px rgba(0,0,0,.38); backdrop-filter: blur(12px); }
      .cpq-panel[hidden] { display: none; }
      .cpq-title { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin: 0 0 8px; font: 700 12px/1.2 Inter, system-ui; }
      .cpq-pill { color: #34d399; border: 1px solid rgba(52,211,153,.32); background: rgba(52,211,153,.12); border-radius: 999px; padding: 2px 7px; font: 600 10px/1.2 Inter, system-ui; }
      .cpq-text { margin: 0 0 10px; color: #a1a1aa; font: 500 11px/1.45 Inter, system-ui; }
      .cpq-actions { display: grid; gap: 7px; }
      button { all: unset; box-sizing: border-box; cursor: pointer; text-align: center; border-radius: 7px; font: 700 12px/1 Inter, system-ui; }
      .cpq-primary { padding: 10px 12px; color: white; background: #6366f1; border: 1px solid rgba(255,255,255,.16); }
      .cpq-secondary { padding: 9px 12px; color: #e4e4e7; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); }
      .cpq-fab { width: 46px; height: 46px; display: grid; place-items: center; color: white; background: #6366f1; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; box-shadow: 0 12px 32px rgba(0,0,0,.36); font: 800 18px/1 Inter, system-ui; }
      .cpq-status { min-height: 16px; margin: 9px 0 0; color: #a1a1aa; font: 600 11px/1.45 Inter, system-ui; }
      .cpq-status[data-state="success"] { color: #34d399; }
      .cpq-status[data-state="error"] { color: #fb7185; }
    </style>
    <div class="cpq-wrap">
      <div class="cpq-panel" hidden>
        <div class="cpq-title"><span>ContextPassport</span><span class="cpq-pill">${escapeHtml(deps.adapterId)}</span></div>
        <p class="cpq-text">One click captures this conversation locally and can paste a handoff into this composer.</p>
        <div class="cpq-actions">
          <button class="cpq-primary" id="cpq-one">Capture & paste handoff</button>
          <button class="cpq-secondary" id="cpq-capture">Capture only</button>
        </div>
        <p class="cpq-status" id="cpq-status"></p>
      </div>
      <button class="cpq-fab" id="cpq-toggle" title="ContextPassport quick actions">↗</button>
    </div>
  `;
  document.documentElement.appendChild(host);

  const panel = shadow.querySelector<HTMLDivElement>(".cpq-panel")!;
  const status = shadow.getElementById("cpq-status") as HTMLParagraphElement;
  shadow.getElementById("cpq-toggle")?.addEventListener("click", () => { panel.hidden = !panel.hidden; });
  shadow.getElementById("cpq-capture")?.addEventListener("click", () => runQuickCapture(deps, status));
  shadow.getElementById("cpq-one")?.addEventListener("click", () => runQuickCaptureAndPaste(deps, status));
}

async function runQuickCapture(deps: QuickWidgetDeps, status: HTMLParagraphElement): Promise<void> {
  await withStatus(status, "Capturing locally…", async () => {
    const projectId = await ensureActiveProject(deps.projects, deps.storage);
    const r = await deps.capture.captureInto(projectId, location.href);
    if (!r.ok) throw new Error(r.error.message);
    return `Captured ${r.value.turns.length} turn${r.value.turns.length === 1 ? "" : "s"}. Saved locally.`;
  });
}

async function runQuickCaptureAndPaste(deps: QuickWidgetDeps, status: HTMLParagraphElement): Promise<void> {
  await withStatus(status, "Capturing and preparing handoff…", async () => {
    const projectId = await ensureActiveProject(deps.projects, deps.storage);
    const captured = await deps.capture.captureInto(projectId, location.href);
    if (!captured.ok) throw new Error(captured.error.message);
    const project = await deps.projects.get(projectId);
    if (!project) throw new Error("Project not found after capture.");
    const rendered = deps.continuity.render("balanced", {
      projectName: project.name,
      projectDescription: project.description,
      passport: project.passport,
      intelligence: project.intelligence,
      memory: project.memory,
      targetProviderId: deps.adapterId,
    });
    if (!rendered.ok) throw new Error(rendered.error.message);
    const pasted = deps.injection.inject(location.href, rendered.value.text);
    if (!pasted.ok) throw new Error(pasted.error.message);
    return `Captured ${captured.value.turns.length} turns and pasted ${rendered.value.stats.chars} chars.`;
  });
}

async function ensureActiveProject(projects: ProjectService, storage: StorageGateway): Promise<string> {
  const settings = await storage.read("settings:user");
  const current = settings.ok ? settings.value : null;
  const list = await projects.list();
  const existing = current?.activeProjectId ? list.find((p) => p.id === current.activeProjectId) : list[0];
  if (existing) return existing.id;

  const created = await projects.create("My first project");
  if (!created.ok) throw new Error(created.error.message);
  await storage.write("settings:user", {
    activeProjectId: created.value.id,
    defaultRenderMode: current?.defaultRenderMode ?? "balanced",
    theme: current?.theme ?? "system",
    onboardingSeenAt: current?.onboardingSeenAt ?? null,
  });
  return created.value.id;
}

async function withStatus(status: HTMLParagraphElement, pending: string, action: () => Promise<string>): Promise<void> {
  status.dataset.state = "";
  status.textContent = pending;
  try {
    const message = await action();
    status.dataset.state = "success";
    status.textContent = `✓ ${message}`;
  } catch (e) {
    status.dataset.state = "error";
    status.textContent = e instanceof Error ? e.message : String(e);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
