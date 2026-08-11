import { Bubble, ChatWindow, Cursor, DemoStage, PopupShell } from "./DemoStage";
import { ease, mix, seg, useTimeline } from "./useTimeline";

const FACETS = [
  { k: "Goal", v: "Ship v1 to 100 founders" },
  { k: "Decision", v: "MV3 · DI container · local-only" },
  { k: "Constraint", v: "No backend, no telemetry" },
  { k: "Progress", v: "4 provider adapters done" },
  { k: "Open question", v: "Pricing for Founder mode?" },
  { k: "Next action", v: "Ship v0.3.0 to Product Hunt" },
];

const HANDOFF = `PROJECT PASSPORT — ContextPassport AI
Goal: Ship v1 to 100 founders.
Decisions: MV3, DI container, local-only storage.
Constraints: No backend. No telemetry.
Progress: Adapters for 4 providers complete.
Open: Pricing for Founder mode.
Next: Ship v0.3.0 to Product Hunt.
Continue from here — treat the above as ground truth.`;

const BEATS = [
  { label: "Capture", at: 0 },
  { label: "Compress", at: 0.3 },
  { label: "Transfer", at: 0.55 },
  { label: "Continue", at: 0.68 },
];

export function HeroWalkthrough() {
  const { ref, t, playing, toggle, restart, seek } = useTimeline({ duration: 14000 });

  // Beat windows
  const move = ease(seg(t, 0.02, 0.14));
  const popupOpen = ease(seg(t, 0.14, 0.22));
  const pressing = t > 0.24 && t < 0.29;
  const ring = seg(t, 0.28, 0.5);
  const flying = seg(t, 0.3, 0.55);
  const saved = seg(t, 0.5, 0.56);
  const focusRight = ease(seg(t, 0.58, 0.66));
  const typing = seg(t, 0.68, 0.94);
  const done = seg(t, 0.94, 1);

  const cursorX = mix(28, 70, move);
  const cursorY = mix(76, 15, move);

  const typed = HANDOFF.slice(0, Math.round(typing * HANDOFF.length));

  return (
    <DemoStage
      stageRef={ref}
      eyebrow="Live walkthrough — ChatGPT → Claude"
      beats={BEATS}
      t={t}
      onSeek={seek}
      playing={playing}
      onToggle={toggle}
      onReplay={restart}
      tall
    >
      <div className="cp-split">
        <ChatWindow provider="ChatGPT" accent="#10a37f" active={focusRight < 0.5}>
          <Bubble role="user">We're building a Chrome extension for AI work continuity.</Bubble>
          <Bubble role="ai">
            Understood. MV3 + a provider adapter layer keeps each AI isolated, and local storage
            avoids a backend entirely.
          </Bubble>
          <Bubble role="user">Locked. No telemetry, ever. Next is Product Hunt.</Bubble>

          {/* facets lifting out of the conversation */}
          <div className="cp-fly-layer" aria-hidden>
            {FACETS.map((f, i) => {
              const p = ease(Math.min(1, Math.max(0, flying * 1.6 - i * 0.1)));
              if (p <= 0) return null;
              return (
                <span
                  key={f.k}
                  className="cp-fly-chip"
                  style={{
                    opacity: p < 0.9 ? p : 1 - (p - 0.9) * 10,
                    transform: `translate(${mix(0, 118, p)}%, ${mix(i * 14, -6 + i * 10, p)}px) scale(${mix(1, 0.86, p)})`,
                  }}
                >
                  {f.k}
                </span>
              );
            })}
          </div>
        </ChatWindow>

        <ChatWindow provider="Claude" accent="#d97757" active={focusRight > 0.5}>
          <Bubble role="ai" style={{ opacity: 0.45 }}>
            New conversation — no context yet.
          </Bubble>
          <div className="cp-composer">
            <pre className="cp-composer-text">
              {typed}
              {typing > 0 && typing < 1 ? <span className="cp-caret" /> : null}
            </pre>
            <div className="cp-composer-foot">
              <span>You review, then press Send</span>
              <span className={done > 0.5 ? "cp-send is-ready" : "cp-send"}>Send</span>
            </div>
          </div>
        </ChatWindow>

        {/* extension popup */}
        <PopupShell
          style={{
            opacity: popupOpen,
            transform: `translateY(${mix(-8, 0, popupOpen)}px) scale(${mix(0.97, 1, popupOpen)})`,
          }}
        >
          <div className="cp-pop-row">
            <span className="cp-pop-label">Active project</span>
            <span className="cp-pop-value">ContextPassport AI</span>
          </div>
          <div className="cp-ring-row">
            <Ring progress={ring} />
            <div>
              <strong className="cp-pop-strong">
                {saved > 0.5 ? "Handoff ready" : ring > 0 ? "Extracting turns…" : "Ready to capture"}
              </strong>
              <span className="cp-pop-sub">
                {Math.round(ring * 24)} turns · {Math.round(ring * 6)} facets
              </span>
            </div>
          </div>
          <button type="button" className={pressing ? "cp-pop-cta is-pressed" : "cp-pop-cta"}>
            {saved > 0.5 ? "✓ Pasted into Claude" : "Capture & paste handoff"}
          </button>
          <span className="cp-pop-note">Stored on this device · 0 network requests</span>
        </PopupShell>

        <Cursor x={cursorX} y={cursorY} pressed={pressing} />
      </div>
    </DemoStage>
  );
}

function Ring({ progress }: { progress: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg className="cp-ring" width="42" height="42" viewBox="0 0 42 42">
      <circle cx="21" cy="21" r={r} className="cp-ring-track" />
      <circle
        cx="21"
        cy="21"
        r={r}
        className="cp-ring-fill"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - progress)}
      />
      <text x="21" y="25" textAnchor="middle" className="cp-ring-text">
        {Math.round(progress * 100)}
      </text>
    </svg>
  );
}
