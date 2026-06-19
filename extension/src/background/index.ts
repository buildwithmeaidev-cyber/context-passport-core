import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";
import { CURRENT_VERSION, legacyConversationSchema, type LegacyConversation } from "@/storage/schema";
import { importLegacyConversations } from "@/storage/migrations";

// Background service worker. Owns install/update hooks. Performs the one-shot
// import of v1 conversations into the new v2 projects model.

chrome.runtime.onInstalled.addListener(async (details) => {
  const container = await buildContainer("background");
  const logger = container.resolve(Tokens.Logger);
  const storage = container.resolve(Tokens.Storage);
  logger.info(`onInstalled: ${details.reason}`);

  // One-shot legacy import: read raw vault:conversations (if present from v1)
  // and seed a "Legacy import" project. Idempotent: we only run if `projects`
  // is empty.
  try {
    const raw = await chrome.storage.local.get(["vault:conversations", "projects"]);
    const currentProjects = (raw["projects"] as { data?: unknown } | undefined)?.data;
    const legacyWrapper = raw["vault:conversations"] as { data?: unknown } | undefined;
    if (
      (!Array.isArray(currentProjects) || currentProjects.length === 0) &&
      legacyWrapper?.data && Array.isArray(legacyWrapper.data)
    ) {
      const parsed = legacyWrapper.data
        .map((c: unknown) => legacyConversationSchema.safeParse(c))
        .filter((r): r is { success: true; data: LegacyConversation } => r.success)
        .map((r) => r.data);
      if (parsed.length > 0) {
        const seed = importLegacyConversations(parsed, Date.now());
        await storage.write("projects", seed as never);
        logger.info(`Imported ${parsed.length} legacy conversation(s) into a project.`);
      }
    }
  } catch (e) {
    logger.error("Legacy import failed", e);
  }

  const v = await storage.read("meta:schemaVersion");
  if (!v.ok || !v.value || v.value.version !== CURRENT_VERSION) {
    await storage.write("meta:schemaVersion", { version: CURRENT_VERSION });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true, data: null });
    return true;
  }
  return false;
});
