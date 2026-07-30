// Pure validation of extracted turns. Runs before the preview modal.
// Never persists — used to warn the user, never to block a capture silently.
import type { ConversationTurn } from "@/core/tokens";
import { hashTurn } from "@/core/hashTurn";
import { type AdapterDiagnostics, explainDiagnostics } from "./AdapterDiagnostics";


export type IntegritySeverity = "warn" | "error";
export type IntegrityLevel = "ok" | IntegritySeverity;

export interface IntegrityIssue {
  code: string;
  severity: IntegritySeverity;
  message: string;
  count?: number;
}

export interface IntegrityReport {
  level: IntegrityLevel;
  issues: IntegrityIssue[];
  totalTurns: number;
  emptyTurns: number;
  duplicateTurns: number;
  userTurns: number;
  assistantTurns: number;
  /** Adapter attribution for missing/odd fields. Undefined when unavailable. */
  diagnostics?: AdapterDiagnostics & { explanation: string[] };
}

const MIN_TEXT_LEN = 3;
const HIGH_DUP_RATE = 0.4;

export class CaptureIntegrityService {
  validate(
    turns: readonly ConversationTurn[],
    title: string,
    diagnostics?: AdapterDiagnostics | null,
  ): IntegrityReport {
    const issues: IntegrityIssue[] = [];

    let empty = 0;
    let userTurns = 0;
    let assistantTurns = 0;
    let missingRole = 0;
    let tooShort = 0;
    let consecutiveDup = 0;
    let prevHash: string | null = null;
    const seen = new Set<string>();
    let duplicates = 0;

    for (const t of turns) {
      const text = (t.text ?? "").trim();
      if (!text) empty++;
      if (!t.role) missingRole++;
      if (text && text.length < MIN_TEXT_LEN) tooShort++;
      if (t.role === "user") userTurns++;
      if (t.role === "assistant") assistantTurns++;

      const h = hashTurn(t.role ?? "unknown", text);
      if (seen.has(h)) duplicates++;
      else seen.add(h);
      if (prevHash && prevHash === h) consecutiveDup++;
      prevHash = h;
    }

    const total = turns.length;

    if (total === 0) {
      issues.push({ code: "NO_TURNS", severity: "error", message: "No conversation turns detected on this page." });
    }
    if (empty > 0) {
      issues.push({ code: "EMPTY_TURNS", severity: "warn", message: "Some turns are empty. The page may still be loading.", count: empty });
    }
    if (missingRole > 0) {
      issues.push({ code: "MISSING_ROLE", severity: "error", message: "Some turns are missing role information (user/assistant).", count: missingRole });
    }
    if (tooShort > 0) {
      issues.push({ code: "SHORT_TURNS", severity: "warn", message: "Some turns are unusually short and may be extraction noise.", count: tooShort });
    }
    if (consecutiveDup > 0) {
      issues.push({ code: "CONSECUTIVE_DUPS", severity: "warn", message: "Detected consecutive identical turns.", count: consecutiveDup });
    }
    if (total > 4 && duplicates / total >= HIGH_DUP_RATE) {
      issues.push({ code: "HIGH_DUP_RATE", severity: "warn", message: `High duplicate rate (${Math.round((duplicates / total) * 100)}%). The extractor may be picking up rendered history twice.`, count: duplicates });
    }
    if (total > 0 && userTurns === 0) {
      issues.push({ code: "NO_USER_TURNS", severity: "warn", message: "No user turns found — the handoff may lack goals and questions." });
    }
    if (total > 0 && assistantTurns === 0) {
      issues.push({ code: "NO_ASSISTANT_TURNS", severity: "warn", message: "No assistant turns found — the handoff won't capture prior answers." });
    }
    if (total > 0 && turns[0]!.role === "assistant") {
      issues.push({ code: "FIRST_IS_ASSISTANT", severity: "warn", message: "Conversation starts with an assistant turn — the earliest user prompts may have been cut off by the page." });
    }
    if (!title.trim()) {
      issues.push({ code: "MISSING_TITLE", severity: "warn", message: "No conversation title detected." });
    }

    const level: IntegrityLevel = issues.some((i) => i.severity === "error")
      ? "error"
      : issues.some((i) => i.severity === "warn")
        ? "warn"
        : "ok";

    return { level, issues, totalTurns: total, emptyTurns: empty, duplicateTurns: duplicates, userTurns, assistantTurns };
  }
}
