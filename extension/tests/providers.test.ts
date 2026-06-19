import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "@/providers/registry";

describe("ProviderRegistry contract", () => {
  const registry = createDefaultRegistry();

  it.each([
    ["https://chatgpt.com/c/abc", "chatgpt"],
    ["https://chat.openai.com/c/abc", "chatgpt"],
    ["https://claude.ai/chat/abc", "claude"],
    ["https://gemini.google.com/app", "gemini"],
    ["https://www.perplexity.ai/search/abc", "perplexity"],
    ["https://example.com/", undefined],
  ])("resolves %s -> %s", (url, expected) => {
    const a = registry.resolveByUrl(url);
    expect(a?.id).toBe(expected);
  });

  it("every adapter implements the full contract surface", () => {
    for (const a of registry.all()) {
      expect(typeof a.id).toBe("string");
      expect(typeof a.label).toBe("string");
      expect(a.hosts.length).toBeGreaterThan(0);
      expect(typeof a.matches).toBe("function");
      expect(typeof a.detect).toBe("function");
      expect(typeof a.extractConversation).toBe("function");
      expect(typeof a.injectPrompt).toBe("function");
      expect(a.capabilities.capture).toBe(true);
      expect(a.capabilities.inject).toBe(true);
    }
  });
});
