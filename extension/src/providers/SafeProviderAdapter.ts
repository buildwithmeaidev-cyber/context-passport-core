import type { ProviderAdapter } from "./ProviderAdapter";
import type { ConversationTurn } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";
import type { Logger } from "@/core/logger";

/**
 * SafeProviderAdapter — provider isolation boundary.
 *
 * Wraps a ProviderAdapter so a thrown exception, selector drift, or DOM
 * mutation in ONE provider cannot break the rest of the extension.
 *
 *  - Every call is wrapped in try/catch and converted to a Result.
 *  - After N consecutive failures the adapter is "tripped" — capture/inject
 *    return FEATURE_DISABLED until the trip is cleared (e.g. on next load).
 *    The adapter still appears in the registry so the UI can render a
 *    "degraded" state for it instead of silently disappearing.
 *  - matches() / detect() never throw — failure means "no, this isn't me".
 *
 * The receiving UI shows graceful degradation rather than a crash.
 */
export class SafeProviderAdapter implements ProviderAdapter {
  readonly id: string;
  readonly label: string;
  readonly hosts: readonly string[];
  readonly capabilities: ProviderAdapter["capabilities"];

  private failures = 0;
  private tripped = false;

  constructor(
    private readonly inner: ProviderAdapter,
    private readonly logger: Logger,
    private readonly tripThreshold = 3,
  ) {
    this.id = inner.id;
    this.label = inner.label;
    this.hosts = inner.hosts;
    this.capabilities = inner.capabilities;
  }

  isTripped(): boolean {
    return this.tripped;
  }

  resetTrip(): void {
    this.tripped = false;
    this.failures = 0;
  }

  matches(url: string): boolean {
    try {
      return this.inner.matches(url);
    } catch (e) {
      this.logger.warn(`[provider:${this.id}] matches() threw`, e);
      return false;
    }
  }

  detect(): boolean {
    try {
      return this.inner.detect();
    } catch (e) {
      this.logger.warn(`[provider:${this.id}] detect() threw`, e);
      return false;
    }
  }

  extractConversation(): Result<{ title: string; turns: ConversationTurn[] }> {
    if (this.tripped) {
      return err(appError("FEATURE_DISABLED", `Provider ${this.id} disabled after repeated failures`));
    }
    try {
      const r = this.inner.extractConversation();
      this.recordOutcome(r.ok);
      return r;
    } catch (e) {
      this.recordOutcome(false);
      this.logger.error(`[provider:${this.id}] extractConversation threw`, e);
      return err(appError("ADAPTER_FAILED", `Capture failed in ${this.id}`, e));
    }
  }

  injectPrompt(text: string): Result<true> {
    if (this.tripped) {
      return err(appError("FEATURE_DISABLED", `Provider ${this.id} disabled after repeated failures`));
    }
    try {
      const r = this.inner.injectPrompt(text);
      this.recordOutcome(r.ok);
      return r;
    } catch (e) {
      this.recordOutcome(false);
      this.logger.error(`[provider:${this.id}] injectPrompt threw`, e);
      return err(appError("ADAPTER_FAILED", `Inject failed in ${this.id}`, e));
    }
  }

  private recordOutcome(success: boolean): void {
    if (success) {
      this.failures = 0;
      return;
    }
    this.failures += 1;
    if (this.failures >= this.tripThreshold) {
      this.tripped = true;
      this.logger.warn(`[provider:${this.id}] tripped after ${this.failures} failures — provider isolated`);
    }
  }
}

void ok;
