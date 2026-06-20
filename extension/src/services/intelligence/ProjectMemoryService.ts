// Persistent project memory: free-form notes the user wants to survive
// every capture, every render, every AI switch. Stored on the Project itself.

import type { StorageGateway } from "@/storage/StorageGateway";
import type { Project, ProjectMemoryNote } from "@/storage/schema";
import { type Result, ok, err, appError } from "@/core/result";

const MAX_NOTES = 200;

export class ProjectMemoryService {
  constructor(private readonly storage: StorageGateway) {}

  async list(projectId: string): Promise<ProjectMemoryNote[]> {
    const r = await this.storage.read("projects");
    const p = r.ok && r.value ? r.value.find((x) => x.id === projectId) : undefined;
    return p?.memory ?? [];
  }

  async add(projectId: string, text: string): Promise<Result<ProjectMemoryNote>> {
    const trimmed = text.trim();
    if (!trimmed) return err(appError("VALIDATION", "Memory note cannot be empty"));
    return this.mutateProject(projectId, (p) => {
      const note: ProjectMemoryNote = {
        id: crypto.randomUUID(),
        text: trimmed,
        createdAt: Date.now(),
      };
      const next: Project = {
        ...p,
        memory: [note, ...p.memory].slice(0, MAX_NOTES),
        updatedAt: Date.now(),
      };
      return { project: next, value: note };
    });
  }

  async remove(projectId: string, noteId: string): Promise<Result<true>> {
    const r = await this.mutateProject(projectId, (p) => ({
      project: { ...p, memory: p.memory.filter((n) => n.id !== noteId), updatedAt: Date.now() },
      value: true as const,
    }));
    return r;
  }

  private async mutateProject<T>(
    projectId: string,
    fn: (p: Project) => { project: Project; value: T },
  ): Promise<Result<T>> {
    const r = await this.storage.read("projects");
    if (!r.ok) return err(r.error);
    const list = r.value ?? [];
    const idx = list.findIndex((p) => p.id === projectId);
    if (idx === -1) return err(appError("VALIDATION", `Project ${projectId} not found`));
    const { project, value } = fn(list[idx]!);
    const next = [...list];
    next[idx] = project;
    const w = await this.storage.write("projects", next);
    if (!w.ok) return err(w.error);
    return ok(value);
  }
}
