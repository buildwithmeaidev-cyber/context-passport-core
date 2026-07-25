// Pure derivation of per-capture and per-project stats. No new storage.
import type { Project, Capture } from "@/storage/schema";
import { hashTurn } from "@/core/hashTurn";

export interface CaptureStats {
  captureId: string;
  providerId: string;
  title: string;
  capturedAt: number;
  totalTurns: number;
  uniqueTurns: number;
  duplicateTurns: number;
  duplicateRate: number; // 0..1
  userTurns: number;
  assistantTurns: number;
}

export interface ProjectStats {
  totalCaptures: number;
  totalTurns: number;
  totalDuplicates: number;
  aggregateDuplicateRate: number;
  firstCaptureAt: number | null;
  lastCaptureAt: number | null;
}

export class CaptureStatsService {
  captureStats(capture: Capture): CaptureStats {
    const hashes = capture.turnHashes?.length
      ? capture.turnHashes
      : capture.turns.map((t) => hashTurn(t.role, t.text));
    const seen = new Set<string>();
    let dups = 0;
    let users = 0;
    let assistants = 0;
    for (let i = 0; i < capture.turns.length; i++) {
      const h = hashes[i] ?? hashTurn(capture.turns[i]!.role, capture.turns[i]!.text);
      if (seen.has(h)) dups++;
      else seen.add(h);
      if (capture.turns[i]!.role === "user") users++;
      if (capture.turns[i]!.role === "assistant") assistants++;
    }
    const total = capture.turns.length;
    return {
      captureId: capture.id,
      providerId: capture.providerId,
      title: capture.title,
      capturedAt: capture.capturedAt,
      totalTurns: total,
      uniqueTurns: seen.size,
      duplicateTurns: dups,
      duplicateRate: total > 0 ? dups / total : 0,
      userTurns: users,
      assistantTurns: assistants,
    };
  }

  projectStats(project: Project): ProjectStats {
    let totalTurns = 0;
    let totalDups = 0;
    let first: number | null = null;
    let last: number | null = null;
    for (const c of project.captures) {
      const s = this.captureStats(c);
      totalTurns += s.totalTurns;
      totalDups += s.duplicateTurns;
      first = first === null ? c.capturedAt : Math.min(first, c.capturedAt);
      last = last === null ? c.capturedAt : Math.max(last, c.capturedAt);
    }
    return {
      totalCaptures: project.captures.length,
      totalTurns,
      totalDuplicates: totalDups,
      aggregateDuplicateRate: totalTurns > 0 ? totalDups / totalTurns : 0,
      firstCaptureAt: first,
      lastCaptureAt: last,
    };
  }
}
