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

  /**
   * Diagnostics from the most recent extractConversation() call: which
   * selectors matched, which fell back, which fields were missing. Optional so
   * third-party adapters stay valid without implementing it.
   */
  getDiagnostics?(): AdapterDiagnostics | null;



  readonly capabilities: {
    capture: boolean;
    inject: boolean;
  };
}

export type ExtractedFor = Pick<CapturedConversation, "providerId" | "url" | "title" | "turns" | "capturedAt">;
