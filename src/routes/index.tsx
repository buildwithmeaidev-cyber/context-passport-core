import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ContextPassport AI — carry context between ChatGPT, Claude, and Gemini" },
      {
        name: "description",
        content:
          "Local-first Chrome extension that captures conversations from one AI, compresses them, and injects them into another. No accounts, no cloud, no API keys.",
      },
      { property: "og:title", content: "ContextPassport AI" },
      {
        property: "og:description",
        content: "Carry context between ChatGPT, Claude, and Gemini. Local-only Chrome extension.",
      },
    ],
  }),
  component: Index,
});

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
            Chrome extension · Local-only
          </p>
          <h1 className="mb-4 text-4xl font-semibold leading-tight">
            ContextPassport AI
          </h1>
          <p className="text-lg text-[#b6bcc6]">
            Capture a conversation from ChatGPT, Claude, or Gemini. Compress it locally.
            Inject it into a different AI — without copy-pasting or sending your data anywhere.
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
          <h2 className="mb-4 text-xl font-semibold">Install in Chrome</h2>
          <ol className="space-y-2 text-[#b6bcc6]">
            <li>1. Unzip the downloaded file.</li>
            <li>
              2. Open <code className="rounded bg-[#15181d] px-1.5 py-0.5 text-sm">chrome://extensions</code> in Chrome (or any Chromium browser).
            </li>
            <li>3. Enable <strong>Developer mode</strong> (top-right toggle).</li>
            <li>4. Click <strong>Load unpacked</strong> and select the unzipped folder.</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">What it does</h2>
          <ul className="space-y-3 text-[#b6bcc6]">
            <li>· Captures the visible conversation from ChatGPT, Claude, or Gemini.</li>
            <li>· Stores it in a versioned local vault (chrome.storage, never the cloud).</li>
            <li>· Compresses with four local modes: none, dedupe, summarize, aggressive.</li>
            <li>· Injects the result into the composer of whichever AI tab is active.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Built for maintainability</h2>
          <p className="mb-3 text-[#b6bcc6]">
            Strict TypeScript, feature-based folders, DI container, provider adapter contract,
            pluggable compression strategy registry, versioned storage with forward-only migrations,
            and a license/feature-flag layer so pricing changes never touch feature code.
          </p>
          <p className="text-sm text-[#8a93a0]">
            See <code>extension/docs/ARCHITECTURE.md</code>, <code>STORAGE_SCHEMA.md</code>,
            and <code>UPDATE_STRATEGY.md</code>.
          </p>
        </section>

        <footer className="border-t border-[#24292f] pt-6 text-sm text-[#8a93a0]">
          v0.1.0 · Manifest V3 · No backend · No telemetry
        </footer>
      </main>
    </div>
  );
}
