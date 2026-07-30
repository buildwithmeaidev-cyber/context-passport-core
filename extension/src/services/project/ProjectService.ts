import type { StorageGateway } from "@/storage/StorageGateway";
import type { Project, Capture, StoredFacetItem } from "@/storage/schema";
import type { ContextPassport, FacetItem, FacetKind } from "@/core/passport";
import { EMPTY_PASSPORT, FACET_TO_FIELD } from "@/core/passport";
import { extractFacets } from "@/core/extractFacets";
import type { CapturedConversation } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";
import type { IntelligenceService } from "@/services/intelligence/IntelligenceService";
import { hashTurn } from "@/core/hashTurn";
import { buildThreadKey, buildThreadTitle, deriveTopic } from "@/core/threadKey";
import { ThreadSummarizer } from "@/services/continuity/ThreadSummarizer";

const MAX_CAPTURES_PER_PROJECT = 50;


/**
 * ProjectService — CRUD for projects + the merge logic that turns captures
 * into passport facets, and runs the IntelligenceService over each capture
 * to maintain domain-specific insights.
 */
export class ProjectService {
  private readonly summarizer = new ThreadSummarizer();

  constructor(
    private readonly storage: StorageGateway,
    private readonly intelligence?: IntelligenceService,
    private readonly flags?: { isEnabled(flag: string): boolean },
  ) {}


  async list(): Promise<Project[]> {
    const r = await this.storage.read("projects");
    return r.ok && r.value ? r.value : [];
  }

  async get(id: string): Promise<Project | undefined> {
    return (await this.list()).find((p) => p.id === id);
  }

  async create(name: string, description = ""): Promise<Result<Project>> {
    const now = Date.now();
    const project: Project = {
      id: crypto.randomUUID(),
      name: name.trim() || "Untitled project",
      description,
      createdAt: now,
      updatedAt: now,
      passport: EMPTY_PASSPORT,
      captures: [],
      intelligence: {
        conversationType: "general",
        developer: { techStack: [], architecture: [], apis: [], dbDesign: [], bugs: [], todos: [] },
        research: { findings: [], sources: [], contradictions: [], openQuestions: [] },
        founder: { problem: [], market: [], revenueModel: [], validation: [], risks: [] },
        updatedAt: 0,
      },
      memory: [],
      lastCaptureUndo: null,
    };
    const next = [project, ...(await this.list())];
    const w = await this.storage.write("projects", next);
    if (!w.ok) return err(w.error);
    return ok(project);
  }

  async rename(id: string, name: string): Promise<Result<true>> {
    return this.mutate(id, (p) => ({ ...p, name: name.trim() || p.name, updatedAt: Date.now() }));
  }

  async remove(id: string): Promise<Result<true>> {
    const next = (await this.list()).filter((p) => p.id !== id);
    const w = await this.storage.write("projects", next);
    return w.ok ? ok(true) : err(w.error);
  }

  /**
   * Append a capture, merge facets into the passport, and refresh
   * domain-specific intelligence. The central continuity operation.
   */
  async ingestCapture(projectId: string, captured: CapturedConversation): Promise<Result<Project>> {
    if (this.flags && !this.flags.isEnabled("privacy.allowLocalStorage")) {
      return err(appError("FEATURE_DISABLED", "Local storage of captures is disabled in Privacy settings."));
    }
    const project = await this.get(projectId);
    if (!project) return err(appError("VALIDATION", `Project ${projectId} not found`));

    // Thread identity: derived here so imported captures and captures made by
    // older builds still get separated instead of landing in one mixed pile.
    const threadKey = captured.threadKey || buildThreadKey(captured.providerId, captured.url);
    const topic = deriveTopic(captured.turns, captured.title || "Conversation");
    const threadTitle =
      captured.threadTitle ||
      project.captures.find((c) => c.threadKey === threadKey)?.threadTitle ||
      buildThreadTitle(captured.providerId, topic, threadOrdinal(project, threadKey, topic));

    // Dedup against this thread only. Cross-thread dedup would delete
    // legitimately-repeated turns from a different conversation.
    const seen = new Set<string>();
    for (const cap of project.captures) {
      if (cap.threadKey && cap.threadKey !== threadKey) continue;
      if (cap.turnHashes?.length) {
        for (const h of cap.turnHashes) seen.add(h);
      } else {
        for (const t of cap.turns) seen.add(hashTurn(t.role, t.text));
      }
    }
    const localSeen = new Set<string>();
    const freshTurns: typeof captured.turns = [];
    const freshHashes: string[] = [];
    for (const t of captured.turns) {
      const h = hashTurn(t.role, t.text);
      if (localSeen.has(h)) continue;
      localSeen.add(h);
      if (seen.has(h)) continue;
      freshTurns.push(t);
      freshHashes.push(h);
    }

    // If CaptureService already filtered (or all turns are new), freshTurns matches captured.turns.
    // If everything was a duplicate, fall back to storing captured.turns so we never persist an empty capture.
    const turnsToStore = freshTurns.length > 0 ? freshTurns : captured.turns;
    const hashesToStore = freshTurns.length > 0
      ? freshHashes
      : captured.turns.map((t) => hashTurn(t.role, t.text));

    // Deep local brief. Built from every turn in this thread (prior captures
    // plus the new ones) so the handoff explains the whole conversation, not
    // just the delta that happened to be new this time.
    const threadTurns = [
      ...project.captures
        .filter((c) => c.threadKey === threadKey)
        .slice()
        .sort((a, b) => a.capturedAt - b.capturedAt)
        .flatMap((c) => c.turns),
      ...turnsToStore,
    ];
    const brief = this.summarizer.summarize({
      threadTitle,
      providerId: captured.providerId,
      capturedAt: captured.capturedAt,
      turns: threadTurns,
    });

    const capture: Capture = {
      id: crypto.randomUUID(),
      providerId: captured.providerId,
      url: captured.url,
      title: captured.title,
      turns: turnsToStore,
      capturedAt: captured.capturedAt,
      turnHashes: hashesToStore,
      threadKey,
      threadTitle,
      brief: brief.markdown,
      briefOneLiner: brief.oneLiner,
    };


    const facets = extractFacets(capture.turns, {
      captureId: capture.id,
      providerId: captured.providerId,
      capturedAt: captured.capturedAt,
    });

    const merged = mergePassport(project.passport as ContextPassport, facets);
    const captures = [capture, ...project.captures].slice(0, MAX_CAPTURES_PER_PROJECT);
    const intelligence = this.intelligence
      ? this.intelligence.enrich(project.intelligence, capture.turns, Date.now())
      : project.intelligence;

    // Capture the previously-active lock (if any) so undo can restore it.
    const previousActiveCaptureId = await this.readActiveCaptureId(project.id);

    const next: Project = {
      ...project,
      passport: merged as Project["passport"],
      captures,
      intelligence,
      updatedAt: Date.now(),
      lastCaptureUndo: {
        captureId: capture.id,
        previousActiveCaptureId,
        capturedAt: capture.capturedAt,
      },
    };
    const w = await this.replace(next);
    if (!w.ok) return err(w.error);
    return ok(next);
  }

  /** Distinct conversation threads in a project, newest activity first. */
  async listThreads(projectId: string): Promise<Array<{ threadKey: string; threadTitle: string; providerId: string; captureCount: number; lastCapturedAt: number; oneLiner: string }>> {
    const project = await this.get(projectId);
    if (!project) return [];
    const byKey = new Map<string, { threadKey: string; threadTitle: string; providerId: string; captureCount: number; lastCapturedAt: number; oneLiner: string }>();
    for (const c of project.captures) {
      const key = c.threadKey || `${c.providerId}::${c.id}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          threadKey: key,
          threadTitle: c.threadTitle || c.title,
          providerId: c.providerId,
          captureCount: 1,
          lastCapturedAt: c.capturedAt,
          oneLiner: c.briefOneLiner || "",
        });
        continue;
      }
      existing.captureCount++;
      if (c.capturedAt > existing.lastCapturedAt) {
        existing.lastCapturedAt = c.capturedAt;
        existing.oneLiner = c.briefOneLiner || existing.oneLiner;
      }
    }
    return [...byKey.values()].sort((a, b) => b.lastCapturedAt - a.lastCapturedAt);
  }

  /**
   * Passport containing only facets sourced from one thread. This is what a
   * "thread" paste scope uses, so a handoff never blends two conversations.
   */
  async passportForThread(projectId: string, threadKey: string): Promise<ContextPassport> {
    const project = await this.get(projectId);
    if (!project) return EMPTY_PASSPORT;
    const ids = new Set(project.captures.filter((c) => c.threadKey === threadKey).map((c) => c.id));
    const out = {} as ContextPassport;
    for (const field of Object.values(FACET_TO_FIELD)) {
      out[field] = project.passport[field].filter((f) => ids.has(f.source.captureId) || f.source.captureId === "manual");
    }
    return out;
  }



  /** Undo the most recent capture: remove it, restore the previous active lock. */
  async undoLastCapture(projectId: string): Promise<Result<{ removedCaptureId: string }>> {
    const project = await this.get(projectId);
    if (!project) return err(appError("VALIDATION", `Project ${projectId} not found`));
    const undo = project.lastCaptureUndo;
    if (!undo) return err(appError("VALIDATION", "Nothing to undo."));

    // Rebuild passport by removing non-pinned facets from the undone capture.
    const passport = { ...project.passport } as Project["passport"];
    for (const field of Object.values(FACET_TO_FIELD)) {
      passport[field] = passport[field].filter(
        (f) => f.source.captureId !== undo.captureId || f.pinned,
      );
    }
    const captures = project.captures.filter((c) => c.id !== undo.captureId);

    const next: Project = {
      ...project,
      passport,
      captures,
      updatedAt: Date.now(),
      lastCaptureUndo: null,
    };
    const w = await this.replace(next);
    if (!w.ok) return err(w.error);

    // Restore the prior active-capture lock.
    await this.writeActiveCaptureId(projectId, undo.previousActiveCaptureId);
    return ok({ removedCaptureId: undo.captureId });
  }

  private async readActiveCaptureId(projectId: string): Promise<string | null> {
    const r = await this.storage.read("settings:user");
    if (!r.ok || !r.value) return null;
    return r.value.activeCaptureByProject[projectId] ?? null;
  }

  private async writeActiveCaptureId(projectId: string, captureId: string | null): Promise<void> {
    const r = await this.storage.read("settings:user");
    if (!r.ok || !r.value) return;
    const map = { ...r.value.activeCaptureByProject };
    if (captureId) map[projectId] = captureId; else delete map[projectId];
    await this.storage.write("settings:user", { ...r.value, activeCaptureByProject: map });
  }

  async renameCapture(projectId: string, captureId: string, title: string): Promise<Result<true>> {
    const name = title.trim();
    if (!name) return err(appError("VALIDATION", "Title cannot be empty"));
    return this.mutate(projectId, (p) => ({
      ...p,
      captures: p.captures.map((c) => (c.id === captureId ? { ...c, title: name } : c)),
      updatedAt: Date.now(),
    }));
  }

  async removeCapture(projectId: string, captureId: string): Promise<Result<true>> {
    return this.mutate(projectId, (p) => {
      // Also purge facets that originated from this capture (non-pinned).
      const passport = { ...p.passport } as Project["passport"];
      for (const field of Object.values(FACET_TO_FIELD)) {
        passport[field] = passport[field].filter(
          (f) => f.source.captureId !== captureId || f.pinned,
        );
      }
      return {
        ...p,
        captures: p.captures.filter((c) => c.id !== captureId),
        passport,
        updatedAt: Date.now(),
      };
    });
  }

  async pinFacet(projectId: string, facetId: string, pinned: boolean): Promise<Result<true>> {
    return this.mapFacet(projectId, facetId, (f) => ({ ...f, pinned }));
  }
  async dismissFacet(projectId: string, facetId: string): Promise<Result<true>> {
    return this.mapFacet(projectId, facetId, (f) => ({ ...f, dismissed: true }));
  }
  async editFacet(projectId: string, facetId: string, text: string): Promise<Result<true>> {
    return this.mapFacet(projectId, facetId, (f) => ({ ...f, text, pinned: true }));
  }
  async addManualFacet(projectId: string, kind: FacetKind, text: string): Promise<Result<true>> {
    const project = await this.get(projectId);
    if (!project) return err(appError("VALIDATION", `Project ${projectId} not found`));
    const item: StoredFacetItem = {
      id: crypto.randomUUID(),
      kind,
      text,
      source: { captureId: "manual", providerId: "manual", role: "user", capturedAt: Date.now() },
      confidence: 1,
      pinned: true,
      dismissed: false,
    };
    const field = FACET_TO_FIELD[kind];
    const passport = { ...project.passport, [field]: [...project.passport[field], item] } as Project["passport"];
    return (await this.replace({ ...project, passport, updatedAt: Date.now() })).ok ? ok(true) : err(appError("STORAGE_WRITE", "addManualFacet"));
  }

  private async mapFacet(
    projectId: string,
    facetId: string,
    fn: (f: StoredFacetItem) => StoredFacetItem,
  ): Promise<Result<true>> {
    return this.mutate(projectId, (p) => {
      const passport = { ...p.passport };
      for (const field of Object.values(FACET_TO_FIELD)) {
        passport[field] = passport[field].map((f) => (f.id === facetId ? fn(f) : f));
      }
      return { ...p, passport, updatedAt: Date.now() };
    });
  }

  private async mutate(id: string, fn: (p: Project) => Project): Promise<Result<true>> {
    const all = await this.list();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) return err(appError("VALIDATION", `Project ${id} not found`));
    const next = [...all];
    next[idx] = fn(all[idx]!);
    const w = await this.storage.write("projects", next);
    return w.ok ? ok(true) : err(w.error);
  }

  private async replace(p: Project): Promise<Result<true>> {
    return this.mutate(p.id, () => p);
  }
}

/** Merge new facets into existing passport, deduping by normalized text per kind. */
function mergePassport(existing: ContextPassport, incoming: FacetItem[]): ContextPassport {
  const next: ContextPassport = {
    goals: [...existing.goals],
    status: [...existing.status],
    decisions: [...existing.decisions],
    constraints: [...existing.constraints],
    progress: [...existing.progress],
    filesReferenced: [...existing.filesReferenced],
    openQuestions: [...existing.openQuestions],
    blockers: [...existing.blockers],
    nextActions: [...existing.nextActions],
  };
  for (const item of incoming) {
    const field = FACET_TO_FIELD[item.kind];
    const norm = normalize(item.text);
    const dup = next[field].find((x) => normalize(x.text) === norm);
    if (dup) {
      dup.confidence = Math.min(1, dup.confidence + 0.1);
      continue;
    }
    next[field].push(item);
  }
  for (const field of Object.values(FACET_TO_FIELD)) {
    next[field] = capFacet(next[field], 30);
  }
  return next;
}

function capFacet(items: FacetItem[], max: number): FacetItem[] {
  if (items.length <= max) return items;
  const pinned = items.filter((i) => i.pinned);
  const rest = items
    .filter((i) => !i.pinned)
    .sort((a, b) => b.confidence - a.confidence || b.source.capturedAt - a.source.capturedAt)
    .slice(0, Math.max(0, max - pinned.length));
  return [...pinned, ...rest];
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();
}


/**
 * Disambiguate two threads that produced the same topic string inside one
 * project, so every conversation still gets a distinct visible name.
 */
function threadOrdinal(project: Project, threadKey: string, topic: string): number {
  const keys = new Set<string>();
  for (const c of project.captures) {
    if (!c.threadKey || c.threadKey === threadKey) continue;
    if ((c.threadTitle || "").includes(topic)) keys.add(c.threadKey);
  }
  return keys.size + 1;
}
