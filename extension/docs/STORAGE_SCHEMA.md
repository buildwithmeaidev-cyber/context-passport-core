# Storage Schema

All persistent data lives in `chrome.storage.local`, accessed exclusively via `StorageGateway`. Every value is wrapped as `{ __v: number, data: T }` where `__v` is the schema version it was written with.

Current version: **1**.

## Namespaces (keys)

| Key                     | Shape                                           | Purpose                                         |
|-------------------------|-------------------------------------------------|-------------------------------------------------|
| `vault:conversations`   | `Conversation[]`                                | Captured conversations (newest first, capped 500). |
| `vault:index`           | `{ byId: Record<id, { title, providerId, capturedAt }> }` | Reserved for fast search; not populated in v1.     |
| `settings:user`         | `{ defaultCompressionMode, autoCaptureOnSubmit, theme }` | User preferences.                            |
| `flags:overrides`       | `Record<string, boolean>`                       | User-set feature-flag overrides.                |
| `meta:schemaVersion`    | `{ version: number }`                           | Human-readable global schema marker.            |
| `quarantine:<key>:<ts>` | `{ reason, raw }`                               | Auto-created when validation fails on read.     |

### `Conversation`

```ts
{
  id: string;            // crypto.randomUUID()
  providerId: string;    // "chatgpt" | "claude" | "gemini" | future
  url: string;
  title: string;
  turns: Array<{ role: "user" | "assistant" | "system"; text: string }>;
  capturedAt: number;    // ms epoch
  tags: string[];        // default []
}
```

## Quotas

`chrome.storage.local` allows ~10 MB per extension by default (more with `unlimitedStorage`). The vault is capped at 500 items in `VaultService.save()` as a soft guard; pro tier should call a future `pruneToLimit(unlimited)` path. Per-item size is not capped — a single very long conversation can exceed quota. A future migration will introduce per-turn chunking; today the failure is surfaced as `STORAGE_WRITE` and shown in the popup.

## Versioning & Migrations

- The current version is `CURRENT_VERSION` in `src/storage/schema.ts`.
- Each write tags data with `CURRENT_VERSION`.
- Each read runs `migrations[fromVersion]` repeatedly until the value reaches `CURRENT_VERSION`. Migrations are **forward-only** and pure functions: `(key, Versioned<unknown>) → Versioned<unknown>`.
- When you bump the version, add the new migration to `src/storage/migrations/index.ts`. Never modify an existing migration; treat them as append-only history.
- Schemas live in `src/storage/schema.ts` and are validated with zod on **both** read and write. Invalid data is moved to `quarantine:*` rather than dropped, so users can recover or report it.

### Adding a new namespace

1. Add the key + zod schema to `schemas` in `src/storage/schema.ts`.
2. The `NamespaceKey`/`DataMap` types update automatically.
3. Use `gateway.read(key)` / `gateway.write(key, data)` — the gateway will refuse anything not in the schema map.

### Bumping the version

1. Increment `CURRENT_VERSION`.
2. Update the zod schema for any affected namespace.
3. Add a migration entry: `migrations[OLD_VERSION] = (key, v) => ({ __v: OLD_VERSION + 1, data: transform(v.data) })`.
4. Add a round-trip test in `extension/tests/storage.test.ts`.

## Privacy

All data stays in `chrome.storage.local`. The extension makes **zero network requests**. There is no telemetry, no remote sync, and no third-party SDK. If a future version adds sync, it must:

- be opt-in via `settings:user`,
- write through `StorageGateway` (no direct `chrome.storage` calls),
- and document the new network surface in this file.
