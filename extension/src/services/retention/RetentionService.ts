// RetentionService — configurable, non-destructive-by-default pruning.
//
// Two independent rules, both opt-outable:
//   keepLastN   — keep only the N most recent captures per project
//   maxAgeDays  — drop captures older than this (0 = no age limit)
//
// Pinned passport facets always survive. Facets sourced from a pruned capture
// are removed with it, so the passport never references data that's gone.

import type { StorageGateway } from "@/storage/StorageGateway";
import type { Project, Capture } from "@/storage/schema";
import { FACET_TO_FIELD } from "@/core/passport";

export interface RetentionPolicy {
  enabled: boolean;
  keepLastN: number;
  maxAgeDays: number;
}

export const DEFAULT_RETENTION: RetentionPolicy = {
  enabled: true,
  keepLastN: 25,
  maxAgeDays: 90,
};

export interface PrunePlanEntry {
  captureId: string;
  title: string;
  capturedAt: number;
  reason: "over-limit" | "too-old";
}

export interface PrunePlan {
  projectId: string;
  projectName: string;
  remove: PrunePlanEntry[];
  keep: number;
}

/** Pure: decide which captures a policy would remove. No I/O. */
export function planPrune(project: Project, policy: RetentionPolicy, now: number): PrunePlan {
  const plan: PrunePlan = { projectId: project.id, projectName: project.name, remove: [], keep: project.captures.length };
  if (!policy.enabled) return plan;

  // Newest first — matches how ProjectService stores them, but don't assume it.
  const ordered = [...project.captures].sort((a, b) => b.capturedAt - a.capturedAt);
  const cutoff = policy.maxAgeDays > 0 ? now - policy.maxAgeDays * 86_400_000 : -Infinity;
  const keepN = Math.max(1, policy.keepLastN);

  ordered.forEach((c: Capture, index: number) => {
    if (index >= keepN) {
      plan.remove.push({ captureId: c.id, title: c.title, capturedAt: c.capturedAt, reason: "over-limit" });
      return;
    }
    if (c.capturedAt < cutoff) {
      plan.remove.push({ captureId: c.id, title: c.title, capturedAt: c.capturedAt, reason: "too-old" });
    }
  });

  plan.keep = project.captures.length - plan.remove.length;
  return plan;
}

/** Pure: apply a plan to a project object. */
export function applyPrune(project: Project, plan: PrunePlan): Project {
  if (plan.remove.length === 0) return project;
  const removed = new Set(plan.remove.map((r) => r.captureId));
  const passport = { ...project.passport } as Project["passport"];
  for (const field of Object.values(FACET_TO_FIELD)) {
    passport[field] = passport[field].filter((f) => f.pinned || !removed.has(f.source.captureId));
  }
  const undo = project.lastCaptureUndo && removed.has(project.lastCaptureUndo.captureId)
    ? null
    : project.lastCaptureUndo;
  return {
    ...project,
    passport,
    captures: project.captures.filter((c) => !removed.has(c.id)),
    lastCaptureUndo: undo,
    updatedAt: Date.now(),
  };
}

export class RetentionService {
  constructor(private readonly storage: StorageGateway) {}

  async getPolicy(): Promise<RetentionPolicy> {
    const r = await this.storage.read("settings:user");
    if (!r.ok || !r.value) return { ...DEFAULT_RETENTION };
    return { ...DEFAULT_RETENTION, ...(r.value.retention ?? {}) };
  }

  async setPolicy(patch: Partial<RetentionPolicy>): Promise<RetentionPolicy> {
    const r = await this.storage.read("settings:user");
    const current = r.ok && r.value ? r.value : null;
    const next = { ...DEFAULT_RETENTION, ...(current?.retention ?? {}), ...patch };
    if (current) await this.storage.write("settings:user", { ...current, retention: next });
    return next;
  }

  /** Dry run across all projects — used by the "Prune now" preview. */
  async planAll(now = Date.now()): Promise<PrunePlan[]> {
    const policy = await this.getPolicy();
    const list = await this.readProjects();
    return list.map((p) => planPrune(p, policy, now)).filter((p) => p.remove.length > 0);
  }

  /** Apply retention to every project. Returns the number of captures removed. */
  async pruneAll(now = Date.now()): Promise<{ removed: number; plans: PrunePlan[] }> {
    const policy = await this.getPolicy();
    if (!policy.enabled) return { removed: 0, plans: [] };
    const list = await this.readProjects();
    const plans: PrunePlan[] = [];
    let changed = false;
    const next = list.map((p) => {
      const plan = planPrune(p, policy, now);
      if (plan.remove.length === 0) return p;
      plans.push(plan);
      changed = true;
      return applyPrune(p, plan);
    });
    if (changed) await this.storage.write("projects", next);
    return { removed: plans.reduce((n, p) => n + p.remove.length, 0), plans };
  }

  /** Apply retention to one project. */
  async pruneProject(projectId: string, now = Date.now()): Promise<PrunePlan | null> {
    const policy = await this.getPolicy();
    if (!policy.enabled) return null;
    const list = await this.readProjects();
    const target = list.find((p) => p.id === projectId);
    if (!target) return null;
    const plan = planPrune(target, policy, now);
    if (plan.remove.length === 0) return null;
    await this.storage.write("projects", list.map((p) => (p.id === projectId ? applyPrune(p, plan) : p)));
    return plan;
  }

  private async readProjects(): Promise<Project[]> {
    const r = await this.storage.read("projects");
    return r.ok && r.value ? r.value : [];
  }
}
