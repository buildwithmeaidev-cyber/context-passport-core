import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ContextPassport — Continue Any AI Conversation Anywhere" },
      {
        name: "description",
        content:
          "Capture, compress, transfer, and continue work across ChatGPT, Claude, Gemini, and Perplexity without losing context. Local-only Chrome extension.",
      },
      { property: "og:title", content: "ContextPassport — Continue Any AI Conversation Anywhere" },
      {
        property: "og:description",
        content:
          "Capture, compress, transfer, and continue work across AI platforms without losing context.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

/* ------------------------------- data ------------------------------- */

const PAIN = [
  { k: "01", t: "Repeating yourself", b: "You re-explain the same project every time you open a new chat." },
  { k: "02", t: "Lost decisions", b: "Architecture and product choices vanish when the conversation rolls over." },
  { k: "03", t: "Context window limits", b: "Long threads drop the early context that mattered most." },
  { k: "04", t: "Research fragmentation", b: "Findings live in tabs you'll never reopen." },
  { k: "05", t: "Switching models", b: "Moving from Claude to GPT means starting over." },
  { k: "06", t: "Forgotten next steps", b: "You finish a session and lose the thread by morning." },
];

const FEATURES = [
  { k: "01", t: "Context Intelligence Engine", b: "Extracts goals, decisions, constraints, progress, open questions, blockers, next actions — not transcripts." },
  { k: "02", t: "Conversation type detection", b: "Auto-routes to Developer, Research, or Founder extraction. No setup." },
  { k: "03", t: "Structured handoff packages", b: "Five render modes, tuned per provider. Quick · Balanced · Developer · Research · Founder." },
  { k: "04", t: "Project Memory", b: "Persistent knowledge across sessions. Pin what matters; dismiss what doesn't." },
  { k: "05", t: "Context Health Score", b: "0–100 score with actionable recommendations. Know what your project is missing." },
  { k: "06", t: "Local-only, zero telemetry", b: "Captures live in your browser. No backend, no account, no tracking." },
];

const STEPS = [
  { t: "Capture", b: "One click on any ChatGPT, Claude, Gemini, or Perplexity tab extracts the visible conversation." },
  { t: "Compress", b: "The intelligence engine distills six to nine structured facets — not the whole transcript." },
  { t: "Transfer", b: "Open another AI. Pick a mode. The passport is injected as a provider-tuned prompt." },
  { t: "Continue", b: "The receiving AI treats the passport as ground truth and picks up where you left off." },
];

const PROVIDERS = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

const TESTIMONIALS = [
  { q: "I used to spend the first ten minutes of every Claude session re-pasting context from GPT. Now I don't.", a: "Maya R.", r: "Staff Engineer" },
  { q: "The Founder handoff mode is the only thing keeping my pitch deck coherent across four AI tools.", a: "Devon K.", r: "Solo founder" },
  { q: "Research mode caught a contradiction between two sources I'd already forgotten about. Worth it for that alone.", a: "Priya S.", r: "PhD candidate" },
];

const FAQS = [
  { q: "What is ContextPassport?", a: "A free Chrome extension that lets you move your AI conversations between ChatGPT, Claude, Gemini, and Perplexity — so you don't have to start over every time you switch tools." },
  { q: "Why would I need it?", a: "Long projects don't fit in one chat. You hit context limits, switch models, lose decisions, repeat yourself. ContextPassport keeps the project — goals, decisions, progress, next steps — so any AI can pick it up." },
  { q: "How does it work?", a: "Open any supported AI tab and click Capture. The extension reads what's on screen and saves a short, structured summary on your device. Open another AI, click Continue, and the summary is pasted in for you. That's it." },
  { q: "Is my data safe? Is anything uploaded?", a: "Nothing is uploaded — ever. Everything stays in your browser, on your device. There is no server that sees your conversations. You can verify in DevTools → Network: the extension makes zero outbound requests with your data." },
  { q: "What happens when I click Capture?", a: "The extension reads the conversation visible on the page, structures it into goals / decisions / progress / next actions, and saves it to your browser's local storage. No API calls. Nothing sent anywhere." },
  { q: "What happens when I click Continue?", a: "Your saved summary is formatted for the AI you're currently on and pasted into its message box. You review it, then press Send yourself. Nothing is sent automatically." },
  { q: "Why does the extension need permissions?", a: "‘Read AI websites’ lets it see the conversation on the page. ‘Storage’ lets it save summaries on your device. ‘Clipboard’ lets it paste the summary into the next AI. Nothing else. No tracking, no analytics." },
  { q: "Can I turn off storage or pasting?", a: "Yes. The popup's Privacy panel can disable local storage or copy/paste at any time. The options page has a one-click ‘Erase all local data’." },
  { q: "Which AI tools are supported?", a: "ChatGPT, Claude, Gemini, and Perplexity at launch. More are added as their pages stabilize." },
  { q: "What does Founder Lifetime include?", a: "Everything in Pro, forever, no recurring charge. Plus the Founder Handoff mode and early access to new providers." },
];

const PRIVACY_CARDS = [
  { i: "🔒", t: "Local-first", b: "Every conversation summary is stored on your device, in your browser. Nowhere else." },
  { i: "☁️", t: "No cloud storage", b: "Your conversations never pass through our servers. We don't have any." },
  { i: "👀", t: "No tracking", b: "No analytics, no telemetry, no account. We do not read, analyze, or sell your data." },
  { i: "🗑️", t: "Full control", b: "One-click erase all local data. Toggle off storage or paste at any time." },
];

const PERMISSIONS = [
  { t: "Read AI websites (activeTab + scripting)", b: "Needed to see the conversation on the page when you click Capture. Only runs on ChatGPT, Claude, Gemini, and Perplexity — and only when you trigger it." },
  { t: "Storage", b: "Needed to save your project summaries locally on this device. Uses chrome.storage.local, never the cloud." },
  { t: "Clipboard / page write", b: "Needed to paste a saved summary into the next AI's message box when you click Continue. You still review and press Send yourself." },
];

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    tag: "Start here",
    cta: "Download free",
    features: ["3 projects", "Quick & Balanced handoff modes", "All 4 AI providers", "Local-only storage"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    cadence: "/ month",
    tag: "For power users",
    cta: "Go Pro",
    features: ["Unlimited projects", "Developer & Research handoff", "Context Health Score", "Project Memory", "Priority provider updates"],
  },
  {
    id: "founder",
    name: "Founder",
    price: "$39",
    cadence: "lifetime",
    tag: "Best value",
    cta: "Claim Founder",
    highlight: true,
    features: [
      "Everything in Pro, forever",
      "Founder Handoff mode",
      "Early access to new providers",
      "Lifetime updates",
      "Founder badge in popup",
    ],
  },
];

const COMPARE: Array<{ row: string; free: string | boolean; pro: string | boolean; founder: string | boolean }> = [
  { row: "Projects", free: "3", pro: "Unlimited", founder: "Unlimited" },
  { row: "Captures per project", free: "20", pro: "Unlimited", founder: "Unlimited" },
  { row: "AI providers", free: "4", pro: "4", founder: "4 + early access" },
  { row: "Quick & Balanced modes", free: true, pro: true, founder: true },
  { row: "Developer Handoff", free: false, pro: true, founder: true },
  { row: "Research Handoff", free: false, pro: true, founder: true },
  { row: "Founder Handoff", free: false, pro: false, founder: true },
  { row: "Context Health Score", free: false, pro: true, founder: true },
  { row: "Project Memory", free: false, pro: true, founder: true },
  { row: "Lifetime updates", free: false, pro: false, founder: true },
  { row: "Recurring cost", free: "$0", pro: "$9 / mo", founder: "$0 after $39" },
];

const FACETS_SAMPLE = [
  { k: "goal", v: "Ship v1 of ContextPassport to 100 founders." },
  { k: "decision", v: "MV3 · DI container · local-only storage." },
  { k: "constraint", v: "No backend. No telemetry. < 200ms interactions." },
  { k: "progress", v: "Adapters for ChatGPT, Claude, Gemini, Perplexity ✓" },
  { k: "open_question", v: "Pricing for Founder Handoff mode?" },
  { k: "next_action", v: "Ship v0.3.0 to Product Hunt." },
];

type Status = { kind: "idle" | "loading" | "success" | "error"; msg?: string };

/* ------------------------------- page ------------------------------- */

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
      setStatus({ kind: "success", msg: "Downloaded — unzip, then load in chrome://extensions." });
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
      <nav className="cp-nav">
        <div className="cp-nav-inner">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[13px] font-semibold tracking-[-0.01em]">ContextPassport</span>
            <span className="cp-version">v0.3.0</span>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <a href="#problem" className="cp-nav-link">Problem</a>
            <a href="#features" className="cp-nav-link">Features</a>
            <a href="#workflow" className="cp-nav-link">Workflow</a>
            <a href="#privacy" className="cp-nav-link">Privacy</a>
            <a href="#pricing" className="cp-nav-link">Pricing</a>
            <a href="#faq" className="cp-nav-link">FAQ</a>
          </div>
          <button onClick={download} className="cp-btn-primary cp-btn-sm">
            Get extension
          </button>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <section className="cp-hero">
        <div className="cp-wrap">
          <div className="mb-6 flex items-center gap-2">
            <span className="cp-dot" aria-hidden />
            <p className="cp-eyebrow">AI Work Continuity Platform · v0.3.0</p>
          </div>
          <h1 className="cp-h1">
            Pick up where you left off —
            <br />
            <span className="text-muted">in any AI.</span>
          </h1>
          <p className="cp-lede">
            Move your conversations between ChatGPT, Claude, Gemini, and Perplexity without
            starting over. One click captures what matters — goals, decisions, progress, next
            steps — and pastes it into your next AI. Everything stays on your device.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
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
              <span>Add to Chrome — free</span>
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
            <a href="#pricing" className="cp-btn-ghost">See pricing</a>
          </div>

          <div className="mt-3 min-h-[18px] text-[12.5px]" aria-live="polite">
            {status.kind === "loading" && <span className="text-muted">{status.msg}</span>}
            {status.kind === "success" && <span className="text-success">✓ {status.msg}</span>}
            {status.kind === "error" && <span className="text-danger">{status.msg}</span>}
          </div>

          <ul className="cp-trust">
            <li><span className="cp-dot-mini" /> Local-only</li>
            <li><span className="cp-dot-mini" /> No account</li>
            <li><span className="cp-dot-mini" /> Manifest V3</li>
            <li><span className="cp-dot-mini" /> Works in 4 AIs</li>
          </ul>

          {/* Passport preview */}
          <div className="cp-passport mt-14">
            <div className="cp-passport-head">
              <div className="flex items-center gap-2">
                <span className="cp-passport-dot" />
                <span className="cp-passport-dot" style={{ background: "#eab308" }} />
                <span className="cp-passport-dot" style={{ background: "#10b981" }} />
              </div>
              <span className="font-mono text-[10.5px] text-muted">
                passport.md · 412 tokens · health 84/100
              </span>
              <span className="cp-badge-inline">balanced</span>
            </div>
            <div className="cp-passport-body">
              <p className="cp-passport-line"><span className="cp-passport-key">## Project</span> ContextPassport AI</p>
              <p className="cp-passport-line"><span className="cp-passport-comment"># Continuing from ChatGPT → Claude</span></p>
              <div className="h-3" />
              {FACETS_SAMPLE.map((f) => (
                <div key={f.k} className="cp-passport-row">
                  <span className="cp-passport-key">{f.k}:</span>
                  <span className="cp-passport-val">{f.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PROBLEM ===================== */}
      <section id="problem" className="cp-section scroll-mt-24">
        <div className="cp-wrap">
          <SectionLabel index="01" title="The problem with multi-AI work" />
          <p className="cp-section-lede">
            You don't have one AI workflow. You have six tabs. And every one of them starts from
            zero.
          </p>
          <ul className="cp-grid">
            {PAIN.map((p) => (
              <li key={p.k} className="cp-cell">
                <span className="cp-cell-num">{p.k}</span>
                <p className="cp-cell-title">{p.t}</p>
                <p className="cp-cell-body">{p.b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="cp-section scroll-mt-24">
        <div className="cp-wrap">
          <SectionLabel index="02" title="A context engine, not a clipboard" />
          <p className="cp-section-lede">
            ContextPassport is the first tool built specifically for cross-AI work continuity.
          </p>
          <ul className="cp-grid">
            {FEATURES.map((f) => (
              <li key={f.k} className="cp-cell">
                <span className="cp-cell-num">{f.k}</span>
                <p className="cp-cell-title">{f.t}</p>
                <p className="cp-cell-body">{f.b}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== WORKFLOW ===================== */}
      <section id="workflow" className="cp-section scroll-mt-24">
        <div className="cp-wrap">
          <SectionLabel index="03" title="The workflow" />
          <p className="cp-section-lede">
            Four steps. Under 30 seconds. Then your other AI knows what you were doing.
          </p>
          <ol className="cp-flow">
            {STEPS.map((s, i) => (
              <li key={s.t} className="cp-flow-row">
                <span className="cp-flow-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="cp-step-title">{s.t}</p>
                  <p className="cp-step-body">{s.b}</p>
                </div>
                {i < STEPS.length - 1 && <span className="cp-flow-arrow" aria-hidden>→</span>}
              </li>
            ))}
          </ol>

          <div className="mt-10">
            <p className="cp-eyebrow mb-3">Supported providers</p>
            <ul className="cp-providers">
              {PROVIDERS.map((p) => (
                <li key={p} className="cp-provider">
                  <span className="cp-provider-mark" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section className="cp-section">
        <div className="cp-wrap">
          <SectionLabel index="04" title="What early users say" />
          <ul className="cp-quotes">
            {TESTIMONIALS.map((t) => (
              <li key={t.a} className="cp-quote">
                <p className="cp-quote-text">“{t.q}”</p>
                <p className="cp-quote-attr">
                  <span className="text-fg">{t.a}</span>
                  <span className="text-muted"> · {t.r}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== PRIVACY ===================== */}
      <section id="privacy" className="cp-section scroll-mt-24">
        <div className="cp-wrap">
          <SectionLabel index="05" title="Your conversations stay yours" />
          <p className="cp-section-lede">
            Privacy isn't a footer link here. It's the whole design. Read this before you install.
          </p>
          <ul className="cp-grid">
            {PRIVACY_CARDS.map((c) => (
              <li key={c.t} className="cp-cell">
                <span className="cp-cell-num" aria-hidden>{c.i}</span>
                <p className="cp-cell-title">{c.t}</p>
                <p className="cp-cell-body">{c.b}</p>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <p className="cp-eyebrow mb-3">Permissions, explained</p>
            <ul className="cp-flow">
              {PERMISSIONS.map((p, i) => (
                <li key={p.t} className="cp-flow-row">
                  <span className="cp-flow-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="cp-step-title">{p.t}</p>
                    <p className="cp-step-body">{p.b}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="cp-section-lede mt-4">
              Don't take our word for it: open Chrome DevTools → Network while you use the
              extension. You'll see zero outbound requests carrying your conversations.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== PRICING ===================== */}
      <section id="pricing" className="cp-section scroll-mt-24">
        <div className="cp-wrap">
          <SectionLabel index="06" title="Pricing" />
          <p className="cp-section-lede">
            Use it free, forever. Or unlock the full intelligence engine.
          </p>
          <ul className="cp-plans">
            {PLANS.map((p) => (
              <li key={p.id} className={p.highlight ? "cp-plan cp-plan-gold" : "cp-plan"}>
                {p.highlight && <span className="cp-plan-ribbon">Best value · Limited</span>}
                <div className="cp-plan-head">
                  <p className="cp-plan-tag">{p.tag}</p>
                  <p className="cp-plan-name">{p.name}</p>
                  <p className="cp-plan-price">
                    <span className="cp-plan-amount">{p.price}</span>
                    <span className="cp-plan-cadence">{p.cadence}</span>
                  </p>
                </div>
                <ul className="cp-plan-features">
                  {p.features.map((f) => (
                    <li key={f}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M3 8.5L6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={download}
                  className={p.highlight ? "cp-btn-gold" : p.id === "pro" ? "cp-btn-primary cp-btn-full" : "cp-btn-ghost cp-btn-full"}
                >
                  {p.cta}
                </button>
              </li>
            ))}
          </ul>

          {/* Comparison table */}
          <div className="cp-compare">
            <div className="cp-compare-head">
              <span>Compare plans</span>
              <span>Free</span>
              <span>Pro</span>
              <span className="text-gold">Founder</span>
            </div>
            {COMPARE.map((r) => (
              <div key={r.row} className="cp-compare-row">
                <span className="cp-compare-label">{r.row}</span>
                <CompareCell v={r.free} />
                <CompareCell v={r.pro} />
                <CompareCell v={r.founder} gold />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section id="faq" className="cp-section scroll-mt-24">
        <div className="cp-wrap">
          <SectionLabel index="06" title="Frequently asked" />
          <ul className="cp-faq">
            {FAQS.map((f) => (
              <li key={f.q}>
                <details className="cp-faq-item">
                  <summary>
                    <span>{f.q}</span>
                    <span className="cp-faq-icon" aria-hidden>+</span>
                  </summary>
                  <p>{f.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="cp-section">
        <div className="cp-wrap">
          <div className="cp-cta">
            <p className="cp-eyebrow mb-4">Ready to stop starting over?</p>
            <h2 className="cp-cta-h">
              Continue any AI conversation, anywhere.
            </h2>
            <p className="cp-cta-sub">
              Install in 30 seconds. Works on every project. Free forever.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <button onClick={download} disabled={status.kind === "loading"} className="cp-btn-primary">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Add to Chrome — free
              </button>
              <a href="#pricing" className="cp-btn-gold cp-btn-inline">
                Claim Founder · $39 lifetime
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="cp-foot">
        <div className="cp-wrap flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Logo small />
            <span className="text-[12px] font-medium">ContextPassport</span>
          </div>
          <span className="font-mono text-[11px] text-muted">
            MV3 · LOCAL-ONLY · NO TELEMETRY
          </span>
        </div>
      </footer>

      <style>{designStyles}</style>
    </div>
  );
}

/* ------------------------------- bits ------------------------------- */

function Logo({ small = false }: { small?: boolean }) {
  const s = small ? 18 : 22;
  const ic = small ? 11 : 14;
  return (
    <span className={small ? "cp-logo cp-logo-sm" : "cp-logo"} style={{ width: s, height: s }} aria-hidden>
      <svg width={ic} height={ic} viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </span>
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

function CompareCell({ v, gold = false }: { v: string | boolean; gold?: boolean }) {
  if (v === true) {
    return (
      <span className={gold ? "cp-compare-check cp-compare-check-gold" : "cp-compare-check"}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 8.5L6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (v === false) return <span className="cp-compare-dash">—</span>;
  return <span className={gold ? "cp-compare-val text-gold" : "cp-compare-val"}>{v}</span>;
}

/* ------------------------------- styles ------------------------------- */

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
      radial-gradient(1200px 600px at 50% -200px, rgba(99,102,241,0.10), transparent 60%),
      radial-gradient(800px 400px at 100% 10%, rgba(234,179,8,0.04), transparent 60%);
  }
  .cp-root .text-muted { color: var(--cp-muted); }
  .cp-root .text-fg { color: var(--cp-fg); }
  .cp-root .text-gold { color: var(--cp-gold); }
  .cp-root .text-success { color: var(--cp-success); }
  .cp-root .text-danger { color: var(--cp-danger); }

  .cp-wrap { max-width: 1040px; margin: 0 auto; padding: 0 24px; }
  .cp-section { padding: 80px 0; border-top: 1px solid var(--cp-border); }
  .cp-hero { padding: 72px 0 32px; }
  @media (max-width: 640px) {
    .cp-section { padding: 56px 0; }
    .cp-hero { padding: 48px 0 24px; }
  }

  /* === NAV === */
  .cp-nav {
    position: sticky; top: 0; z-index: 50;
    backdrop-filter: saturate(140%) blur(10px);
    background: color-mix(in oklab, var(--cp-bg) 78%, transparent);
    border-bottom: 1px solid var(--cp-border);
  }
  .cp-nav-inner {
    max-width: 1040px; margin: 0 auto; padding: 12px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .cp-logo {
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 6px;
    background: color-mix(in oklab, var(--cp-primary) 14%, transparent);
    color: var(--cp-primary);
    border: 1px solid color-mix(in oklab, var(--cp-primary) 30%, transparent);
  }
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
    font-size: 60px; line-height: 1.02;
    letter-spacing: -0.032em;
    font-weight: 600;
    text-wrap: balance;
    max-width: 820px;
  }
  @media (max-width: 640px) {
    .cp-h1 { font-size: 38px; letter-spacing: -0.025em; }
  }
  .cp-lede {
    margin-top: 22px;
    max-width: 620px;
    font-size: 16px; line-height: 1.6;
    color: var(--cp-fg-2);
  }
  .cp-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--cp-success);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--cp-success) 18%, transparent);
  }
  .cp-dot-mini {
    width: 4px; height: 4px; border-radius: 50%;
    background: var(--cp-muted);
    display: inline-block;
  }
  .cp-trust {
    list-style: none; padding: 0; margin: 28px 0 0;
    display: flex; flex-wrap: wrap; gap: 14px;
    font-size: 12px; color: var(--cp-muted);
  }
  .cp-trust li { display: inline-flex; align-items: center; gap: 7px; }

  /* === BUTTONS === */
  .cp-btn-primary, .cp-btn-ghost, .cp-btn-gold {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    height: 36px; padding: 0 14px;
    border-radius: 8px;
    font-size: 13px; font-weight: 500;
    letter-spacing: -0.005em;
    transition: background 160ms ease, border-color 160ms ease, transform 120ms ease, color 160ms ease, box-shadow 160ms ease;
    cursor: pointer; white-space: nowrap;
  }
  .cp-btn-sm { height: 30px; padding: 0 11px; font-size: 12px; }
  .cp-btn-full { width: 100%; }
  .cp-btn-inline { height: 36px; }
  .cp-btn-primary {
    background: var(--cp-primary); color: white;
    border: 1px solid color-mix(in oklab, var(--cp-primary) 70%, white 25%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 20px -8px rgba(99,102,241,0.6);
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
  .cp-btn-gold {
    background: var(--cp-gold); color: #1a1305;
    border: 1px solid color-mix(in oklab, var(--cp-gold) 70%, white 25%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 22px -8px rgba(234,179,8,0.55);
    font-weight: 600; width: 100%;
  }
  .cp-btn-gold:hover { background: color-mix(in oklab, var(--cp-gold) 90%, white 10%); }
  .cp-btn-gold:active { transform: translateY(0.5px); }

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
    font-size: 24px; font-weight: 600;
    letter-spacing: -0.022em;
  }
  .cp-section-rule {
    flex: 1; height: 1px;
    background: linear-gradient(to right, var(--cp-border), transparent);
  }
  .cp-section-lede {
    margin: 8px 0 28px;
    font-size: 14.5px; color: var(--cp-muted);
    max-width: 560px;
  }

  /* === PASSPORT PREVIEW === */
  .cp-passport {
    border: 1px solid var(--cp-border);
    border-radius: 12px;
    background: var(--cp-bg-2);
    overflow: hidden;
    box-shadow: 0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 60px -20px rgba(0,0,0,0.7);
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

  /* === GRID === */
  .cp-grid {
    list-style: none; padding: 0; margin: 0;
    display: grid; grid-template-columns: 1fr;
    gap: 1px;
    background: var(--cp-border);
    border: 1px solid var(--cp-border);
    border-radius: 10px;
    overflow: hidden;
  }
  @media (min-width: 640px) { .cp-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 960px) { .cp-grid { grid-template-columns: 1fr 1fr 1fr; } }
  .cp-cell {
    background: var(--cp-bg);
    padding: 20px 20px 22px;
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
    margin: 6px 0 0; font-size: 14.5px; font-weight: 500;
    letter-spacing: -0.012em;
  }
  .cp-cell-body {
    margin: 6px 0 0; font-size: 13px; color: var(--cp-muted);
    line-height: 1.55;
  }

  /* === FLOW === */
  .cp-flow {
    list-style: none; padding: 0; margin: 0;
    border: 1px solid var(--cp-border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--cp-bg);
  }
  .cp-flow-row {
    display: grid;
    grid-template-columns: 44px 1fr auto;
    align-items: center; gap: 16px;
    padding: 18px 18px;
    border-bottom: 1px solid var(--cp-border);
    transition: background 160ms ease;
  }
  .cp-flow-row:last-child { border-bottom: 0; }
  .cp-flow-row:hover { background: var(--cp-surface); }
  .cp-flow-num {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px; color: var(--cp-muted);
    padding: 3px 7px;
    border: 1px solid var(--cp-border);
    border-radius: 4px;
    width: fit-content;
  }
  .cp-flow-arrow { color: var(--cp-muted); font-size: 16px; }
  .cp-step-title { margin: 0; font-size: 14.5px; font-weight: 500; letter-spacing: -0.012em; }
  .cp-step-body { margin: 4px 0 0; font-size: 13px; color: var(--cp-muted); line-height: 1.55; }

  /* === PROVIDERS === */
  .cp-providers {
    list-style: none; padding: 0; margin: 8px 0 0;
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
  }
  @media (min-width: 640px) { .cp-providers { grid-template-columns: repeat(4, 1fr); } }
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

  /* === QUOTES === */
  .cp-quotes {
    list-style: none; padding: 0; margin: 0;
    display: grid; grid-template-columns: 1fr; gap: 12px;
  }
  @media (min-width: 880px) { .cp-quotes { grid-template-columns: 1fr 1fr 1fr; } }
  .cp-quote {
    background: var(--cp-bg-2);
    border: 1px solid var(--cp-border);
    border-radius: 10px;
    padding: 20px 20px 18px;
  }
  .cp-quote-text {
    margin: 0 0 14px;
    font-size: 14px; line-height: 1.55;
    color: var(--cp-fg);
    letter-spacing: -0.008em;
  }
  .cp-quote-attr { margin: 0; font-size: 12px; }

  /* === PRICING === */
  .cp-plans {
    list-style: none; padding: 0; margin: 0;
    display: grid; grid-template-columns: 1fr; gap: 16px;
  }
  @media (min-width: 880px) { .cp-plans { grid-template-columns: 1fr 1fr 1fr; align-items: stretch; } }
  .cp-plan {
    position: relative;
    background: var(--cp-bg-2);
    border: 1px solid var(--cp-border);
    border-radius: 14px;
    padding: 24px 22px 22px;
    display: flex; flex-direction: column; gap: 18px;
  }
  .cp-plan-gold {
    border-color: color-mix(in oklab, var(--cp-gold) 50%, var(--cp-border));
    background:
      radial-gradient(400px 200px at 50% -50px, rgba(234,179,8,0.10), transparent 60%),
      var(--cp-bg-2);
    box-shadow: 0 0 0 1px color-mix(in oklab, var(--cp-gold) 22%, transparent), 0 24px 60px -28px rgba(234,179,8,0.35);
  }
  .cp-plan-ribbon {
    position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    padding: 4px 10px; border-radius: 999px;
    background: var(--cp-gold); color: #1a1305;
    box-shadow: 0 4px 14px -4px rgba(234,179,8,0.55);
  }
  .cp-plan-head { border-bottom: 1px solid var(--cp-border); padding-bottom: 16px; }
  .cp-plan-tag {
    margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px; color: var(--cp-muted);
    text-transform: uppercase; letter-spacing: 0.12em;
  }
  .cp-plan-name { margin: 6px 0 12px; font-size: 18px; font-weight: 600; letter-spacing: -0.015em; }
  .cp-plan-price { margin: 0; display: flex; align-items: baseline; gap: 8px; }
  .cp-plan-amount { font-size: 36px; font-weight: 600; letter-spacing: -0.028em; }
  .cp-plan-gold .cp-plan-amount { color: var(--cp-gold); }
  .cp-plan-cadence { font-size: 13px; color: var(--cp-muted); }
  .cp-plan-features {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 10px;
    flex: 1;
  }
  .cp-plan-features li {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13px; color: var(--cp-fg-2); line-height: 1.5;
  }
  .cp-plan-features svg { color: var(--cp-success); margin-top: 3px; flex: none; }
  .cp-plan-gold .cp-plan-features svg { color: var(--cp-gold); }

  /* === COMPARE === */
  .cp-compare {
    margin-top: 36px;
    border: 1px solid var(--cp-border);
    border-radius: 12px;
    overflow: hidden;
    background: var(--cp-bg-2);
  }
  .cp-compare-head, .cp-compare-row {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr 1fr;
    gap: 12px;
    padding: 14px 18px;
    align-items: center;
  }
  .cp-compare-head {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px; color: var(--cp-muted);
    text-transform: uppercase; letter-spacing: 0.1em;
    background: var(--cp-surface);
    border-bottom: 1px solid var(--cp-border);
  }
  .cp-compare-head > :not(:first-child) { text-align: center; }
  .cp-compare-row {
    border-bottom: 1px solid var(--cp-border);
    font-size: 13px;
  }
  .cp-compare-row:last-child { border-bottom: 0; }
  .cp-compare-row > :not(:first-child) { text-align: center; }
  .cp-compare-label { color: var(--cp-fg-2); }
  .cp-compare-check {
    display: inline-flex; width: 22px; height: 22px;
    align-items: center; justify-content: center;
    border-radius: 6px;
    background: color-mix(in oklab, var(--cp-success) 14%, transparent);
    color: var(--cp-success);
    border: 1px solid color-mix(in oklab, var(--cp-success) 30%, transparent);
  }
  .cp-compare-check-gold {
    background: color-mix(in oklab, var(--cp-gold) 16%, transparent);
    color: var(--cp-gold);
    border-color: color-mix(in oklab, var(--cp-gold) 36%, transparent);
  }
  .cp-compare-dash { color: var(--cp-muted); }
  .cp-compare-val { color: var(--cp-fg); font-size: 12.5px; }
  @media (max-width: 720px) {
    .cp-compare-head, .cp-compare-row {
      grid-template-columns: 1.4fr 1fr 1fr 1fr;
      padding: 12px 12px;
      gap: 6px;
      font-size: 12px;
    }
  }

  /* === FAQ === */
  .cp-faq { list-style: none; padding: 0; margin: 0;
    border: 1px solid var(--cp-border); border-radius: 12px;
    background: var(--cp-bg-2); overflow: hidden;
  }
  .cp-faq li { border-bottom: 1px solid var(--cp-border); }
  .cp-faq li:last-child { border-bottom: 0; }
  .cp-faq-item summary {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 18px 20px;
    cursor: pointer;
    font-size: 14px; font-weight: 500;
    letter-spacing: -0.01em;
    list-style: none;
    transition: background 160ms ease;
  }
  .cp-faq-item summary::-webkit-details-marker { display: none; }
  .cp-faq-item summary:hover { background: var(--cp-surface); }
  .cp-faq-icon {
    color: var(--cp-muted); font-size: 18px; line-height: 1;
    transition: transform 200ms ease, color 160ms ease;
  }
  .cp-faq-item[open] .cp-faq-icon { transform: rotate(45deg); color: var(--cp-fg); }
  .cp-faq-item p {
    margin: 0; padding: 0 20px 20px;
    font-size: 13.5px; color: var(--cp-muted); line-height: 1.6;
    max-width: 720px;
  }

  /* === CTA === */
  .cp-cta {
    border: 1px solid var(--cp-border);
    border-radius: 16px;
    padding: 48px 32px;
    background:
      radial-gradient(600px 240px at 50% 0%, rgba(99,102,241,0.14), transparent 60%),
      var(--cp-bg-2);
    text-align: center;
  }
  .cp-cta-h {
    margin: 4px auto 12px;
    font-size: 36px; font-weight: 600;
    letter-spacing: -0.025em;
    max-width: 640px;
    text-wrap: balance;
  }
  @media (max-width: 640px) { .cp-cta-h { font-size: 28px; } .cp-cta { padding: 36px 20px; } }
  .cp-cta-sub { margin: 0; font-size: 14.5px; color: var(--cp-muted); }
  .cp-cta .flex { justify-content: center; }

  /* === FOOTER === */
  .cp-foot {
    border-top: 1px solid var(--cp-border);
    padding: 28px 0 56px;
    color: var(--cp-muted);
    font-size: 12px;
  }
`;
