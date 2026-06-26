import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";
import { FACET_LABELS, FACET_TO_FIELD, type FacetKind } from "@/core/passport";
import type { Project } from "@/storage/schema";

(async () => {
  const container = await buildContainer("options");
  const license = container.resolve(Tokens.License);
  const registry = container.resolve(Tokens.ProviderRegistry);
  const flags = container.resolve(Tokens.Flags);
  const projects = container.resolve(Tokens.Projects);
  const storage = container.resolve(Tokens.Storage);

  wirePrivacySection();

  const plan = license.plan();
  (document.getElementById("cp-plan") as HTMLElement).textContent =
    `${plan.label} · $${plan.monthlyPriceUsd}/mo · projects ${plan.limits.projectsMax || "unlimited"}`;

  function wirePrivacySection(): void {
    const togStore = document.getElementById("cp-opt-tog-storage") as HTMLInputElement;
    const togInject = document.getElementById("cp-opt-tog-inject") as HTMLInputElement;
    const dotStore = document.getElementById("cp-opt-dot-store") as HTMLSpanElement;
    const dotInject = document.getElementById("cp-opt-dot-inject") as HTMLSpanElement;
    const erase = document.getElementById("cp-erase-all") as HTMLButtonElement;
    const eraseStatus = document.getElementById("cp-erase-status") as HTMLParagraphElement;
    const sync = () => {
      const s = flags.isEnabled("privacy.allowLocalStorage");
      const i = flags.isEnabled("privacy.allowInjection");
      togStore.checked = s;
      togInject.checked = i;
      dotStore.dataset.state = s ? "on" : "off";
      dotInject.dataset.state = i ? "on" : "off";
    };
    sync();
    togStore.addEventListener("change", async () => { await flags.set("privacy.allowLocalStorage", togStore.checked); sync(); });
    togInject.addEventListener("change", async () => { await flags.set("privacy.allowInjection", togInject.checked); sync(); });
    erase.addEventListener("click", async () => {
      if (!confirm("Erase ALL ContextPassport data on this device? This cannot be undone.")) return;
      await storage.remove("projects");
      await storage.remove("settings:user");
      await storage.remove("flags:overrides");
      eraseStatus.textContent = "All local data erased. Reload the extension to reset state.";
      eraseStatus.dataset.state = "success";
    });
  }

  let activeId: string | null = null;
  await renderAll();

  async function renderAll() {
    const list = await projects.list();
    if (!activeId && list[0]) activeId = list[0].id;

    // Projects list
    const ul = document.getElementById("cp-projects") as HTMLUListElement;
    ul.innerHTML = list.map((p) => `
      <li>
        <button class="cp-link" data-project="${p.id}">${escapeHtml(p.name)}</button>
        <span class="cp-muted">· ${p.captures.length} captures · updated ${new Date(p.updatedAt).toLocaleString()}</span>
        <button class="cp-btn cp-btn-sm" data-delete="${p.id}">delete</button>
      </li>
    `).join("");
    ul.querySelectorAll<HTMLButtonElement>("[data-project]").forEach((b) => {
      b.addEventListener("click", () => { activeId = b.dataset.project!; renderAll(); });
    });
    ul.querySelectorAll<HTMLButtonElement>("[data-delete]").forEach((b) => {
      b.addEventListener("click", async () => {
        if (!confirm("Delete this project and its passport?")) return;
        await projects.remove(b.dataset.delete!);
        if (activeId === b.dataset.delete) activeId = null;
        renderAll();
      });
    });

    // Passport viewer
    const project = list.find((p) => p.id === activeId);
    (document.getElementById("cp-passport-heading") as HTMLElement).textContent =
      project ? `Passport · ${project.name}` : "Passport";
    const root = document.getElementById("cp-passport") as HTMLDivElement;
    root.innerHTML = project ? renderPassport(project) : `<p class="cp-muted">No project selected.</p>`;
    if (project) wirePassportActions(root, project);

    // Providers
    const provList = document.getElementById("cp-providers") as HTMLUListElement;
    provList.innerHTML = registry.all().map((a) => `
      <li><label>
        <input type="checkbox" data-provider="${a.id}" ${flags.isEnabled(`providers.${a.id}.enabled`) ? "checked" : ""}/>
        ${a.label} <span class="cp-muted">(${a.hosts.join(", ")})</span>
      </label></li>`).join("");
    provList.addEventListener("change", async (e) => {
      const t = e.target as HTMLInputElement;
      if (!t.dataset.provider) return;
      await flags.set(`providers.${t.dataset.provider}.enabled`, t.checked);
    }, { once: true });
  }

  function renderPassport(p: Project): string {
    const kinds = Object.keys(FACET_TO_FIELD) as FacetKind[];
    return kinds.map((kind) => {
      const items = p.passport[FACET_TO_FIELD[kind]].filter((i) => !i.dismissed);
      const body = items.length === 0
        ? `<p class="cp-muted">No items yet.</p>`
        : `<ul class="cp-facet-list">${items.map((i) => `
            <li class="${i.pinned ? "cp-pinned" : ""}">
              <span>${escapeHtml(i.text)}</span>
              <span class="cp-actions">
                <button data-pin="${i.id}" data-pin-val="${!i.pinned}">${i.pinned ? "unpin" : "pin"}</button>
                <button data-dismiss="${i.id}">dismiss</button>
                <span class="cp-muted">conf ${Math.round(i.confidence * 100)}%</span>
              </span>
            </li>`).join("")}</ul>`;
      return `<section class="cp-facet"><h3>${FACET_LABELS[kind]}</h3>${body}</section>`;
    }).join("");
  }

  function wirePassportActions(root: HTMLElement, project: Project) {
    root.querySelectorAll<HTMLButtonElement>("[data-pin]").forEach((b) => {
      b.addEventListener("click", async () => {
        await projects.pinFacet(project.id, b.dataset.pin!, b.dataset.pinVal === "true");
        renderAll();
      });
    });
    root.querySelectorAll<HTMLButtonElement>("[data-dismiss]").forEach((b) => {
      b.addEventListener("click", async () => {
        await projects.dismissFacet(project.id, b.dataset.dismiss!);
        renderAll();
      });
    });
  }

  function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  }
})();
