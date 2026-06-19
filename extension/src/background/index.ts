import { buildContainer } from "@/core/composition";
import { Tokens } from "@/core/tokens";
import { CURRENT_VERSION } from "@/storage/schema";

// Background service worker — owns long-lived state, runs migrations, and is
// the only place that triggers update-time work.

chrome.runtime.onInstalled.addListener(async (details) => {
  const container = await buildContainer("background");
  const logger = container.resolve(Tokens.Logger);
  const storage = container.resolve(Tokens.Storage);
  logger.info(`onInstalled: ${details.reason}`);

  // Ensure schema version is recorded. StorageGateway handles per-key migration
  // on read; this entry is the human-readable global marker.
  const v = await storage.read("meta:schemaVersion");
  if (!v.ok || !v.value) {
    await storage.write("meta:schemaVersion", { version: CURRENT_VERSION });
  } else if (v.value.version !== CURRENT_VERSION) {
    logger.info(`Storage version changing ${v.value.version} -> ${CURRENT_VERSION}`);
    await storage.write("meta:schemaVersion", { version: CURRENT_VERSION });
  }
});

// Open options page from the action menu (right-click on extension icon
// gives "Options" by default; this is a convenience for keyboard users).
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true, data: null });
    return true;
  }
  return false;
});
