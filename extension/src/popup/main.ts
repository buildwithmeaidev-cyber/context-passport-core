// Popup entry — pure UI. No business logic; all logic delegated to services
// via the DI container or to the content script via runtime messaging.

import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";
import { sendToActiveTab, type DetectResult, type CaptureResult } from "@/shared/messaging";
import { renderCapture } from "@/features/capture/captureView";
import { renderInjector } from "@/features/injector/injectorView";

(async () => {
  const container = await buildContainer("popup");
  const vault = container.resolve(Tokens.Vault);
  const compression = container.resolve(Tokens.Compression);

  const providerBadge = document.getElementById("cp-provider") as HTMLSpanElement;
  try {
    const r = await sendToActiveTab<DetectResult>({ type: "DETECT_ACTIVE_PROVIDER" });
    providerBadge.textContent = r.providerId ?? "not on a supported site";
    providerBadge.dataset.state = r.providerId ? "active" : "idle";
  } catch {
    providerBadge.textContent = "not on a supported site";
    providerBadge.dataset.state = "idle";
  }

  renderCapture({
    button: document.getElementById("cp-capture") as HTMLButtonElement,
    status: document.getElementById("cp-capture-status") as HTMLParagraphElement,
    onCapture: async () => {
      const r = await sendToActiveTab<CaptureResult>({ type: "CAPTURE_ACTIVE_TAB" });
      return r.conversation;
    },
    refreshSources,
  });

  await renderInjector({
    modeSelect: document.getElementById("cp-mode") as HTMLSelectElement,
    sourceSelect: document.getElementById("cp-source") as HTMLSelectElement,
    button: document.getElementById("cp-inject") as HTMLButtonElement,
    status: document.getElementById("cp-inject-status") as HTMLParagraphElement,
    vault,
    compression,
    inject: (text) => sendToActiveTab<null>({ type: "INJECT_INTO_ACTIVE_TAB", text }),
  });

  async function refreshSources() {
    const select = document.getElementById("cp-source") as HTMLSelectElement;
    const list = await vault.list();
    select.innerHTML = list.map((c) => `<option value="${c.id}">${escapeHtml(c.title)} · ${c.providerId}</option>`).join("");
  }

  document.getElementById("cp-options")?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
})();

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
