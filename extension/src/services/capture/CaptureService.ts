import type { ProviderRegistry } from "@/providers/registry";
import type { ProjectService } from "@/services/project/ProjectService";
import type { FeatureFlagService } from "@/services/license/FeatureFlagService";
import type { CapturedConversation } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";

export class CaptureService {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly projects: ProjectService,
    private readonly flags: FeatureFlagService,
  ) {}

  capture(url: string): Result<CapturedConversation> {
    const adapter = this.registry.resolveByUrl(url);
    if (!adapter) return err(appError("ADAPTER_NOT_FOUND", `No adapter for ${url}`));
    if (!this.flags.isEnabled(`providers.${adapter.id}.enabled`)) {
      return err(appError("FEATURE_DISABLED", `Provider ${adapter.id} is disabled.`));
    }
    const extracted = adapter.extractConversation();
    if (!extracted.ok) return err(extracted.error);
    const now = Date.now();
    const smartTitle = buildCaptureTitle(adapter.label, extracted.value.turns, extracted.value.title, now);
    return ok({
      providerId: adapter.id,
      url,
      title: smartTitle,
      turns: extracted.value.turns,
      capturedAt: now,
    });
  }

  async captureInto(projectId: string, url: string): Promise<Result<CapturedConversation>> {
    const c = this.capture(url);
    if (!c.ok) return c;
    const ingest = await this.projects.ingestCapture(projectId, c.value);
    if (!ingest.ok) return err(ingest.error);
    return ok(c.value);
  }
}

/** Distinct capture name: "ChatGPT · Nov 20, 3:14 PM · <first user prompt excerpt>" */
function buildCaptureTitle(
  providerLabel: string,
  turns: readonly { role: string; text: string }[],
  fallback: string,
  at: number,
): string {
  const firstUser = turns.find((t) => t.role === "user")?.text?.trim();
  const firstAny = turns[0]?.text?.trim();
  const snippet = summarize(firstUser || firstAny || fallback || "conversation", 60);
  const when = new Date(at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${providerLabel} · ${when} · ${snippet}`;
}

function summarize(text: string, max: number): string {
  const one = text.replace(/\s+/g, " ").trim();
  if (one.length <= max) return one;
  return one.slice(0, max - 1).trimEnd() + "…";
}
