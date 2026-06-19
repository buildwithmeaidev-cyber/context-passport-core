import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ContextPassport AI — work continuity across ChatGPT, Claude, Gemini, Perplexity" },
      {
        name: "description",
        content:
          "Move between AI systems without rebuilding context. ContextPassport captures the goals, decisions, constraints, progress, open questions, and next actions of a project — and re-establishes them in any AI tab. Local-only Chrome extension.",
      },
      { property: "og:title", content: "ContextPassport AI — AI Work Continuity" },
      {
        property: "og:description",
        content: "Carry project context across ChatGPT, Claude, Gemini, and Perplexity. Local-only Chrome extension.",
      },
    ],
  }),
  component: Index,
});

const FACETS = [
  { label: "Goals", body: "What you're trying to accomplish." },
  { label: "Decisions", body: "Architectural and design choices you've already made." },
  { label: "Constraints", body: "Hard limits — must / must-not." },
  { label: "Progress", body: "What's done so you don't redo it." },
  { label: "Open Questions", body: "What's unresolved." },
  { label: "Next Actions", body: "The concrete next steps." },
];

function Index() {
  const [status, setStatus] = useState<string>("");

  const download = () => {
    setStatus("Preparing download…");
    fetch("/contextpassport.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "contextpassport.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus("Downloaded. Unzip the file, then follow the install steps below.");
      })
      .catch((err: Error) => setStatus(err.message));
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e7eaee]">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#8a93a0]">
            AI Work Continuity · Chrome extension · Local-only
          </p>
          <h1 className="mb-4 text-4xl font-semibold leading-tight">ContextPassport AI</h1>
          <p className="text-lg text-[#b6bcc6]">
            Move between ChatGPT, Claude, Gemini, and Perplexity without rebuilding project context.
            Stop re-explaining goals. Stop losing decisions to a closed tab. Stop starting over.
          </p>
        </header>

        <section className="mb-12 rounded-lg border border-[#24292f] bg-[#15181d] p-6">
          <button
            onClick={download}
            className="w-full rounded-md bg-[#4f8cff] px-4 py-3 text-base font-medium text-white transition hover:bg-[#3b78ee]"
          >
            Download extension (.zip)
          </button>
          {status && <p className="mt-3 text-sm text-[#8a93a0]">{status}</p>}
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">What it preserves</h2>
          <p className="mb-4 text-[#b6bcc6]">
            Not conversation transcripts. The six things you actually need to keep working:
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {FACETS.map((f) => (
              <li
                key={f.label}
                className="rounded-md border border-[#24292f] bg-[#15181d] p-4"
              >
                <p className="text-sm font-medium">{f.label}</p>
                <p className="mt-1 text-sm text-[#8a93a0]">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">How it works</h2>
          <ol className="space-y-3 text-[#b6bcc6]">
            <li>
              <strong className="text-[#e7eaee]">1. Capture.</strong> One click on any supported AI page extracts the visible conversation and merges six structured facets into your active project's passport.
            </li>
            <li>
              <strong className="text-[#e7eaee]">2. Curate (optional).</strong> Open the manager to pin items you don't want lost, dismiss false positives, or add facts manually.
            </li>
            <li>
              <strong className="text-[#e7eaee]">3. Render & inject.</strong> Switch to a different AI. Pick a continuity mode (Brief / Essential / Full / Pro Handoff). The passport becomes a prompt; one click drops it into the composer.
            </li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Install in Chrome</h2>
          <ol className="space-y-2 text-[#b6bcc6]">
            <li>1. Unzip the downloaded file.</li>
            <li>2. Open <code className="rounded bg-[#15181d] px-1.5 py-0.5 text-sm">chrome://extensions</code> in Chrome (or any Chromium browser).</li>
            <li>3. Enable <strong>Developer mode</strong> (top-right toggle).</li>
            <li>4. Click <strong>Load unpacked</strong> and select the unzipped folder.</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Built for continuity, not flash</h2>
          <p className="mb-3 text-[#b6bcc6]">
            Strict TypeScript, feature-based folders, DI container, provider adapter contract,
            pluggable facet extractor and render-strategy registries, versioned storage with
            forward-only migrations, license + feature-flag layer. Reliability over feature count.
          </p>
          <p className="text-sm text-[#8a93a0]">
            See <code>extension/docs/ARCHITECTURE.md</code>, <code>STORAGE_SCHEMA.md</code>,
            <code>UPDATE_STRATEGY.md</code>, <code>CODE_PROTECTION.md</code>.
          </p>
        </section>

        <footer className="border-t border-[#24292f] pt-6 text-sm text-[#8a93a0]">
          v0.2.0 · Manifest V3 · No backend · No telemetry · ChatGPT · Claude · Gemini · Perplexity
        </footer>
      </main>
    </div>
  );
}
