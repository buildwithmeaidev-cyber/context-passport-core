import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ContextPassport AI — work continuity across ChatGPT, Claude, Gemini, Perplexity" },
      {
        name: "description",
        content:
          "Move between AI systems without rebuilding context. ContextPassport extracts the goals, decisions, constraints, progress, open questions, and next actions of a project — and re-establishes them in any AI tab. Local-only Chrome extension.",
      },
      { property: "og:title", content: "ContextPassport AI — AI Work Continuity" },
      {
        property: "og:description",
        content:
          "Carry project context across ChatGPT, Claude, Gemini, and Perplexity. Local-only Chrome extension.",
      },
    ],
  }),
  component: Index,
});

const FACETS: Array<{ k: string; label: string; body: string }> = [
  { k: "01", label: "Goals", body: "What you're trying to accomplish." },
  { k: "02", label: "Decisions", body: "Architecture and design choices already made." },
  { k: "03", label: "Constraints", body: "Hard limits — must and must-not." },
  { k: "04", label: "Progress", body: "What's done so you don't redo it." },
  { k: "05", label: "Open Questions", body: "What's still unresolved." },
  { k: "06", label: "Next Actions", body: "The concrete next steps." },
];

const PROVIDERS = ["ChatGPT", "Claude", "Gemini", "Perplexity"];
const MODES = [
  { name: "Quick", desc: "One-paragraph status." },
  { name: "Balanced", desc: "All six facets, trimmed." },
  { name: "Developer", desc: "Stack, APIs, bugs, TODOs.", pro: true },
  { name: "Research", desc: "Findings, sources, contradictions.", pro: true },
  { name: "Founder", desc: "Problem, market, risks.", pro: true },
];

type Status = { kind: "idle" | "loading" | "success" | "error"; msg?: string };

function Index() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const download = async () => {
    setStatus({ kind: "loading", msg: "Preparing download…" });
    try {
      const res = await fetch("/contextpassport.zip");
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "contextpassport.zip";
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus({ kind: "success", msg: "Downloaded — unzip, then load it in chrome://extensions." });
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : "Download failed" });
    }
  };

  const copyInstall = async () => {
    await navigator.clipboard.writeText("chrome://extensions");
    setCopied(true);
  };

  return (
    <div className="cp-root min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        {/* Header */}
        <header className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <span className="cp-dot" aria-hidden />
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              AI Work Continuity · v0.3.0
            </p>
          </div>
          <h1 className="text-balance text-[44px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[56px]">
            Carry project context
            <br />
            <span className="text-muted">across every AI you use.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
            ContextPassport extracts the structured shape of your project — goals, decisions,
            constraints, progress, open questions, next actions — and re-establishes it in any AI
            tab. Local-only. No backend. No telemetry.
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={download}
              disabled={status.kind === "loading"}
              className="cp-btn-primary group"
            >
              {status.kind === "loading" ? (
                <span className="cp-spinner" aria-hidden />
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span>Download extension</span>
              <kbd className="cp-kbd">.zip</kbd>
            </button>
            <button onClick={copyInstall} className="cp-btn-ghost" title="Copy chrome://extensions">
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8.5L6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="4.5" y="4.5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M3 11V3.5A1.5 1.5 0 014.5 2H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Copy install URL
                </>
              )}
            </button>
          </div>

          {/* Status line */}
          <div className="mt-3 min-h-[20px] text-[13px]" aria-live="polite">
            {status.kind === "loading" && <span className="text-muted">{status.msg}</span>}
            {status.kind === "success" && <span className="text-success">✓ {status.msg}</span>}
            {status.kind === "error" && <span className="text-danger">{status.msg}</span>}
          </div>
        </header>

        {/* Providers strip */}
        <section className="mb-20">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            Works in
          </p>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((p) => (
              <span key={p} className="cp-chip">
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* What it preserves */}
        <section className="mb-20">
          <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.015em]">
            What it preserves
          </h2>
          <p className="mb-8 text-[14px] text-muted">
            Six structured facets, not transcripts. Extracted locally with confidence scoring.
          </p>
          <ul className="grid gap-px overflow-hidden rounded-lg border border-cpborder bg-cpborder sm:grid-cols-2">
            {FACETS.map((f) => (
              <li key={f.label} className="cp-cell group">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[14px] font-medium tracking-tight">{f.label}</p>
                  <span className="font-mono text-[10px] text-muted">{f.k}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Modes */}
        <section className="mb-20">
          <h2 className="mb-2 text-[22px] font-semibold tracking-[-0.015em]">Render modes</h2>
          <p className="mb-8 text-[14px] text-muted">
            One passport. Five projections, tuned for the conversation type.
          </p>
          <ul className="overflow-hidden rounded-lg border border-cpborder">
            {MODES.map((m, i) => (
              <li
                key={m.name}
                className={`cp-row ${i !== MODES.length - 1 ? "border-b border-cpborder" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-muted">0{i + 1}</span>
                  <span className="text-[14px] font-medium">{m.name}</span>
                  {m.pro && <span className="cp-chip-gold">Pro</span>}
                </div>
                <span className="text-[13px] text-muted">{m.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="mb-20">
          <h2 className="mb-8 text-[22px] font-semibold tracking-[-0.015em]">How it works</h2>
          <ol className="space-y-6">
            {[
              ["Capture", "One click on any supported AI page extracts the visible conversation and merges six structured facets into your active project's passport."],
              ["Curate", "Pin items you can't lose. Dismiss false positives. Add facts manually. The Context Health score (0–100) tells you what's missing."],
              ["Render & inject", "Switch tabs. Pick a mode. The passport becomes a provider-tuned prompt and drops into the composer."],
            ].map(([t, body], i) => (
              <li key={t} className="grid grid-cols-[28px_1fr] gap-4">
                <span className="mt-0.5 font-mono text-[12px] text-muted">0{i + 1}</span>
                <div>
                  <p className="text-[14px] font-medium tracking-tight">{t}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Install */}
        <section className="mb-20">
          <h2 className="mb-8 text-[22px] font-semibold tracking-[-0.015em]">Install in Chrome</h2>
          <ol className="cp-install">
            <li>
              <span className="cp-step">1</span>
              <span>Unzip the downloaded file.</span>
            </li>
            <li>
              <span className="cp-step">2</span>
              <span>
                Open <code className="cp-code">chrome://extensions</code>
              </span>
            </li>
            <li>
              <span className="cp-step">3</span>
              <span>
                Toggle <strong className="text-fg">Developer mode</strong> (top right).
              </span>
            </li>
            <li>
              <span className="cp-step">4</span>
              <span>
                Click <strong className="text-fg">Load unpacked</strong> and pick the unzipped folder.
              </span>
            </li>
          </ol>
        </section>

        {/* Footer */}
        <footer className="border-t border-cpborder pt-8 text-[12px] text-muted">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Manifest V3 · Local-only · No backend · No telemetry</span>
            <span className="font-mono">v0.3.0</span>
          </div>
        </footer>
      </div>

      <style>{`
        .cp-root {
          --cp-bg: #0f0f11;
          --cp-surface: #17171c;
          --cp-card: #1d1d23;
          --cp-border: #2c2c34;
          --cp-fg: #ededf0;
          --cp-muted: #8b8b95;
          --cp-primary: #6366f1;
          --cp-success: #10b981;
          --cp-gold: #eab308;
          --cp-danger: #f43f5e;
          background: var(--cp-bg);
          color: var(--cp-fg);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          font-feature-settings: 'cv11', 'ss01', 'ss03';
          -webkit-font-smoothing: antialiased;
          letter-spacing: -0.005em;
        }
        .cp-root .text-muted { color: var(--cp-muted); }
        .cp-root .text-fg { color: var(--cp-fg); }
        .cp-root .text-success { color: var(--cp-success); }
        .cp-root .text-danger { color: var(--cp-danger); }
        .cp-root .border-cpborder { border-color: var(--cp-border); }
        .cp-root .bg-cpborder { background: var(--cp-border); }

        .cp-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--cp-success);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--cp-success) 18%, transparent);
        }

        .cp-btn-primary, .cp-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          height: 36px; padding: 0 14px;
          border-radius: 8px;
          font-size: 13px; font-weight: 500;
          letter-spacing: -0.005em;
          transition: background 160ms ease, border-color 160ms ease, transform 120ms ease, color 160ms ease;
          cursor: pointer;
        }
        .cp-btn-primary:active, .cp-btn-ghost:active { transform: translateY(0.5px); }
        .cp-btn-primary {
          background: var(--cp-primary); color: white;
          border: 1px solid color-mix(in oklab, var(--cp-primary) 80%, white 20%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .cp-btn-primary:hover { background: color-mix(in oklab, var(--cp-primary) 88%, white 12%); }
        .cp-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .cp-btn-ghost {
          background: var(--cp-surface);
          color: var(--cp-fg);
          border: 1px solid var(--cp-border);
        }
        .cp-btn-ghost:hover { background: var(--cp-card); border-color: #3a3a44; }

        .cp-kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10.5px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
          letter-spacing: 0;
        }

        .cp-spinner {
          width: 12px; height: 12px;
          border: 1.5px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: cp-spin 600ms linear infinite;
        }
        @keyframes cp-spin { to { transform: rotate(360deg); } }

        .cp-chip {
          display: inline-flex; align-items: center;
          height: 26px; padding: 0 10px;
          background: var(--cp-surface);
          border: 1px solid var(--cp-border);
          border-radius: 6px;
          font-size: 12px; color: var(--cp-fg);
          letter-spacing: -0.003em;
        }
        .cp-chip-gold {
          display: inline-flex; align-items: center;
          height: 18px; padding: 0 6px;
          border-radius: 4px;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          background: color-mix(in oklab, var(--cp-gold) 14%, transparent);
          color: var(--cp-gold);
          border: 1px solid color-mix(in oklab, var(--cp-gold) 28%, transparent);
        }

        .cp-cell {
          background: var(--cp-bg);
          padding: 18px 18px 20px;
          transition: background 160ms ease;
        }
        .cp-cell:hover { background: var(--cp-surface); }

        .cp-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          background: var(--cp-bg);
          transition: background 160ms ease;
        }
        .cp-row:hover { background: var(--cp-surface); }

        .cp-install { list-style: none; padding: 0; margin: 0; }
        .cp-install li {
          display: grid; grid-template-columns: 28px 1fr; gap: 14px;
          padding: 12px 0;
          border-bottom: 1px solid var(--cp-border);
          font-size: 13.5px; color: var(--cp-muted);
          align-items: center;
        }
        .cp-install li:last-child { border-bottom: 0; }
        .cp-step {
          display: inline-flex; align-items: center; justify-content: center;
          width: 24px; height: 24px;
          border-radius: 6px;
          background: var(--cp-surface);
          border: 1px solid var(--cp-border);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px; color: var(--cp-fg);
        }
        .cp-code {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          padding: 2px 6px;
          background: var(--cp-surface);
          border: 1px solid var(--cp-border);
          border-radius: 4px;
          color: var(--cp-fg);
        }

        .text-balance { text-wrap: balance; }
      `}</style>
    </div>
  );
}
