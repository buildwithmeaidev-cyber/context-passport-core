import type { ProviderAdapter } from "./ProviderAdapter";
import { ChatGPTAdapter } from "./chatgpt/ChatGPTAdapter";
import { ClaudeAdapter } from "./claude/ClaudeAdapter";
import { GeminiAdapter } from "./gemini/GeminiAdapter";
import { PerplexityAdapter } from "./perplexity/PerplexityAdapter";
import { SafeProviderAdapter } from "./SafeProviderAdapter";
import { ConsoleLogger, type Logger } from "@/core/logger";

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

/**
 * Every adapter is wrapped in SafeProviderAdapter — if one provider's DOM
 * shifts or throws, only that adapter trips. The rest keep working.
 */
export function createDefaultRegistry(
  logger: Logger = new ConsoleLogger("providers"),
): ProviderRegistry {
  const raw: ProviderAdapter[] = [
    new ChatGPTAdapter(),
    new ClaudeAdapter(),
    new GeminiAdapter(),
    new PerplexityAdapter(),
  ];
  return new ProviderRegistry(raw.map((a) => new SafeProviderAdapter(a, logger)));
}
