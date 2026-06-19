# Code Protection & Monetization

## The hard truth

Chrome extensions ship JavaScript that runs inside the user's browser. There is **no DRM**. A determined user can always:

- Unzip the `.crx` / sideloaded folder
- Open DevTools on the popup / options / content script
- Read the bundled JS

This applies to **every** Chrome extension, including Web Store paid ones. Anyone who tells you otherwise is selling snake oil.

What we can do is:
1. **Raise the cost of reverse engineering** with minification and mangling.
2. **Move anything that must stay secret off the user's machine** — i.e. behind an API you control.

## What's in the build today

Production builds (`node build.mjs`) run with:

- `minify: true` (whitespace + syntax)
- `minifyIdentifiers: true` (local variable names → `a`, `b`, ...)
- `mangleProps: /^_p$/` (any object property starting with `_p$` is renamed)
- `drop: ['console', 'debugger']` (logging stripped)
- `sourcemap: false`, `legalComments: "none"`

Result: a 140 KB strict-TS module becomes ~40–50 KB of unreadable mangled JS. Class shapes and string literals remain visible (they have to — they're used at runtime).

Dev builds (readable output for debugging) use `CP_BUILD=dev node build.mjs`.

### Naming convention for internals

Any class/object property that should be renamed by the property mangler must start with `_p$`. Public method names (like `extractConversation`, `injectPrompt`) are part of the `ProviderAdapter` contract and stay readable — they're called across module boundaries.

> If you add a private field you want mangled, name it `_p$myField`. Public API names are kept literal because they're part of the contract.

## The actual monetization seam

Because anything in the bundle can be unlocked, **client-only premium flags are honor-system at best**. The codebase has the right seam already:

- `LicenseService` is the only place feature gating is checked.
- Today it returns the `free` plan unconditionally.
- The "Pro" tier exists in `plans.ts` but is unreachable from the UI.

To **actually** monetize premium features, replace `LicenseService` with a server-backed implementation:

```ts
// services/license/RemoteLicenseService.ts (future)
export class RemoteLicenseService implements LicenseService {
  async plan() {
    const r = await fetch("https://your-api.example/license/verify", {
      headers: { Authorization: `Bearer ${await this.getToken()}` },
    });
    // ...
  }
}
```

And — critically — **move the premium logic itself** server-side. For example, the `aggressive` compression strategy could call your API instead of running locally:

```ts
// services/compression/strategies/aggressive-remote.ts (future)
async run(input) {
  return fetch("https://your-api.example/compress", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ turns: input.turns, mode: "aggressive" }),
  }).then(r => r.json());
}
```

Now an unlocked client gets a 401, not a free upgrade. The DI container + strategy registry mean swapping in the remote version is a one-file change.

### Summary

| Concern | Honest answer |
|---|---|
| Stop users reading the source | Impossible. Minify+mangle raises the cost but doesn't prevent it. |
| Stop users unlocking client-only premium flags | Impossible without a server. |
| Actually monetize | Put premium *logic* behind an API you control; verify a license token server-side. |

The architecture is wired for this — when you're ready to add a backend, replace `LicenseService` and add a remote strategy. Nothing else changes.
