// Feature slice: injector view. Renders a project's passport via a chosen
// continuity strategy and injects it into the current tab's composer.

import type { ProjectService } from "@/services/project/ProjectService";
import type { ContinuityService } from "@/services/continuity/ContinuityService";

export interface InjectorViewDeps {
  modeSelect: HTMLSelectElement;
  modeDesc: HTMLParagraphElement;
  button: HTMLButtonElement;
  status: HTMLParagraphElement;
  projects: ProjectService;
  continuity: ContinuityService;
  getProjectId: () => string | null;
  getTargetProvider: () => string | null;
  inject: (text: string) => Promise<unknown>;
}

export async function renderInjector(deps: InjectorViewDeps): Promise<void> {
  const modes = deps.continuity.listForUi();
  deps.modeSelect.innerHTML = modes
    .map((m) => `<option value="${m.id}" ${m.available ? "" : "disabled"}>${m.label}${m.premium ? " (Pro)" : ""}</option>`)
    .join("");
  const updateDesc = () => {
    const m = modes.find((x) => x.id === deps.modeSelect.value);
    deps.modeDesc.textContent = m?.description ?? "";
  };
  deps.modeSelect.addEventListener("change", updateDesc);
  updateDesc();

  deps.button.addEventListener("click", async () => {
    const projectId = deps.getProjectId();
    if (!projectId) { deps.status.textContent = "Pick a project first."; return; }
    const project = await deps.projects.get(projectId);
    if (!project) { deps.status.textContent = "Project not found."; return; }
    const target = deps.getTargetProvider();
    deps.button.disabled = true;
    deps.status.textContent = "Preparing your summary…";
    try {
      const r = deps.continuity.render(deps.modeSelect.value, {
        projectName: project.name,
        projectDescription: project.description,
        passport: project.passport,
        intelligence: project.intelligence,
        memory: project.memory,
        ...(target ? { targetProviderId: target } : {}),
      });
      if (!r.ok) throw new Error(r.error.message);
      deps.status.textContent = `Pasting ${r.value.stats.chars} characters into the page…`;
      await deps.inject(r.value.text);
      deps.status.textContent = "✓ Context pasted. Review it, then press Send to continue.";
    } catch (e) {
      deps.status.textContent = `Couldn't paste: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      deps.button.disabled = false;
    }
  });
}
