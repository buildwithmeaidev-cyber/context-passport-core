import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";

(async () => {
  const container = await buildContainer("options");
  const license = container.resolve(Tokens.License);
  const registry = container.resolve(Tokens.ProviderRegistry);
  const flags = container.resolve(Tokens.Flags);
  const vault = container.resolve(Tokens.Vault);
  const storage = container.resolve(Tokens.Storage);

  const plan = license.plan();
  (document.getElementById("cp-plan") as HTMLElement).textContent =
    `${plan.label} · $${plan.monthlyPriceUsd}/mo · vault limit ${plan.limits.vaultMaxItems || "unlimited"}`;

  const list = document.getElementById("cp-providers") as HTMLUListElement;
  list.innerHTML = "";
  for (const adapter of registry.all()) {
    const li = document.createElement("li");
    const enabled = flags.isEnabled(`providers.${adapter.id}.enabled`);
    li.innerHTML = `
      <label>
        <input type="checkbox" data-provider="${adapter.id}" ${enabled ? "checked" : ""}/>
        ${adapter.label} <span class="cp-muted">(${adapter.hosts.join(", ")})</span>
      </label>`;
    list.appendChild(li);
  }
  list.addEventListener("change", async (e) => {
    const t = e.target as HTMLInputElement;
    const id = t.dataset.provider;
    if (!id) return;
    await flags.set(`providers.${id}.enabled`, t.checked);
  });

  const items = await vault.list();
  (document.getElementById("cp-vault-count") as HTMLElement).textContent = `${items.length} saved conversation${items.length === 1 ? "" : "s"}.`;

  document.getElementById("cp-vault-clear")?.addEventListener("click", async () => {
    if (!confirm("Clear all saved conversations? This cannot be undone.")) return;
    await storage.remove("vault:conversations");
    location.reload();
  });
})();
