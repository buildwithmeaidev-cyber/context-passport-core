import type { StorageGateway } from "@/storage/StorageGateway";
import type { Conversation } from "@/storage/schema";
import type { CapturedConversation } from "@/core/tokens";
import { type Result, ok, err, appError } from "@/core/result";

export class VaultService {
  constructor(private readonly storage: StorageGateway) {}

  async list(): Promise<Conversation[]> {
    const r = await this.storage.read("vault:conversations");
    if (!r.ok) return [];
    return r.value ?? [];
  }

  async save(captured: CapturedConversation): Promise<Result<Conversation>> {
    const existing = await this.list();
    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      providerId: captured.providerId,
      url: captured.url,
      title: captured.title,
      turns: captured.turns,
      capturedAt: captured.capturedAt,
      tags: [],
    };
    const next = [conv, ...existing].slice(0, 500); // hard cap, see STORAGE_SCHEMA.md
    const w = await this.storage.write("vault:conversations", next);
    if (!w.ok) return err(w.error);
    return ok(conv);
  }

  async remove(id: string): Promise<Result<true>> {
    const all = await this.list();
    const next = all.filter((c) => c.id !== id);
    const w = await this.storage.write("vault:conversations", next);
    return w.ok ? ok(true) : err(w.error);
  }

  async get(id: string): Promise<Conversation | undefined> {
    return (await this.list()).find((c) => c.id === id);
  }

  async search(query: string): Promise<Conversation[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.list();
    const all = await this.list();
    return all.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.turns.some((t) => t.text.toLowerCase().includes(q)),
    );
  }

  /** Renders a Conversation into a single prompt-ready string. */
  toPrompt(conv: Conversation): string {
    const head = `# Context from ${conv.providerId} — ${conv.title}\n`;
    const body = conv.turns
      .map((t) => `## ${t.role}\n${t.text}`)
      .join("\n\n");
    return `${head}\n${body}`;
  }

  /** Defensive guard for unexpected errors. */
  guard<T>(r: Result<T>): T {
    if (!r.ok) throw new Error(`[Vault] ${r.error.code}: ${r.error.message}`);
    return r.value;
  }

  // Reserved for future server sync; today errors clearly.
  async sync(): Promise<Result<true>> {
    return err(appError("FEATURE_DISABLED", "Sync requires a backend (not enabled)."));
  }
}
