// Minimal focus trap for popup modals. Restores focus on release, cycles Tab,
// closes on Escape via caller-supplied handler.

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export interface FocusTrapHandle {
  release: () => void;
}

export function trapFocus(root: HTMLElement, onEscape?: () => void): FocusTrapHandle {
  const previousActive = document.activeElement as HTMLElement | null;
  const getFocusables = (): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute("hidden") && el.offsetParent !== null,
    );

  const first = getFocusables()[0];
  const heading = root.querySelector<HTMLElement>("h1,h2,[data-focus-initial]");
  const initial = heading ?? first;
  if (initial) {
    if (heading && !heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    initial.focus({ preventScroll: true });
  }

  const keydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }
    if (e.key !== "Tab") return;
    const items = getFocusables();
    if (items.length === 0) { e.preventDefault(); return; }
    const active = document.activeElement as HTMLElement | null;
    const idx = active ? items.indexOf(active) : -1;
    if (e.shiftKey) {
      if (idx <= 0) { e.preventDefault(); items[items.length - 1]!.focus(); }
    } else {
      if (idx === items.length - 1 || idx === -1) { e.preventDefault(); items[0]!.focus(); }
    }
  };
  root.addEventListener("keydown", keydown);

  return {
    release() {
      root.removeEventListener("keydown", keydown);
      if (previousActive && typeof previousActive.focus === "function") {
        previousActive.focus({ preventScroll: true });
      }
    },
  };
}
