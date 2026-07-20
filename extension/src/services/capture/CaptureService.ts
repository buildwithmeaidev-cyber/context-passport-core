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
