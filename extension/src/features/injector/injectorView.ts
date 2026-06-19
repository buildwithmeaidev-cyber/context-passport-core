// Feature slice: injector view. Composes CompressionService + VaultService
// + messaging. UI-only; no business rules live here.

import type { CompressionService } from "@/services/compression/CompressionService";
import type { VaultService } from "@/services/vault/VaultService";

export interface InjectorViewDeps {
  modeSelect: HTMLSelectElement;
  sourceSelect: HTMLSelectElement;
  button: HTMLButtonElement;
  status: HTMLParagraphElement;
  vault: VaultService;
  compression: CompressionService;
  inject: (text: string) => Promise<unknown>;
}

export async function renderInjector(deps: InjectorViewDeps): Promise<void> {
  // Populate modes
  const modes = deps.compression.listForUi();
  deps.modeSelect.innerHTML = modes
    .map((m) => `<option value="${m.id}" ${m.available ? "" : "disabled"}>${m.label}${m.premium ? " (Pro)" : ""}</option>`)
    .join("");
  // Populate sources
  const items = await deps.vault.list();
  deps.sourceSelect.innerHTML = items
    .map((c) => `<option value="${c.id}">${escapeHtml(c.title)} · ${c.providerId}</option>`)
    .join("");

  deps.button.addEventListener("click", async () => {
    const sourceId = deps.sourceSelect.value;
    const modeId = deps.modeSelect.value;
    if (!sourceId || !modeId) {
      deps.status.textContent = "Pick a source and a mode.";
      return;
    }
    deps.button.disabled = true;
    deps.status.textContent = "Compressing…";
    try {
      const conv = await deps.vault.get(sourceId);
      if (!conv) throw new Error("Conversation not found");
      const result = deps.compression.run(modeId, { turns: conv.turns });
      if (!result.ok) throw new Error(result.error.message);
      deps.status.textContent = `Injecting ${result.value.text.length} chars (${(result.value.stats.ratio * 100).toFixed(0)}% of original)…`;
      await deps.inject(result.value.text);
      deps.status.textContent = "Injected. Edit, then press Send in the page.";
    } catch (e) {
      deps.status.textContent = `Failed: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      deps.button.disabled = false;
    }
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
