import type { ReactNode, RefObject } from "react";

type StageProps = {
  stageRef?: RefObject<HTMLDivElement | null>;
  eyebrow?: string;
  children: ReactNode;
  /** Optional labelled beats rendered as a clickable scrubber. */
  beats?: { label: string; at: number }[];
  t?: number;
  onSeek?: (at: number) => void;
  playing?: boolean;
  onToggle?: () => void;
  onReplay?: () => void;
  tall?: boolean;
};

export function DemoStage({
  stageRef,
  eyebrow,
  children,
  beats,
  t = 0,
  onSeek,
  playing,
  onToggle,
  onReplay,
  tall,
}: StageProps) {
  return (
    <div className="cp-stage" ref={stageRef}>
      <div className="cp-stage-bar">
        <span className="cp-stage-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        {eyebrow ? <span className="cp-stage-eyebrow">{eyebrow}</span> : null}
        <span className="cp-stage-actions">
          {onToggle ? (
            <button type="button" className="cp-stage-btn" onClick={onToggle}>
              {playing ? "Pause" : "Play"}
            </button>
          ) : null}
          {onReplay ? (
            <button type="button" className="cp-stage-btn" onClick={onReplay}>
              Replay
            </button>
          ) : null}
        </span>
      </div>

      <div className={tall ? "cp-stage-body cp-stage-body-tall" : "cp-stage-body"}>{children}</div>

      {beats && onSeek ? (
        <div className="cp-scrub">
          <div className="cp-scrub-track">
            <span className="cp-scrub-fill" style={{ width: `${t * 100}%` }} />
          </div>
          <div className="cp-scrub-beats">
            {beats.map((b, i) => {
              const next = beats[i + 1]?.at ?? 1;
              const active = t >= b.at && t < next;
              return (
                <button
                  key={b.label}
                  type="button"
                  onClick={() => onSeek(b.at)}
                  className={active ? "cp-scrub-beat is-active" : "cp-scrub-beat"}
                >
                  <span className="cp-scrub-index">{String(i + 1).padStart(2, "0")}</span>
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** A stylized AI chat window used inside the demo stages. */
export function ChatWindow({
  provider,
  accent,
  active,
  children,
}: {
  provider: string;
  accent: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={active ? "cp-win is-active" : "cp-win"}>
      <div className="cp-win-bar">
        <span className="cp-win-mark" style={{ background: accent }} />
        <span className="cp-win-name">{provider}</span>
        <span className="cp-win-url">chat</span>
      </div>
      <div className="cp-win-body">{children}</div>
    </div>
  );
}

export function Bubble({
  role,
  children,
  style,
}: {
  role: "user" | "ai";
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`cp-bubble cp-bubble-${role}`} style={style}>
      {children}
    </div>
  );
}

/** The extension popup shell, reused by several demos. */
export function PopupShell({
  title = "ContextPassport",
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="cp-pop" style={style}>
      <div className="cp-pop-bar">
        <span className="cp-pop-logo" />
        <span className="cp-pop-title">{title}</span>
        <span className="cp-pop-badge">local</span>
      </div>
      <div className="cp-pop-body">{children}</div>
    </div>
  );
}

export function Cursor({ x, y, pressed }: { x: number; y: number; pressed?: boolean }) {
  return (
    <span
      className={pressed ? "cp-cursor is-pressed" : "cp-cursor"}
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden
    >
      <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
        <path d="M1 1L14 8.2L8.4 9.6L11 15.6L8.6 16.8L6 10.8L1 14.6V1Z" fill="#fff" stroke="#111" strokeWidth="1" />
      </svg>
    </span>
  );
}
