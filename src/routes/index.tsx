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

const FACETS: Array<{ k: string; label: string; body: string; sample: string }> = [
  { k: "01", label: "Goals", body: "What you're trying to accomplish.", sample: "Ship v1 of ContextPassport to 100 users." },
  { k: "02", label: "Decisions", body: "Architecture and design choices already made.", sample: "DI container · Manifest V3 · local-only storage." },
  { k: "03", label: "Constraints", body: "Hard limits — must and must-not.", sample: "No backend. No telemetry. < 200ms interactions." },
  { k: "04", label: "Progress", body: "What's done so you don't redo it.", sample: "Provider adapters: ChatGPT, Claude, Gemini, Perplexity." },
  { k: "05", label: "Open Questions", body: "What's still unresolved.", sample: "Pricing tier for Founder Handoff mode?" },
  { k: "06", label: "Next Actions", body: "The concrete next steps.", sample: "Wire health score into popup. Ship v0.3.0." },
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
      {/* Top nav */}
      <nav className="cp-nav">
        <div className="cp-nav-inner">
          <div className="flex items-center gap-2.5">
            <span className="cp-logo" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.01em]">ContextPassport</span>
            <span className="cp-version">v0.3.0</span>
          </div>
          <div className="flex items-center gap-1">
            <a href="#facets" className="cp-nav-link">Facets</a>
            <a href="#modes" className="cp-nav-link">Modes</a>
            <a href="#install" className="cp-nav-link">Install</a>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[680px] px-6 pt-16 sm:pt-24">
        {/* Hero */}
        <header className="mb-20">
          <div className="mb-7 flex items-center gap-2">
            <span className="cp-dot" aria-hidden />
            <p className="cp-eyebrow">AI Work Continuity Platform</p>
          </div>
          <h1 className="cp-h1">
            Carry project context
            <br />
            <span className="text-muted">across every AI you use.</span>
          </h1>
          <p className="cp-lede">
            ContextPassport extracts the structured shape of your project — goals, decisions,
            constraints, progress, open questions, next actions — and re-establishes it in any AI
            tab. Local-only. No backend. No telemetry.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-2">
            <button
              onClick={download}
              disabled={status.kind === "loading"}
              className="cp-btn-primary"
            >
              {status.kind === "loading" ? (
                <span className="cp-spinner" aria-hidden />
              ) : (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span>Download extension</span>
              <span className="cp-kbd">.zip</span>
            </button>
            <button onClick={copyInstall} className="cp-btn-ghost" title="Copy chrome://extensions">
              {copied ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8.5L6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <rect x="4.5" y="4.5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M3 11V3.5A1.5 1.5 0 014.5 2H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Copy install URL
                </>
              )}
            </button>
          </div>

          <div className="mt-3 min-h-[18px] text-[12.5px]" aria-live="polite">
            {status.kind === "loading" && <span className="text-muted">{status.msg}</span>}
            {status.kind === "success" && <span className="text-success">✓ {status.msg}</span>}
            {status.kind === "error" && <span className="text-danger">{status.msg}</span>}
          </div>
        </header>

        {/* Passport preview — visual proof */}
        <SectionLabel index="00" title="A rendered passport" />
        <div className="cp-passport mb-24">
          <div className="cp-passport-head">
            <div className="flex items-center gap-2">
              <span className="cp-passport-dot" />
              <span className="cp-passport-dot" style={{ background: "#eab308" }} />
              <span className="cp-passport-dot" style={{ background: "#10b981" }} />
            </div>
            <span className="font-mono text-[10.5px] text-muted">
              passport.md · 412 tokens
            </span>
            <span className="cp-badge-inline">balanced</span>
          </div>
          <div className="cp-passport-body">
            <p className="cp-passport-line"><span className="cp-passport-key">## Project</span> ContextPassport AI</p>
            <p className="cp-passport-line"><span className="cp-passport-comment"># 6 facets · health 84/100 · 4 providers</span></p>
            <div className="h-3" />
            {FACETS.map((f) => (
              <div key={f.k} className="cp-passport-row">
                <span className="cp-passport-key">{f.label.toLowerCase().replace(/\s/g, "_")}:</span>
                <span className="cp-passport-val">{f.sample}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What it preserves */}
        <section id="facets" className="mb-24 scroll-mt-24">
          <SectionLabel index="01" title="What it preserves" />
          <p className="cp-section-lede">
            Six structured facets, not transcripts. Extracted locally with confidence scoring.
          </p>
          <ul className="cp-grid">
            {FACETS.map((f) => (
              <li key={f.label} className="cp-cell">
                <span className="cp-cell-num">{f.k}</span>
                <p className="cp-cell-title">{f.label}</p>
                <p className="cp-cell-body">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Modes */}
        <section id="modes" className="mb-24 scroll-mt-24">
          <SectionLabel index="02" title="Render modes" />
          <p className="cp-section-lede">
            One passport. Five projections, tuned for the conversation type.
          </p>
          <ul className="cp-table">
            {MODES.map((m, i) => (
              <li key={m.name} className="cp-tr">
                <span className="cp-td-num">0{i + 1}</span>
                <span className="cp-td-name">
                  {m.name}
                  {m.pro && <span className="cp-chip-gold">Pro</span>}
                </span>
                <span className="cp-td-desc">{m.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Providers */}
        <section className="mb-24">
          <SectionLabel index="03" title="Works in" />
          <ul className="cp-providers">
            {PROVIDERS.map((p) => (
              <li key={p} className="cp-provider">
                <span className="cp-provider-mark" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="mb-24">
          <SectionLabel index="04" title="How it works" />
          <ol className="cp-steps">
            {[
              ["Capture", "One click on any supported AI page extracts the visible conversation and merges six structured facets into your active project's passport."],
              ["Curate", "Pin items you can't lose. Dismiss false positives. Add facts manually. The Context Health score (0–100) tells you what's missing."],
              ["Render & inject", "Switch tabs. Pick a mode. The passport becomes a provider-tuned prompt and drops into the composer."],
            ].map(([t, body], i) => (
              <li key={t} className="cp-step-row">
                <span className="cp-step-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="cp-step-title">{t}</p>
                  <p className="cp-step-body">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Install */}
        <section id="install" className="mb-24 scroll-mt-24">
          <SectionLabel index="05" title="Install in Chrome" />
          <ol className="cp-install">
            <li>
              <span className="cp-step-num">01</span>
              <span>Unzip the downloaded file.</span>
            </li>
            <li>
              <span className="cp-step-num">02</span>
              <span>
                Open <code className="cp-code">chrome://extensions</code>
              </span>
            </li>
            <li>
              <span className="cp-step-num">03</span>
              <span>
                Toggle <strong className="text-fg">Developer mode</strong> <span className="cp-kbd">top-right</span>
              </span>
            </li>
            <li>
              <span className="cp-step-num">04</span>
              <span>
                Click <strong className="text-fg">Load unpacked</strong> and pick the unzipped folder.
              </span>
            </li>
          </ol>
        </section>

        {/* Footer */}
        <footer className="cp-foot">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="cp-logo cp-logo-sm" aria-hidden>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-[12px] font-medium">ContextPassport</span>
            </div>
            <span className="font-mono text-[11px] text-muted">
              MV3 · LOCAL-ONLY · NO TELEMETRY
            </span>
          </div>
        </footer>
      </div>

      <style>{designStyles}</style>
    </div>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="cp-section-head">
      <span className="cp-section-num">{index}</span>
      <h2 className="cp-h2">{title}</h2>
      <span className="cp-section-rule" />
    </div>
  );
}

const designStyles = `
  .cp-root {
    --cp-bg: #0f0f11;
    --cp-bg-2: #131318;
    --cp-surface: #17171c;
    --cp-card: #1d1d23;
    --cp-border: #2c2c34;
    --cp-border-2: #3a3a44;
    --cp-fg: #ededf0;
    --cp-fg-2: #c4c4cc;
    --cp-muted: #74747f;
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
    background-image:
      radial-gradient(1200px 600px at 50% -100px, rgba(99,102,241,0.08), transparent 60%),
      linear-gradient(to bottom, rgba(255,255,255,0.012), transparent 200px);
  }
  .cp-root .text-muted { color: var(--cp-muted); }
  .cp-root .text-fg { color: var(--cp-fg); }
  .cp-root .text-success { color: var(--cp-success); }
  .cp-root .text-danger { color: var(--cp-danger); }

  /* === NAV === */
  .cp-nav {
    position: sticky; top: 0; z-index: 50;
    backdrop-filter: saturate(140%) blur(8px);
    background: color-mix(in oklab, var(--cp-bg) 78%, transparent);
    border-bottom: 1px solid var(--cp-border);
  }
  .cp-nav-inner {
    max-width: 680px; margin: 0 auto; padding: 12px 24px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .cp-logo {
    width: 22px; height: 22px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 6px;
    background: color-mix(in oklab, var(--cp-primary) 14%, transparent);
    color: var(--cp-primary);
    border: 1px solid color-mix(in oklab, var(--cp-primary) 30%, transparent);
  }
  .cp-logo-sm { width: 18px; height: 18px; border-radius: 5px; }
  .cp-version {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px; color: var(--cp-muted);
    padding: 2px 6px; border: 1px solid var(--cp-border); border-radius: 4px;
    margin-left: 4px;
  }
  .cp-nav-link {
    font-size: 12.5px; color: var(--cp-fg-2);
    padding: 6px 10px; border-radius: 6px;
    transition: color 160ms ease, background 160ms ease;
  }
  .cp-nav-link:hover { color: var(--cp-fg); background: var(--cp-surface); }

  /* === HERO === */
  .cp-eyebrow {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px; font-weight: 500;
    color: var(--cp-muted);
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }
  .cp-h1 {
    font-size: 48px; line-height: 1.04;
    letter-spacing: -0.028em;
    font-weight: 600;
    text-wrap: balance;
  }
  @media (max-width: 640px) {
    .cp-h1 { font-size: 36px; letter-spacing: -0.025em; }
  }
  .cp-lede {
    margin-top: 22px;
    max-width: 560px;
    font-size: 15px; line-height: 1.6;
    color: var(--cp-fg-2);
  }
  .cp-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--cp-success);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--cp-success) 18%, transparent);
  }

  /* === BUTTONS === */
  .cp-btn-primary, .cp-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    height: 36px; padding: 0 14px;
    border-radius: 8px;
    font-size: 13px; font-weight: 500;
    letter-spacing: -0.005em;
    transition: background 160ms ease, border-color 160ms ease, transform 120ms ease, color 160ms ease;
    cursor: pointer;
  }
  .cp-btn-primary {
    background: var(--cp-primary); color: white;
    border: 1px solid color-mix(in oklab, var(--cp-primary) 70%, white 25%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
  }
  .cp-btn-primary:hover { background: color-mix(in oklab, var(--cp-primary) 88%, white 12%); }
  .cp-btn-primary:active { transform: translateY(0.5px); }
  .cp-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
  .cp-btn-ghost {
    background: var(--cp-surface);
    color: var(--cp-fg);
    border: 1px solid var(--cp-border);
  }
  .cp-btn-ghost:hover { background: var(--cp-card); border-color: var(--cp-border-2); }
  .cp-btn-ghost:active { transform: translateY(0.5px); }

  .cp-kbd {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 4px;
    background: rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.85);
    border: 1px solid rgba(255,255,255,0.06);
    letter-spacing: 0;
    line-height: 1;
  }
  .cp-btn-ghost .cp-kbd {
    background: var(--cp-card); color: var(--cp-muted);
    border-color: var(--cp-border);
  }

  .cp-spinner {
    width: 12px; height: 12px;
    border: 1.5px solid rgba(255,255,255,0.35);
    border-top-color: white;
    border-radius: 50%;
    animation: cp-spin 600ms linear infinite;
  }
  @keyframes cp-spin { to { transform: rotate(360deg); } }

  /* === SECTION HEAD === */
  .cp-section-head {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 6px;
  }
  .cp-section-num {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px; color: var(--cp-muted);
    padding: 2px 6px;
    border: 1px solid var(--cp-border);
    border-radius: 4px;
    letter-spacing: 0.04em;
  }
  .cp-h2 {
    font-size: 18px; font-weight: 600;
    letter-spacing: -0.018em;
  }
  .cp-section-rule {
    flex: 1; height: 1px;
    background: linear-gradient(to right, var(--cp-border), transparent);
  }
  .cp-section-lede {
    margin: 6px 0 24px;
    font-size: 13.5px; color: var(--cp-muted);
    max-width: 480px;
  }

  /* === PASSPORT PREVIEW === */
  .cp-passport {
    margin-top: 18px;
    border: 1px solid var(--cp-border);
    border-radius: 12px;
    background: var(--cp-bg-2);
    overflow: hidden;
    box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 40px -12px rgba(0,0,0,0.6);
  }
  .cp-passport-head {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    background: var(--cp-surface);
    border-bottom: 1px solid var(--cp-border);
  }
  .cp-passport-head > :nth-child(2) { flex: 1; text-align: center; }
  .cp-passport-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #f43f5e;
    opacity: 0.85;
  }
  .cp-badge-inline {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px; font-weight: 500;
    padding: 2px 7px;
    border-radius: 4px;
    background: color-mix(in oklab, var(--cp-primary) 16%, transparent);
    color: var(--cp-primary);
    border: 1px solid color-mix(in oklab, var(--cp-primary) 32%, transparent);
    text-transform: lowercase;
  }
  .cp-passport-body {
    padding: 18px 20px 20px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px; line-height: 1.7;
  }
  .cp-passport-line { margin: 0; }
  .cp-passport-key { color: var(--cp-primary); font-weight: 500; }
  .cp-passport-val { color: var(--cp-fg-2); margin-left: 6px; }
  .cp-passport-comment { color: var(--cp-muted); }
  .cp-passport-row {
    display: grid; grid-template-columns: 130px 1fr; gap: 12px;
    padding: 4px 0;
    border-bottom: 1px dashed color-mix(in oklab, var(--cp-border) 70%, transparent);
  }
  .cp-passport-row:last-child { border-bottom: 0; }

  /* === GRID / CELLS === */
  .cp-grid {
    list-style: none; padding: 0; margin: 0;
    display: grid; grid-template-columns: 1fr;
    gap: 1px;
    background: var(--cp-border);
    border: 1px solid var(--cp-border);
    border-radius: 10px;
    overflow: hidden;
  }
  @media (min-width: 640px) {
    .cp-grid { grid-template-columns: 1fr 1fr; }
  }
  .cp-cell {
    background: var(--cp-bg);
    padding: 18px 18px 20px;
    transition: background 160ms ease;
    position: relative;
  }
  .cp-cell:hover { background: var(--cp-surface); }
  .cp-cell-num {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px; color: var(--cp-muted);
    letter-spacing: 0.04em;
  }
  .cp-cell-title {
    margin: 4px 0 0; font-size: 14px; font-weight: 500;
    letter-spacing: -0.012em;
  }
  .cp-cell-body {
    margin: 4px 0 0; font-size: 12.5px; color: var(--cp-muted);
    line-height: 1.55;
  }

  /* === TABLE (modes) === */
  .cp-table {
    list-style: none; padding: 0; margin: 0;
    border: 1px solid var(--cp-border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--cp-bg);
  }
  .cp-tr {
    display: grid;
    grid-template-columns: 36px minmax(120px, 1fr) 2fr;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--cp-border);
    transition: background 160ms ease;
  }
  .cp-tr:last-child { border-bottom: 0; }
  .cp-tr:hover { background: var(--cp-surface); }
  .cp-td-num {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px; color: var(--cp-muted);
  }
  .cp-td-name {
    font-size: 13.5px; font-weight: 500;
    display: inline-flex; align-items: center; gap: 8px;
    letter-spacing: -0.01em;
  }
  .cp-td-desc { font-size: 12.5px; color: var(--cp-muted); }
  .cp-chip-gold {
    display: inline-flex; align-items: center;
    height: 17px; padding: 0 6px;
    border-radius: 4px;
    font-size: 9.5px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
    background: color-mix(in oklab, var(--cp-gold) 14%, transparent);
    color: var(--cp-gold);
    border: 1px solid color-mix(in oklab, var(--cp-gold) 32%, transparent);
  }

  /* === PROVIDERS === */
  .cp-providers {
    list-style: none; padding: 0; margin: 18px 0 0;
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  }
  @media (min-width: 640px) {
    .cp-providers { grid-template-columns: repeat(4, 1fr); }
  }
  .cp-provider {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px;
    background: var(--cp-bg-2);
    border: 1px solid var(--cp-border);
    border-radius: 8px;
    font-size: 12.5px; font-weight: 500;
    transition: border-color 160ms ease, background 160ms ease;
  }
  .cp-provider:hover { border-color: var(--cp-border-2); background: var(--cp-surface); }
  .cp-provider-mark {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--cp-success);
    box-shadow: 0 0 0 2.5px color-mix(in oklab, var(--cp-success) 18%, transparent);
  }

  /* === STEPS === */
  .cp-steps { list-style: none; padding: 0; margin: 18px 0 0; }
  .cp-step-row {
    display: grid; grid-template-columns: 36px 1fr; gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid var(--cp-border);
    align-items: start;
  }
  .cp-step-row:last-child { border-bottom: 0; }
  .cp-step-num {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px; color: var(--cp-muted);
    padding: 2px 6px;
    border: 1px solid var(--cp-border);
    border-radius: 4px;
    width: fit-content;
    letter-spacing: 0.04em;
  }
  .cp-step-title {
    margin: 0; font-size: 14px; font-weight: 500;
    letter-spacing: -0.012em;
  }
  .cp-step-body {
    margin: 4px 0 0; font-size: 12.5px;
    color: var(--cp-muted); line-height: 1.6;
  }

  /* === INSTALL === */
  .cp-install { list-style: none; padding: 0; margin: 18px 0 0; }
  .cp-install li {
    display: grid; grid-template-columns: 36px 1fr; gap: 14px;
    padding: 12px 0;
    border-bottom: 1px solid var(--cp-border);
    font-size: 13px; color: var(--cp-fg-2);
    align-items: center;
  }
  .cp-install li:last-child { border-bottom: 0; }
  .cp-code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
    padding: 1.5px 6px;
    background: var(--cp-card);
    border: 1px solid var(--cp-border);
    border-radius: 4px;
    color: var(--cp-fg);
  }

  /* === FOOTER === */
  .cp-foot {
    border-top: 1px solid var(--cp-border);
    padding: 24px 0 56px;
    color: var(--cp-muted);
    font-size: 12px;
  }
`;
