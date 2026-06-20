// Context Health Score (0–100): a deterministic, local rubric that judges
// whether a project's passport is rich enough to support a clean handoff to
// another AI. Never throws — always returns actionable recommendations.

import type { Project } from "@/storage/schema";
import type { FacetKind } from "@/core/passport";
import { FACET_TO_FIELD } from "@/core/passport";

export interface HealthBreakdown {
  goalClarity: number;        // 0..30
  decisionQuality: number;    // 0..25
  requirementCoverage: number;// 0..25  (constraints + status)
  nextActionCoverage: number; // 0..20
}

export interface HealthReport {
  score: number;            // 0..100
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: HealthBreakdown;
  recommendations: string[];
}

function visibleCount(p: Project, kind: FacetKind): number {
  return p.passport[FACET_TO_FIELD[kind]].filter((f) => !f.dismissed).length;
}

function visiblePinned(p: Project, kind: FacetKind): number {
  return p.passport[FACET_TO_FIELD[kind]].filter((f) => !f.dismissed && f.pinned).length;
}

function avgConfidence(p: Project, kind: FacetKind): number {
  const items = p.passport[FACET_TO_FIELD[kind]].filter((f) => !f.dismissed);
  if (items.length === 0) return 0;
  return items.reduce((s, x) => s + x.confidence, 0) / items.length;
}

export class ContextHealthService {
  evaluate(project: Project): HealthReport {
    const goals = visibleCount(project, "goal");
    const goalsPinned = visiblePinned(project, "goal");
    const goalClarity = clamp(
      Math.min(goals, 3) * 6 +           // up to 18 for having goals
      Math.min(goalsPinned, 2) * 4 +     // up to 8 for user-pinned authoritative goals
      (avgConfidence(project, "goal") * 4),
      0,
      30,
    );

    const decisions = visibleCount(project, "decision");
    const decisionQuality = clamp(
      Math.min(decisions, 5) * 4 + avgConfidence(project, "decision") * 5,
      0,
      25,
    );

    const constraints = visibleCount(project, "constraint");
    const status = visibleCount(project, "status");
    const requirementCoverage = clamp(
      Math.min(constraints, 4) * 4 + Math.min(status, 2) * 4.5,
      0,
      25,
    );

    const nextActions = visibleCount(project, "nextAction");
    const blockers = visibleCount(project, "blocker");
    const nextActionCoverage = clamp(
      Math.min(nextActions, 4) * 4 + (blockers > 0 ? 4 : 0),
      0,
      20,
    );

    const score = Math.round(
      goalClarity + decisionQuality + requirementCoverage + nextActionCoverage,
    );

    const recommendations: string[] = [];
    if (goals === 0) recommendations.push("Add at least one Project Goal — handoff prompts are unreliable without it.");
    else if (goalsPinned === 0) recommendations.push("Pin your authoritative goal so re-merges can't dilute it.");
    if (decisions < 3) recommendations.push("Capture the architectural decisions you've already made (frameworks, data model, constraints).");
    if (constraints === 0) recommendations.push("Add explicit Constraints (deadlines, must-not, performance budgets) — AIs default to permissive assumptions without them.");
    if (status === 0) recommendations.push("Write one Current Status line so the next AI knows where you are, not just where you started.");
    if (nextActions === 0) recommendations.push("List the immediate Next Actions — handoffs without next steps lose momentum.");
    if (blockers === 0 && nextActions > 0) recommendations.push("If anything is blocking progress, name it. Silence reads as 'no blockers'.");

    return {
      score,
      grade: gradeFor(score),
      breakdown: { goalClarity, decisionQuality, requirementCoverage, nextActionCoverage },
      recommendations,
    };
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function gradeFor(score: number): HealthReport["grade"] {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}
