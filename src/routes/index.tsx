import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HeroWalkthrough } from "../components/demos/HeroWalkthrough";
import {
  HealthDemo,
  IntelligenceDemo,
  LocalOnlyDemo,
  ModesDemo,
  PreviewDemo,
  RetentionDemo,
  ThreadsDemo,
} from "../components/demos/FeatureDemos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ContextPassport — Continue Any AI Conversation Anywhere" },
      {
        name: "description",
        content:
          "Watch it work: capture a ChatGPT thread and continue it in Claude, Gemini, or Perplexity without rebuilding context. Local-only Chrome extension, no account.",
      },
      { property: "og:title", content: "ContextPassport — Continue Any AI Conversation Anywhere" },
      {
        property: "og:description",
        content:
          "See the extension in action: capture, compress, transfer, continue — across ChatGPT, Claude, Gemini and Perplexity. Nothing leaves your device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

/* --------------------------------- data --------------------------------- */

const PAIN = [
  ["01", "Repeating yourself", "You re-explain the same project every time you open a new chat."],
  ["02", "Lost decisions", "Architecture and product choices vanish when the thread rolls over."],
  ["03", "Context limits", "Long conversations drop the early context that mattered most."],
  ["04", "Fragmented research", "Findings live in tabs you'll never reopen."],
  ["05", "Switching models", "Moving from Claude to GPT means starting from zero."],
  ["06", "Forgotten next steps", "You finish a session and lose the thread by morning."],
];

const STEPS = [
  ["Capture", "One click on any ChatGPT, Claude, Gemini or Perplexity tab reads the conversation from the page."],
  ["Compress", "The intelligence engine distills goals, decisions, constraints, progress, questions and next actions."],
  ["Transfer", "Open another AI, pick a handoff mode, and the passport is written into its composer."],
  ["Continue", "The receiving AI treats the passport as ground truth and picks up mid-project."],
];

const FEATURES: {
  n: string;
  t: string;
  p: string;
  bullets: string[];
  demo: React.ReactNode;
}[] = [
  {
    n: "01",
    t: "It reads meaning, not transcripts",
    p: "Pasting a whole chat log wastes the next model's attention. The intelligence engine pulls out the six things that actually carry a project forward and drops everything else.",
    bullets: ["Goals · Decisions · Constraints", "Progress · Open questions · Next actions", "Runs locally, no LLM call"],
    demo: <IntelligenceDemo />,
  },
  {
    n: "02",
    t: "Every conversation keeps its own thread",
    p: "Captures used to blend into one pile, so handoffs came out thin and mixed. Each capture now carries a stable thread key built from the provider and the conversation URL — a new chat always becomes a new, distinctly named thread.",
    bullets: ["Per-thread deduplication", "Stable auto-names across recaptures", "Scope the handoff to one thread or the whole project"],
    demo: <ThreadsDemo />,
  },
  {
    n: "03",
    t: "Five handoff renders of the same passport",
    p: "A research brief and a developer handoff need different shapes. Pick a mode and the same stored context is re-rendered for it — tuned per provider. Click through them here.",
    bullets: ["Quick · Balanced · Developer · Research · Founder", "Provider-specific continuation preamble", "Copy or inject with one click"],
    demo: <ModesDemo />,
  },
  {
    n: "04",
    t: "Nothing is saved before you see it",
    p: "The pre-capture preview shows exactly what will land: turns found, turns already captured, and any integrity warning naming the adapter and selector responsible.",
    bullets: ["Capture modes: full · new since last · last N", "Per-turn hashing kills duplicates", "Undo the last capture"],
    demo: <PreviewDemo />,
  },
  {
    n: "05",
    t: "A score for how usable your context is",
    p: "0–100, computed from what the passport is missing. Vague goal, undocumented decisions, stale blockers — each one shows up as a specific recommendation instead of a vibe.",
    bullets: ["Actionable recommendations", "Conversation type auto-detected", "Project Memory that survives sessions"],
    demo: <HealthDemo />,
  },
  {
    n: "06",
    t: "Retention and portable backups",
    p: "Keep-last-N and max-age rules prune old captures automatically, pinned facets always survive. Export a whole workspace as one bundle and re-import with merge, dedupe or overwrite.",
    bullets: ["JSON and CSV export", "Per-project conflict handling", "Dry-run before anything is pruned"],
    demo: <RetentionDemo />,
  },
  {
    n: "07",
    t: "Local-only, and you can verify it",
    p: "There is no backend to send anything to. Captures live in chrome.storage.local, the passport is rendered in your browser, and the network tab stays empty the whole time.",
    bullets: ["Zero outbound requests", "No account, no telemetry", "One-click delete of everything"],
    demo: <LocalOnlyDemo />,
  },
];

const PROVIDERS = [
  ["ChatGPT", "#10a37f"],
  ["Claude", "#d97757"],
  ["Gemini", "#4285f4"],
  ["Perplexity", "#20808d"],
];

const PERMISSIONS = [
  ["Read AI websites", "Needed to see the conversation when you click Capture. Only on the four supported sites, only when you trigger it."],
  ["Storage", "Saves your project summaries on this device with chrome.storage.local. Never the cloud."],
  ["Clipboard / page write", "Writes a saved passport into the next AI's composer. You review and press Send yourself."],
];

const PLANS = [
  {
    name: "Free",
    tag: "Start here",
    price: "$0",
    cadence: "forever",
    cta: "Download free",
    features: ["3 projects", "Quick & Balanced handoff", "All 4 AI providers", "Local-only storage"],
  },
  {
    name: "Pro",
    tag: "For power users",
    price: "$9",
    cadence: "/ month",
    cta: "Go Pro",
    features: ["Unlimited projects", "Developer & Research handoff", "Context Health Score", "Project Memory", "Priority provider updates"],
  },
  {
    name: "Founder",
    tag: "Best value",
    price: "$39",
    cadence: "lifetime",
    cta: "Claim Founder",
    featured: true,
    features: ["Everything in Pro, forever", "Founder Handoff mode", "Early access to new providers", "Lifetime updates", "Founder badge in popup"],
  },
];

const COMPARE: [string, string, string, string][] = [
  ["Projects", "3", "Unlimited", "Unlimited"],
  ["Captures per project", "20", "Unlimited", "Unlimited"],
  ["AI providers", "4", "4", "4 + early access"],
  ["Quick & Balanced modes", "Yes", "Yes", "Yes"],
  ["Developer Handoff", "—", "Yes", "Yes"],
  ["Research Handoff", "—", "Yes", "Yes"],
  ["Founder Handoff", "—", "—", "Yes"],
  ["Context Health Score", "—", "Yes", "Yes"],
  ["Project Memory", "—", "Yes", "Yes"],
  ["Recurring cost", "$0", "$9 / mo", "$0 after $39"],
];

const FAQS = [
  ["What is ContextPassport?", "A Chrome extension that moves your working context between ChatGPT, Claude, Gemini and Perplexity, so you never restart a project just because you switched tools."],
  ["How is it different from copy-paste?", "It doesn't move the transcript. It extracts goals, decisions, constraints, progress, open questions and next actions, then re-renders them in the shape the receiving AI needs."],
  ["Is anything uploaded?", "No. There is no server. Everything is stored in your browser on your device, and you can confirm zero outbound requests in DevTools → Network."],
  ["What happens when I click Capture?", "The extension reads the conversation visible on the page, structures it, and saves it locally. You see a preview of exactly what will be saved first."],
  ["Will it send messages for me?", "Never. It writes the handoff into the composer and stops. You review it and press Send."],
  ["Which tools are supported?", "ChatGPT, Claude, Gemini and Perplexity at launch. Each provider is an isolated adapter, so if one site changes its markup only that provider degrades."],
  ["Can I turn storage or pasting off?", "Yes, both are toggles in the popup's Privacy panel, and there's a one-click delete for all local data."],
  ["What does Founder Lifetime include?", "Everything in Pro forever with no recurring charge, plus Founder Handoff mode and early access to new providers."],
];

type Status = { kind: "idle" | "loading" | "success" | "error"; msg?: string };

/* --------------------------------- page --------------------------------- */

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
      <nav className="cp-nav">
        <div className="cp-nav-inner">
          <span className="cp-mark" aria-hidden>
            CP
          </span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>ContextPassport</span>
          <div className="hidden items-center gap-1 md:flex" style={{ marginLeft: 12 }}>
            <a href="#watch" className="cp-nav-link">Watch it work</a>
            <a href="#features" className="cp-nav-link">Features</a>
            <a href="#privacy" className="cp-nav-link">Privacy</a>
            <a href="#pricing" className="cp-nav-link">Pricing</a>
            <a href="#faq" className="cp-nav-link">FAQ</a>
          </div>
          <button onClick={download} className="cp-btn cp-btn-primary cp-btn-sm" style={{ marginLeft: "auto" }}>
            Get the extension
          </button>
        </div>
      </nav>

      {/* ============================== HERO ============================== */}
      <header className="cp-hero" id="watch">
        <div className="cp-wrap">
          <span className="cp-pill">
            <i /> v0.3.0 · local-only · no account
          </span>
          <h1 className="cp-h1">
            Continue any AI
            <br />
            conversation anywhere.
          </h1>
          <p className="cp-lede" style={{ fontSize: 19 }}>
            ContextPassport carries your project — goals, decisions, progress, next steps — from one
            AI to the next. Watch the whole loop below, then try it yourself.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button onClick={download} className="cp-btn cp-btn-accent">
              Download for Chrome
            </button>
            <button onClick={copyInstall} className="cp-btn">
              {copied ? "Copied chrome://extensions" : "Copy install address"}
            </button>
          </div>
          {status.msg ? (
            <p className="cp-status" data-kind={status.kind}>
              {status.msg}
            </p>
          ) : null}

          <div style={{ marginTop: 44 }}>
            <HeroWalkthrough />
            <p className="cp-muted" style={{ fontSize: 13, marginTop: 12 }}>
              A real reproduction of the extension flow — click any step above to jump to it.
            </p>
          </div>
        </div>
      </header>

      {/* ============================ PROBLEM ============================ */}
      <section className="cp-section">
        <div className="cp-wrap">
          <span className="cp-eyebrow">The problem</span>
          <h2 className="cp-h2">Context doesn't travel. You rebuild it.</h2>
          <p className="cp-lede">
            Every model switch, every rolled-over thread, every new morning — the same re-explaining.
          </p>
          <div className="cp-grid">
            {PAIN.map(([k, t, b]) => (
              <div className="cp-cell" key={k}>
                <em>{k}</em>
                <strong style={{ marginTop: 6 }}>{t}</strong>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ WORKFLOW ============================ */}
      <section className="cp-section">
        <div className="cp-wrap">
          <span className="cp-eyebrow">How it works</span>
          <h2 className="cp-h2">Four beats, one click.</h2>
          <p className="cp-lede">Each of these is a step in the walkthrough above.</p>
          <div className="cp-grid">
            {STEPS.map(([t, b], i) => (
              <div className="cp-cell" key={t}>
                <em>Step {i + 1}</em>
                <strong style={{ marginTop: 6 }}>{t}</strong>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section className="cp-section" id="features">
        <div className="cp-wrap">
          <span className="cp-eyebrow">Features, one at a time</span>
          <h2 className="cp-h2">Every claim, shown working.</h2>
          <p className="cp-lede">
            Short demos instead of screenshots. Each one plays when it scrolls into view.
          </p>

          {FEATURES.map((f, i) => (
            <div className={i % 2 ? "cp-feature is-flipped" : "cp-feature"} key={f.n}>
              <div className="cp-feature-copy">
                <span className="cp-feature-num">{f.n}</span>
                <h3>{f.t}</h3>
                <p>{f.p}</p>
                <ul>
                  {f.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
              <div>{f.demo}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ PROVIDERS ============================ */}
      <section className="cp-section">
        <div className="cp-wrap">
          <span className="cp-eyebrow">Supported today</span>
          <h2 className="cp-h2">Four providers, isolated adapters.</h2>
          <p className="cp-lede">
            If one site changes its markup, only that provider degrades — the rest keep working, and
            the popup tells you which adapter tripped and why.
          </p>
          <div className="cp-grid">
            {PROVIDERS.map(([n, c]) => (
              <div className="cp-cell" key={n}>
                <span
                  style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: c }}
                  aria-hidden
                />
                <strong style={{ marginTop: 8 }}>{n}</strong>
                <span>Capture and continue</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= PRIVACY ============================= */}
      <section className="cp-section" id="privacy">
        <div className="cp-wrap">
          <span className="cp-eyebrow">Privacy</span>
          <h2 className="cp-h2">There is no server to trust.</h2>
          <p className="cp-lede">
            No account, no telemetry, no cloud copy. The demo below is what your network tab looks
            like during a capture.
          </p>
          <div style={{ marginTop: 32 }}>
            <LocalOnlyDemo />
          </div>
          <div className="cp-grid">
            {PERMISSIONS.map(([t, b]) => (
              <div className="cp-cell" key={t}>
                <strong>{t}</strong>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= PRICING ============================= */}
      <section className="cp-section" id="pricing">
        <div className="cp-wrap">
          <span className="cp-eyebrow">Pricing</span>
          <h2 className="cp-h2">Free to start. $39 once, if you stay.</h2>
          <div className="cp-plans">
            {PLANS.map((p) => (
              <div className={p.featured ? "cp-plan is-featured" : "cp-plan"} key={p.name}>
                <span className="cp-plan-tag">{p.tag}</span>
                <h3>{p.name}</h3>
                <div>
                  <span className="cp-plan-price">{p.price}</span>{" "}
                  <span className="cp-plan-cadence">{p.cadence}</span>
                </div>
                <ul>
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <button onClick={download} className={p.featured ? "cp-btn cp-btn-accent" : "cp-btn"}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>

          <table className="cp-table">
            <thead>
              <tr>
                <th>Compare</th>
                <th>Free</th>
                <th>Pro</th>
                <th>Founder</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row[0]}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* =============================== FAQ =============================== */}
      <section className="cp-section" id="faq">
        <div className="cp-wrap cp-narrow">
          <span className="cp-eyebrow">Questions</span>
          <h2 className="cp-h2">Everything people ask first.</h2>
          <div style={{ marginTop: 28 }}>
            {FAQS.map(([q, a]) => (
              <details className="cp-faq" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="cp-section">
        <div className="cp-wrap cp-narrow" style={{ textAlign: "center" }}>
          <h2 className="cp-h2">Stop re-explaining your own project.</h2>
          <p className="cp-lede" style={{ margin: "0 auto 24px" }}>
            Install it once. The next time you switch models, your context comes with you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={download} className="cp-btn cp-btn-accent">
              Download for Chrome
            </button>
            <a href="#watch" className="cp-btn">
              Watch it work again
            </a>
          </div>
        </div>
      </section>

      <footer className="cp-footer">
        <div className="cp-wrap flex flex-wrap items-center justify-between gap-3">
          <span>ContextPassport · v0.3.0 · local-only</span>
          <span>Built for people who work across ChatGPT, Claude, Gemini and Perplexity.</span>
        </div>
      </footer>
    </div>
  );
}
