import type { ProviderRegistry } from "@/providers/registry";
import type { ProjectService } from "@/services/project/ProjectService";
import type { FeatureFlagService } from "@/services/license/FeatureFlagService";
import type { CapturedConversation, ConversationTurn } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";
import { hashTurn } from "@/core/hashTurn";
import { buildThreadKey, buildThreadTitle, deriveTopic } from "@/core/threadKey";
import type { CaptureMode, CaptureOptions, PreviewResult } from "@/shared/messaging";
import { CaptureIntegrityService } from "./CaptureIntegrityService";

const DEFAULT_OPTIONS: CaptureOptions = { mode: "since-last", lastN: 20 };

export class CaptureService {
  private readonly integrity = new CaptureIntegrityService();
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly projects: ProjectService,
    private readonly flags: FeatureFlagService,
  ) {}

  /** Pure extraction (no persistence) — used by the pre-capture preview. */
  capture(url: string): Result<CapturedConversation> {
    const adapter = this.registry.resolveByUrl(url);
    if (!adapter) return err(appError("ADAPTER_NOT_FOUND", `No adapter for ${url}`));
    if (!this.flags.isEnabled(`providers.${adapter.id}.enabled`)) {
      return err(appError("FEATURE_DISABLED", `Provider ${adapter.id} is disabled.`));
    }
    const extracted = adapter.extractConversation();
    if (!extracted.ok) return err(extracted.error);
    const now = Date.now();
    const turns = extracted.value.turns;
    const topic = deriveTopic(turns, extracted.value.title || adapter.label);
    return ok({
      providerId: adapter.id,
      url,
      title: buildCaptureTitle(adapter.label, topic, now),
      turns,
      capturedAt: now,
      threadKey: buildThreadKey(adapter.id, url),
      threadTitle: buildThreadTitle(adapter.label, topic),
    });
  }

  /** Diagnostics from the adapter that just ran, if it reports any. */
  private diagnosticsFor(url: string) {
    const adapter = this.registry.resolveByUrl(url);
    return adapter?.getDiagnostics?.() ?? null;
  }

  /** Dry-run: return what a capture *would* store under the given options. */
  async preview(projectId: string, url: string, options: CaptureOptions = DEFAULT_OPTIONS): Promise<Result<PreviewResult>> {
    const c = this.capture(url);
    if (!c.ok) return err(c.error);
    const threadKey = c.value.threadKey ?? "";
    const seen = await this.collectSeenHashes(projectId, threadKey);
    const scoped = applyCaptureMode(c.value.turns, options, seen);
    const kept = scoped.filtered;
    const integrity = this.integrity.validate(c.value.turns, c.value.title, this.diagnosticsFor(url));
    const project = await this.projects.get(projectId);
    const threadExists = !!project?.captures.some((x) => x.threadKey === threadKey);
    return ok({
      providerId: c.value.providerId,
      extractedTurns: c.value.turns.length,
      freshTurns: scoped.freshCount,
      droppedDuplicates: c.value.turns.length - scoped.freshCount,
      willCapture: kept.length,
      sampleFirst: kept[0] ? { role: kept[0].role, text: truncate(kept[0].text, 240) } : null,
      sampleLast: kept.length > 1 ? { role: kept[kept.length - 1]!.role, text: truncate(kept[kept.length - 1]!.text, 240) } : null,
      integrity: {
        level: integrity.level,
        issues: integrity.issues,
        diagnostics: integrity.diagnostics
          ? {
              providerId: integrity.diagnostics.providerId,
              adapterLabel: integrity.diagnostics.adapterLabel,
              url: integrity.diagnostics.url,
              selectorsTried: integrity.diagnostics.selectorsTried,
              missingFields: integrity.diagnostics.missingFields,
              explanation: integrity.diagnostics.explanation,
            }
          : undefined,
      },
      threadKey,
      threadTitle: c.value.threadTitle,
      threadExists,
    });
  }

  async captureInto(projectId: string, url: string, options: CaptureOptions = DEFAULT_OPTIONS): Promise<Result<CapturedConversation>> {
    const c = this.capture(url);
    if (!c.ok) return c;
    const seen = await this.collectSeenHashes(projectId, c.value.threadKey ?? "");
    const scoped = applyCaptureMode(c.value.turns, options, seen);
    if (scoped.filtered.length === 0) {
      return err(appError("VALIDATION", "Nothing new to capture — this conversation was already captured. Switch to Full mode to force a re-capture."));
    }
    const finalConv: CapturedConversation = { ...c.value, turns: scoped.filtered };
    const ingest = await this.projects.ingestCapture(projectId, finalConv);
    if (!ingest.ok) return err(ingest.error);
    return ok(finalConv);
  }

  /**
   * Hashes already stored for this *thread*. Scoping by thread is deliberate:
   * two different conversations may legitimately contain the same sentence, and
   * project-wide dedup used to silently swallow those turns — which is what made
   * captures look thin and mixed.
   */
  private async collectSeenHashes(projectId: string, threadKey: string): Promise<Set<string>> {
    const project = await this.projects.get(projectId);
    const set = new Set<string>();
    if (!project) return set;
    for (const cap of project.captures) {
      if (threadKey && cap.threadKey && cap.threadKey !== threadKey) continue;
      if (cap.turnHashes?.length) {
        for (const h of cap.turnHashes) set.add(h);
      } else {
        for (const t of cap.turns) set.add(hashTurn(t.role, t.text));
      }
    }
    return set;
  }
}


interface Scoped { filtered: ConversationTurn[]; freshCount: number }

/** Apply mode-specific filtering. Returns the turns that will actually be stored. */
export function applyCaptureMode(turns: readonly ConversationTurn[], options: CaptureOptions, seen: Set<string>): Scoped {
  const mode: CaptureMode = options.mode;
  const scoped = mode === "last-n" ? turns.slice(-Math.max(1, options.lastN)) : turns.slice();

  const local = new Set<string>();
  const fresh: ConversationTurn[] = [];
  for (const t of scoped) {
    const h = hashTurn(t.role, t.text);
    if (local.has(h)) continue;
    local.add(h);
    if (seen.has(h)) continue;
    fresh.push(t);
  }

  if (mode === "full") {
    // "Full" keeps all extracted (deduped within the capture only), regardless of prior captures.
    const localOnly: ConversationTurn[] = [];
    const seenLocal = new Set<string>();
    for (const t of scoped) {
      const h = hashTurn(t.role, t.text);
      if (seenLocal.has(h)) continue;
      seenLocal.add(h);
      localOnly.push(t);
    }
    return { filtered: localOnly, freshCount: fresh.length };
  }
  return { filtered: fresh, freshCount: fresh.length };
}

function buildCaptureTitle(providerLabel: string, topic: string, at: number): string {
  const when = new Date(at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${providerLabel} · ${when} · ${summarize(topic, 60)}`;
}


function summarize(text: string, max: number): string {
  const one = text.replace(/\s+/g, " ").trim();
  if (one.length <= max) return one;
  return one.slice(0, max - 1).trimEnd() + "…";
}

function truncate(s: string, max: number): string {
  const one = s.replace(/\s+/g, " ").trim();
  return one.length <= max ? one : one.slice(0, max - 1).trimEnd() + "…";
}
