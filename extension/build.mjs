// Build script for ContextPassport AI extension.
// Bundles TypeScript entry points to ESM and copies static assets into dist/.
import { build } from "esbuild";
import { cp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const isDev = process.env.CP_BUILD === "dev";

const common = {
  bundle: true,
  format: "esm",
  target: "es2022",
  platform: "browser",
  sourcemap: false,
  // Production: aggressive minification + identifier & property mangling.
  // Property mangling renames every JS property whose name starts with `_p$`
  // so non-API internals become unreadable (see naming convention in src/).
  minify: !isDev,
  minifyIdentifiers: !isDev,
  minifySyntax: !isDev,
  minifyWhitespace: !isDev,
  mangleProps: isDev ? undefined : /^_p\$/,
  legalComments: "none",
  drop: isDev ? [] : ["console", "debugger"],
  logLevel: "info",
  tsconfig: path.join(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
};


await Promise.all([
  build({ ...common, entryPoints: [path.join(root, "src/background/index.ts")], outfile: path.join(dist, "background.js") }),
  build({ ...common, entryPoints: [path.join(root, "src/content/index.ts")], outfile: path.join(dist, "content.js") }),
  build({ ...common, entryPoints: [path.join(root, "src/popup/main.ts")], outfile: path.join(dist, "popup.js") }),
  build({ ...common, entryPoints: [path.join(root, "src/options/main.ts")], outfile: path.join(dist, "options.js") }),
]);

await cp(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));
await cp(path.join(root, "src/popup/index.html"), path.join(dist, "popup.html"));
await cp(path.join(root, "src/options/index.html"), path.join(dist, "options.html"));
await cp(path.join(root, "src/ui/tokens.css"), path.join(dist, "tokens.css"));

// 1x1 transparent PNG placeholder icon if none exists
const iconSrc = path.join(root, "icon.png");
const iconDst = path.join(dist, "icon.png");
if (existsSync(iconSrc)) {
  await cp(iconSrc, iconDst);
} else {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
  );
  await writeFile(iconDst, png);
}

console.log("Built extension to", dist);
