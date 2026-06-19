import type { ProviderAdapter } from "./ProviderAdapter";
import { ChatGPTAdapter } from "./chatgpt/ChatGPTAdapter";
import { ClaudeAdapter } from "./claude/ClaudeAdapter";
import { GeminiAdapter } from "./gemini/GeminiAdapter";
import { PerplexityAdapter } from "./perplexity/PerplexityAdapter";

export class ProviderRegistry {
  private readonly adapters: readonly ProviderAdapter[];

  constructor(adapters: readonly ProviderAdapter[]) {
    this.adapters = adapters;
  }

  all(): readonly ProviderAdapter[] {
    return this.adapters;
  }

  byId(id: string): ProviderAdapter | undefined {
    return this.adapters.find((a) => a.id === id);
  }

  resolveByUrl(url: string): ProviderAdapter | undefined {
    return this.adapters.find((a) => a.matches(url));
  }
}

export function createDefaultRegistry(): ProviderRegistry {
  return new ProviderRegistry([
    new ChatGPTAdapter(),
    new ClaudeAdapter(),
    new GeminiAdapter(),
    new PerplexityAdapter(),
  ]);
}
