import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";
import { CaptureService } from "@/services/capture/CaptureService";
import { InjectionService } from "@/services/injection/InjectionService";
import type { RuntimeMessage, RuntimeResponse } from "@/shared/messaging";

(async () => {
  const container = await buildContainer("content");
  const logger = container.resolve(Tokens.Logger);
  const registry = container.resolve(Tokens.ProviderRegistry);
  const projects = container.resolve(Tokens.Projects);
  const flags = container.resolve(Tokens.Flags);

  const capture = new CaptureService(registry, projects, flags);
  const injection = new InjectionService(registry, flags);

  const adapter = registry.resolveByUrl(location.href);
  logger.info(`content loaded; adapter=${adapter?.id ?? "none"}`);

  chrome.runtime.onMessage.addListener((msg: RuntimeMessage, _sender, sendResponse) => {
    const reply = (r: RuntimeResponse) => sendResponse(r);
    (async () => {
      try {
        switch (msg.type) {
          case "DETECT_ACTIVE_PROVIDER":
            return reply({ ok: true, data: { providerId: adapter?.id ?? null } });
          case "CAPTURE_ACTIVE_TAB": {
            const r = await capture.captureInto(msg.projectId, location.href);
            if (!r.ok) return reply({ ok: false, error: `${r.error.code}: ${r.error.message}` });
            return reply({ ok: true, data: { conversation: r.value } });
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
