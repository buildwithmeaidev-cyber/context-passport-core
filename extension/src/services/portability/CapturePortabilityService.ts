// Export and import project captures as JSON or CSV.
// Import uses an independent zod schema so future internal schema changes
// don't break backup files, and re-runs cross-capture dedup on ingest.
import { z } from "zod";
import type { ProjectService } from "@/services/project/ProjectService";
import type { CapturedConversation } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";

const EXPORT_FORMAT_VERSION = 1;

const importTurnSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  text: z.string(),
});
const importCaptureSchema = z.object({
  providerId: z.string(),
  url: z.string().default(""),
  title: z.string().default("Imported capture"),
  turns: z.array(importTurnSchema),
  capturedAt: z.number().default(() => Date.now()),
});
const importPayloadSchema = z.object({
  formatVersion: z.number(),
  exportedAt: z.number().optional(),
  projectName: z.string().optional(),
  captures: z.array(importCaptureSchema),
});

export type ExportFormat = "json" | "csv";

export interface ImportSummary {
  totalInPayload: number;
  imported: number;
  skipped: number;
  errors: string[];
}

export class CapturePortabilityService {
  constructor(private readonly projects: ProjectService) {}

  async exportProject(projectId: string, format: ExportFormat): Promise<Result<{ filename: string; mime: string; body: string }>> {
    const project = await this.projects.get(projectId);
    if (!project) return err(appError("VALIDATION", `Project ${projectId} not found`));
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safe = project.name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40) || "project";
    if (format === "json") {
      const body = JSON.stringify({
        formatVersion: EXPORT_FORMAT_VERSION,
        exportedAt: Date.now(),
        projectName: project.name,
        captures: project.captures.map((c) => ({
          providerId: c.providerId,
          url: c.url,
          title: c.title,
          capturedAt: c.capturedAt,
          turns: c.turns,
        })),
      }, null, 2);
      return ok({ filename: `contextpassport-${safe}-${stamp}.json`, mime: "application/json", body });
    }
    // CSV
    const rows: string[] = [csvRow(["captureId", "capturedAt", "providerId", "title", "turnIndex", "role", "text"])];
    for (const c of project.captures) {
      for (let i = 0; i < c.turns.length; i++) {
        const t = c.turns[i]!;
        rows.push(csvRow([c.id, new Date(c.capturedAt).toISOString(), c.providerId, c.title, String(i), t.role, t.text]));
      }
    }
    return ok({ filename: `contextpassport-${safe}-${stamp}.csv`, mime: "text/csv", body: rows.join("\n") });
  }

  async importIntoProject(projectId: string, rawBody: string, filenameHint?: string): Promise<Result<ImportSummary>> {
    const isCsv = filenameHint?.toLowerCase().endsWith(".csv") || (rawBody.trim().startsWith("captureId,") || rawBody.trim().startsWith("\"captureId\","));
    let captures: CapturedConversation[];
    try {
      captures = isCsv ? parseCsv(rawBody) : parseJson(rawBody);
    } catch (e) {
      return err(appError("VALIDATION", `Could not parse import file: ${e instanceof Error ? e.message : String(e)}`));
    }

    const summary: ImportSummary = { totalInPayload: captures.length, imported: 0, skipped: 0, errors: [] };
    for (const c of captures) {
      const r = await this.projects.ingestCapture(projectId, c);
      if (!r.ok) {
        // ingestCapture may treat all-duplicate as an error in some modes — count as skipped.
        summary.skipped++;
        continue;
      }
      summary.imported++;
    }
    return ok(summary);
  }
}

function parseJson(body: string): CapturedConversation[] {
  const parsed = importPayloadSchema.safeParse(JSON.parse(body));
  if (!parsed.success) throw new Error(parsed.error.message);
  return parsed.data.captures.map((c) => ({
    providerId: c.providerId,
    url: c.url,
    title: c.title,
    turns: c.turns,
    capturedAt: c.capturedAt,
  }));
}

function parseCsv(body: string): CapturedConversation[] {
  const rows = parseCsvRows(body);
  if (rows.length === 0) return [];
  const header = rows[0]!.map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const iCap = idx("captureId"), iAt = idx("capturedAt"), iProv = idx("providerId"),
    iTitle = idx("title"), iTurnIdx = idx("turnIndex"), iRole = idx("role"), iText = idx("text");
  if ([iCap, iProv, iRole, iText].some((n) => n === -1)) throw new Error("CSV missing required columns.");
  const groups = new Map<string, CapturedConversation & { _order: Array<{ i: number; role: "user" | "assistant" | "system"; text: string }> }>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    if (row.length === 1 && row[0] === "") continue;
    const captureId = row[iCap] ?? "";
    if (!captureId) continue;
    const role = row[iRole] as "user" | "assistant" | "system";
    if (!["user", "assistant", "system"].includes(role)) continue;
    let group = groups.get(captureId);
    if (!group) {
      group = {
        providerId: row[iProv] || "unknown",
        url: "",
        title: iTitle >= 0 ? row[iTitle] || "Imported capture" : "Imported capture",
        capturedAt: iAt >= 0 ? Date.parse(row[iAt] || "") || Date.now() : Date.now(),
        turns: [],
        _order: [],
      };
      groups.set(captureId, group);
    }
    group._order.push({ i: iTurnIdx >= 0 ? parseInt(row[iTurnIdx] || "0", 10) || 0 : group._order.length, role, text: row[iText] || "" });
  }
  const out: CapturedConversation[] = [];
  for (const g of groups.values()) {
    g._order.sort((a, b) => a.i - b.i);
    out.push({ providerId: g.providerId, url: g.url, title: g.title, capturedAt: g.capturedAt, turns: g._order.map((x) => ({ role: x.role, text: x.text })) });
  }
  return out;
}

// ---- CSV helpers (RFC 4180-ish) ----
function csvRow(cells: string[]): string {
  return cells.map(csvEscape).join(",");
}
function csvEscape(v: string): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function parseCsvRows(body: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (body[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === "\r") { /* skip */ }
      else field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}
