// Feature slice: project picker + creator. NO business logic — orchestrates
// ProjectService and a Storage settings write for the active project.

import type { ProjectService } from "@/services/project/ProjectService";
import type { StorageGateway } from "@/storage/StorageGateway";
import { passportItemCount } from "@/services/continuity/strategies/_shared";

export interface ProjectPickerDeps {
  select: HTMLSelectElement;
  newButton: HTMLButtonElement;
  stats: HTMLParagraphElement;
  projects: ProjectService;
  storage: StorageGateway;
}

export interface ProjectPickerHandle {
  activeProjectId(): string | null;
  refresh(): Promise<void>;
}

export async function renderProjectPicker(deps: ProjectPickerDeps): Promise<ProjectPickerHandle> {
  const settings = await deps.storage.read("settings:user");
  let activeId: string | null = settings.ok && settings.value ? settings.value.activeProjectId : null;

  async function refresh(): Promise<void> {
    let list = await deps.projects.list();
    if (list.length === 0) {
      const created = await deps.projects.create("My first project");
      if (created.ok) list = [created.value];
    }
    if (!activeId || !list.find((p) => p.id === activeId)) {
      activeId = list[0]?.id ?? null;
    }
    deps.select.innerHTML = list
      .map((p) => `<option value="${p.id}" ${p.id === activeId ? "selected" : ""}>${escapeHtml(p.name)}</option>`)
      .join("");
    renderStats(list.find((p) => p.id === activeId));
  }

  function renderStats(p: { passport: Parameters<typeof passportItemCount>[0]; captures: { length: number } } | undefined) {
    if (!p) {
      deps.stats.textContent = "No project selected.";
      return;
    }
    const items = passportItemCount(p.passport);
    if (p.captures.length === 0) {
      deps.stats.textContent = "No captures yet. Open an AI chat (ChatGPT, Claude, Gemini, or Perplexity) and click Capture to save your first one — locally.";
      return;
    }
    deps.stats.textContent = `${items} passport item${items === 1 ? "" : "s"} · ${p.captures.length} capture${p.captures.length === 1 ? "" : "s"} · stored on this device.`;
  }

  deps.select.addEventListener("change", async () => {
    activeId = deps.select.value;
    await persist();
    const list = await deps.projects.list();
    renderStats(list.find((p) => p.id === activeId));
  });

  deps.newButton.addEventListener("click", async () => {
    const name = prompt("Project name:");
    if (!name) return;
    const r = await deps.projects.create(name);
    if (r.ok) {
      activeId = r.value.id;
      await persist();
      await refresh();
    }
  });

  async function persist(): Promise<void> {
    const cur = await deps.storage.read("settings:user");
    const base = cur.ok && cur.value
      ? cur.value
      : { activeProjectId: null, defaultRenderMode: "essential" as const, theme: "system" as const };
    await deps.storage.write("settings:user", { ...base, activeProjectId: activeId });
  }

  await refresh();
  return { activeProjectId: () => activeId, refresh };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
