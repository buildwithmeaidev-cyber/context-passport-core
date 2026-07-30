import type { CapturedConversation, ConversationTurn } from "@/core/tokens";
import type { Result } from "@/core/result";
import type { AdapterDiagnostics } from "@/services/capture/AdapterDiagnostics";


/**
 * ProviderAdapter — stable contract for AI-site adapters.
 *
 * Adding a provider:
 *   1. Create src/providers/<id>/<Id>Adapter.ts implementing this interface.
 *   2. Register it in src/providers/registry.ts.
 *   3. Add the host to manifest.json content_scripts + host_permissions.
 *
 * Nothing else in the codebase should change.
 */
export interface ProviderAdapter {
  readonly id: string;
  readonly label: string;
  readonly hosts: readonly string[];

  matches(url: string): boolean;

  /** Lightweight check that the page is ready (composer present, etc). */
  detect(): boolean;

  /** Extract the visible conversation from the DOM. */
  extractConversation(): Result<{ title: string; turns: ConversationTurn[] }>;

  /** Place text into the page's composer/input. Does not submit. */
  injectPrompt(text: string): Result<true>;

  readonly capabilities: {
    capture: boolean;
    inject: boolean;
  };
}

export type ExtractedFor = Pick<CapturedConversation, "providerId" | "url" | "title" | "turns" | "capturedAt">;
