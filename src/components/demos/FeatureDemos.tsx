import { useState } from "react";
import { DemoStage, PopupShell } from "./DemoStage";
import { ease, mix, seg, useTimeline } from "./useTimeline";

/* ---------------- 1. Context Intelligence Engine ---------------- */

const RAW = [
  "so basically we need the thing to keep working when I move to claude",
  "yeah I already decided manifest v3, don't want a backend",
  "I finished the chatgpt and gemini adapters yesterday",
  "not sure what to charge for the founder tier honestly",
  "anyway next up is the product hunt launch on friday",
];

const DISTILLED = [
  { k: "Goal", v: "Keep project context alive across AI tools" },
  { k: "Decision", v: "Manifest V3 · no backend" },
  { k: "Progress", v: "ChatGPT + Gemini adapters complete" },
  { k: "Open question", v: "Founder tier pricing" },
  { k: "Next action", v: "Product Hunt launch, Friday" },
];

export function IntelligenceDemo() {
  const { ref, t, playing, toggle, restart } = useTimeline({ duration: 6000 });
  return (
    <DemoStage stageRef={ref} eyebrow="Transcript → structure" playing={playing} onToggle={toggle} onReplay={restart}>
      <div className="cp-two">
        <div className="cp-col">
          <span className="cp-col-head">Raw conversation</span>
          {RAW.map((line, i) => {
            const p = ease(seg(t, 0.15 + i * 0.06, 0.4 + i * 0.06));
            return (
              <p key={line} className="cp-raw" style={{ opacity: 1 - p * 0.88, filter: `blur(${p * 2}px)` }}>
                {line}
              </p>
            );
          })}
        </div>
        <div className="cp-col">
          <span className="cp-col-head">Passport facets</span>
          {DISTILLED.map((f, i) => {
            const p = ease(seg(t, 0.3 + i * 0.08, 0.55 + i * 0.08));
            return (
              <div key={f.k} className="cp-facet" style={{ opacity: p, transform: `translateY(${mix(8, 0, p)}px)` }}>
                <span className="cp-facet-k">{f.k}</span>
                <span className="cp-facet-v">{f.v}</span>
              </div>
            );
          })}
        </div>
      </div>
    </DemoStage>
  );
}

/* ---------------- 2. Thread separation ---------------- */

const RAILS = [
  { n: "ChatGPT", c: "#10a37f", items: ["Billing rewrite", "Adapter API"] },
  { n: "Claude", c: "#d97757", items: ["Store listing copy"] },
  { n: "Gemini", c: "#4285f4", items: ["Competitor scan"] },
];

export function ThreadsDemo() {
  const { ref, t, playing, toggle, restart } = useTimeline({ duration: 6000 });
  const fly = ease(seg(t, 0.2, 0.62));
  const settle = ease(seg(t, 0.62, 0.8));
  return (
    <DemoStage stageRef={ref} eyebrow="One thread per conversation" playing={playing} onToggle={toggle} onReplay={restart}>
      <div className="cp-rails">
        {RAILS.map((r, i) => (
          <div key={r.n} className={i === 1 ? "cp-rail is-target" : "cp-rail"}>
            <span className="cp-rail-head">
              <i style={{ background: r.c }} />
              {r.n}
            </span>
            {r.items.map((it) => (
              <span key={it} className="cp-rail-item">
                {it}
              </span>
            ))}
            {i === 1 ? (
              <span
                className="cp-rail-item is-new"
                style={{ opacity: fly, transform: `translateY(${mix(-46, 0, fly)}px)`, borderColor: settle > 0.4 ? "var(--cp-accent)" : undefined }}
              >
                Pricing thread · new
              </span>
            ) : null}
          </div>
        ))}
        <span className="cp-rails-note" style={{ opacity: settle }}>
          Captured on a new Claude URL → new thread, never merged into the old one.
        </span>
      </div>
    </DemoStage>
  );
}

/* ---------------- 3. Handoff modes (interactive) ---------------- */

const MODES: Record<string, string[]> = {
  Quick: ["Goal: ship v1 to 100 founders", "Next: Product Hunt launch Friday"],
  Balanced: [
    "Goal: ship v1 to 100 founders",
    "Decisions: MV3, no backend, local storage",
    "Progress: 4 adapters shipped",
    "Next: Product Hunt launch Friday",
  ],
  Developer: [
    "Stack: MV3 · TypeScript strict · DI container",
    "Files: providers/_base/DomAdapterBase.ts, services/capture/*",
    "Constraints: no network calls, <200ms interactions",
    "Blocker: Claude selector churn — diagnostics added",
    "Next: repackage extension, verify 43 tests green",
  ],
  Research: [
    "Question: what keeps context across AI tools?",
    "Sources: 4 provider DOM structures reviewed",
    "Findings: no provider exposes a stable export API",
    "Contradiction: two sources disagree on MV3 limits",
    "Next: verify service-worker lifetime claim",
  ],
  Founder: [
    "Thesis: AI work continuity is the missing layer",
    "Traction: 100 founder waitlist target",
    "Pricing: Free / $9 Pro / $39 lifetime Founder",
    "Risk: provider DOM changes → adapter isolation",
    "Next: Product Hunt launch Friday",
  ],
};

export function ModesDemo() {
  const [mode, setMode] = useState<keyof typeof MODES>("Balanced");
  return (
    <DemoStage eyebrow="Same passport, five renders">
      <div className="cp-modes">
        <div className="cp-mode-chips">
          {Object.keys(MODES).map((m) => (
            <button
              key={m}
              type="button"
              className={m === mode ? "cp-chip is-on" : "cp-chip"}
              onClick={() => setMode(m as keyof typeof MODES)}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="cp-mode-panel" key={mode}>
          {MODES[mode].map((line, i) => (
            <p key={line} className="cp-mode-line" style={{ animationDelay: `${i * 45}ms` }}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </DemoStage>
  );
}

/* ---------------- 4. Pre-capture preview ---------------- */

export function PreviewDemo() {
  const { ref, t, playing, toggle, restart } = useTimeline({ duration: 6000 });
  const count = ease(seg(t, 0.1, 0.5));
  const dupes = ease(seg(t, 0.4, 0.66));
  const cleared = seg(t, 0.72, 0.9);
  return (
    <DemoStage stageRef={ref} eyebrow="Nothing is saved before you see it" playing={playing} onToggle={toggle} onReplay={restart}>
      <PopupShell title="Ready to capture" style={{ position: "static", width: "100%" }}>
        <div className={cleared > 0.5 ? "cp-integrity is-ok" : "cp-integrity"}>
          {cleared > 0.5 ? "✓ All turns have a role and body" : "Checking turn integrity…"}
        </div>
        <ul className="cp-prev-stats">
          <li>
            <span>Turns found</span>
            <strong>{Math.round(count * 24)}</strong>
          </li>
          <li>
            <span>Already captured</span>
            <strong>{Math.round(dupes * 7)}</strong>
          </li>
          <li>
            <span>New this capture</span>
            <strong>{Math.round(count * 24) - Math.round(dupes * 7)}</strong>
          </li>
          <li>
            <span>Mode</span>
            <strong>New since last</strong>
          </li>
        </ul>
        <button type="button" className="cp-pop-cta">
          Capture now
        </button>
      </PopupShell>
    </DemoStage>
  );
}

/* ---------------- 5. Context health score ---------------- */

const RECS = [
  "Add a measurable success criterion to the goal",
  "Two decisions have no recorded rationale",
  "No blockers logged in 6 captures — still accurate?",
];

export function HealthDemo() {
  const { ref, t, playing, toggle, restart } = useTimeline({ duration: 5500 });
  const p = ease(seg(t, 0.05, 0.55));
  const score = Math.round(p * 86);
  const c = 2 * Math.PI * 34;
  return (
    <DemoStage stageRef={ref} eyebrow="Know what your project is missing" playing={playing} onToggle={toggle} onReplay={restart}>
      <div className="cp-health">
        <svg width="96" height="96" viewBox="0 0 80 80" className="cp-dial">
          <circle cx="40" cy="40" r="34" className="cp-ring-track" />
          <circle cx="40" cy="40" r="34" className="cp-ring-fill" strokeDasharray={c} strokeDashoffset={c * (1 - p * 0.86)} />
          <text x="40" y="46" textAnchor="middle" className="cp-dial-text">
            {score}
          </text>
        </svg>
        <div>
          <span className="cp-col-head">Recommendations</span>
          {RECS.map((r, i) => {
            const o = ease(seg(t, 0.5 + i * 0.1, 0.68 + i * 0.1));
            return (
              <p key={r} className="cp-rec" style={{ opacity: o, transform: `translateY(${mix(6, 0, o)}px)` }}>
                {r}
              </p>
            );
          })}
        </div>
      </div>
    </DemoStage>
  );
}

/* ---------------- 6. Retention + export ---------------- */

const CAPS = ["Pricing thread", "Adapter API", "Store listing", "Competitor scan", "Old billing draft", "Legacy notes"];

export function RetentionDemo() {
  const { ref, t, playing, toggle, restart } = useTimeline({ duration: 6500 });
  const prune = seg(t, 0.15, 0.5);
  const out = ease(seg(t, 0.55, 0.85));
  return (
    <DemoStage stageRef={ref} eyebrow="Keep last N · export the rest" playing={playing} onToggle={toggle} onReplay={restart}>
      <div className="cp-retain">
        <div className="cp-col" style={{ flex: 1 }}>
          <span className="cp-col-head">Captures · keep last 4</span>
          {CAPS.map((c, i) => {
            const old = i >= 4;
            const p = old ? ease(Math.min(1, Math.max(0, prune * 2 - (i - 4) * 0.4))) : 0;
            return (
              <span key={c} className="cp-rail-item" style={{ opacity: 1 - p * 0.85, transform: `translateX(${p * 16}px)` }}>
                {c}
                {old ? <em className="cp-strike">{p > 0.6 ? "pruned" : "aging out"}</em> : null}
              </span>
            );
          })}
        </div>
        <div className="cp-export" style={{ opacity: out, transform: `translateX(${mix(-14, 0, out)}px)` }}>
          <span className="cp-export-file">workspace-bundle.json</span>
          <span className="cp-pop-sub">4 projects · 18 captures · merge / dedupe / overwrite on import</span>
        </div>
      </div>
    </DemoStage>
  );
}

/* ---------------- 7. Local only ---------------- */

export function LocalOnlyDemo() {
  const { ref, t, playing, toggle, restart } = useTimeline({ duration: 5000 });
  const scan = seg(t, 0.1, 0.8);
  return (
    <DemoStage stageRef={ref} eyebrow="DevTools → Network, during a capture" playing={playing} onToggle={toggle} onReplay={restart}>
      <div className="cp-net">
        <div className="cp-net-bar">
          <span>Name</span>
          <span>Status</span>
          <span>Size</span>
        </div>
        <div className="cp-net-empty">
          <strong>0 requests</strong>
          <span className="cp-pop-sub">No outbound traffic while capturing, compressing, or pasting.</span>
        </div>
        <div className="cp-net-scan" style={{ width: `${scan * 100}%` }} />
        <span className="cp-net-foot">Capture running · {Math.round(scan * 24)} turns read from the DOM</span>
      </div>
    </DemoStage>
  );
}
