# Storage Schema

All persistent data lives in `chrome.storage.local`, accessed exclusively via `StorageGateway`. Every value is wrapped as `{ __v: number, data: T }` where `__v` is the schema version it was written with.

Current version: **2**.

## Namespaces (keys)

| Key                     | Shape                                                | Purpose                                          |
|-------------------------|------------------------------------------------------|--------------------------------------------------|
| `projects`              | `Project[]`                                          | Projects with embedded passport + captures.      |
| `settings:user`         | `{ activeProjectId, defaultRenderMode, theme }`      | User preferences.                                |
| `flags:overrides`       | `Record<string, boolean>`                            | User-set feature-flag overrides.                 |
| `meta:schemaVersion`    | `{ version: number }`                                | Human-readable global schema marker.             |
| `quarantine:<key>:<ts>` | `{ reason, raw }`                                    | Auto-created when validation fails on read.      |
| `vault:conversations`   | *(legacy v1)*                                        | Read once on update, imported into a project; can be removed afterward. |

### `Project`

```ts
{
  id: string;                  // crypto.randomUUID()
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  passport: ContextPassport;
  captures: Capture[];         // capped at 50 newest
}
```

### `ContextPassport`

```ts
{
  goals:         FacetItem[];
  decisions:     FacetItem[];
  constraints:   FacetItem[];
  progress:      FacetItem[];
  openQuestions: FacetItem[];
  nextActions:   FacetItem[];
}
```

Each array is capped at 30 items. Pinned items are kept first; remaining slots go to highest-confidence items. Dismissed items are kept (so they don't reappear on re-merge) but excluded from rendering.

### `FacetItem`

```ts
{
  id: string;
  kind: "goal" | "decision" | "constraint" | "progress" | "openQuestion" | "nextAction";
  text: string;
  source: {
    captureId: string;       // "manual" for user-added items
    providerId: string;
    role: "user" | "assistant" | "system";
    capturedAt: number;
  };
  confidence: number;        // 0..1, heuristic; manual items = 1.0
  pinned: boolean;           // survives caps and merges
  dismissed: boolean;        // never reappears in rendering
}
```

### `Capture`

```ts
{
  id: string;
  providerId: string;        // "chatgpt" | "claude" | "gemini" | "perplexity" | ...
  url: string;
  title: string;
  turns: Array<{ role, text }>;
  capturedAt: number;
}
```

Captures are kept so a future improved extractor can re-derive facets without re-capturing. They are not surfaced as the primary artifact.

## Quotas

`chrome.storage.local` allows ~10 MB per extension by default. The 30-item-per-facet cap and 50-captures-per-project cap keep a single project bounded. If a project still exceeds quota, the write returns a `STORAGE_WRITE` error surfaced in the popup. A future migration may chunk captures into per-key blobs.

## Versioning & Migrations

- `CURRENT_VERSION = 2` in `src/storage/schema.ts`.
- Each write tags data with `CURRENT_VERSION`.
- Each read runs `migrations[fromVersion]` repeatedly until the value reaches `CURRENT_VERSION`. Migrations are **forward-only** and pure: `(key, Versioned<unknown>) → Versioned<unknown>`.
- Bumping the version requires a new entry in `src/storage/migrations/index.ts`. Never modify an existing one — treat them as append-only history.
- Schemas live in `src/storage/schema.ts` and are validated with zod on **both** read and write. Invalid data is moved to `quarantine:*`, never dropped.

### v1 → v2 (this release)

The v1 model was a flat `vault:conversations` list. The v2 model is `projects[]`. On update:

1. `background/index.ts` reads the raw `vault:conversations` key.
2. Each conversation is parsed against the legacy schema (`legacyConversationSchema`).
3. They are wrapped into a single "Legacy import" project (empty passport, captures preserved).
4. The new value is written to `projects`. The legacy key is left alone (a future patch will offer a one-click clear in options).
5. `settings:user` is migrated by `migrations[1]`: `defaultCompressionMode` becomes `defaultRenderMode`; theme is preserved.

The import is idempotent: it runs only when `projects` is empty.

## Privacy

All data stays in `chrome.storage.local`. The extension makes **zero network requests**. There is no telemetry, no remote sync, no third-party SDK. If a future version adds sync, it must:
- be opt-in via `settings:user`,
- write through `StorageGateway` (no direct `chrome.storage` calls),
- and document the new network surface in this file.
