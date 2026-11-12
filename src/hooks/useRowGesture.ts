import { useCallback, useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;
// iOS Safari synthesizes a full compatibility mouse sequence (mousemove →
// mousedown → mouseup → click) after every touch tap, unless the touch was
// preventDefaulted — and these listeners are passive, so it never is. A
// synthetic mouseup after a touch would fire onTap a second time: harmless
// for play (same queue twice) but fatal for a selection toggle, which flips
// back off and looks like the tap did nothing. Ignore mouse input briefly
// after any touch ends; real desktop clicks never follow a touch.
const MOUSE_AFTER_TOUCH_IGNORE_MS = 700;
export const SWIPE_REVEAL_PX = 76;
const SWIPE_OPEN_THRESHOLD = 40;
const SWIPE_OVERSHOOT_PX = 24;

interface RowGestureOptions {
  onTap?: () => void;
  /** Fires once when the long-press threshold is reached. */
  onLongPress?: () => void;
  /** Providing this turns a fired long-press into the start of a continuous
   *  drag on the same touch, matching iOS's press-and-hold-to-reorder. */
  onDragStart?: () => void;
  onDragMove?: (deltaY: number) => void;
  onDragEnd?: () => void;
  swipeEnabled?: boolean;
}

/** Touch-only gesture state machine for a list row: a quick tap, a long press
 *  (optionally continuing into a vertical drag), or a horizontal swipe that
 *  reveals a fixed-width action button. All three share one touch start, so
 *  they have to be disambiguated from the same gesture rather than attached
 *  as independent handlers.
 *
 *  touchmove needs to call preventDefault while swiping or dragging so the
 *  page doesn't scroll underneath the gesture, but React has attached
 *  touchmove passively at the root since v17 — a JSX onTouchMove cannot do
 *  that. The listeners are attached directly to the DOM node instead. */
export function useRowGesture(options: RowGestureOptions) {
  const { swipeEnabled = true } = options;
  const ref = useRef<HTMLElement | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [swiping, setSwiping] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;
  const offsetXRef = useRef(0);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const baseOffset = useRef(0);
  const dragBaseY = useRef(0);
  const phase = useRef<"idle" | "wait" | "swipe" | "drag">("idle");
  const timer = useRef<number | null>(null);
  const lastTouchEndAt = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const clearTimer = () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
    const setOffset = (v: number) => {
      offsetXRef.current = v;
      setOffsetX(v);
    };

    const onStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement | null)?.closest("[data-swipe-ignore]")) return;
      const t = e.touches[0];
      startPos.current = { x: t.clientX, y: t.clientY };
      baseOffset.current = open ? -SWIPE_REVEAL_PX : 0;
      phase.current = "wait";
      clearTimer();
      // Only wait for a long-press when the caller actually has long-press
      // behavior. With no onLongPress and no onDragMove the timer would do
      // nothing but flip the phase to "idle" at 450ms and swallow the tap —
      // exactly the careful, slightly-long press on a small target (like the
      // selection radio) that must still toggle.
      if (optionsRef.current.onLongPress || optionsRef.current.onDragMove) {
        timer.current = window.setTimeout(() => {
          if (phase.current !== "wait") return;
          if (optionsRef.current.onDragMove) {
            phase.current = "drag";
            dragBaseY.current = startPos.current?.y ?? 0;
            setDragging(true);
            optionsRef.current.onDragStart?.();
          } else {
            phase.current = "idle";
          }
          optionsRef.current.onLongPress?.();
          navigator.vibrate?.(10);
        }, LONG_PRESS_MS);
      }
    };

    const onMove = (e: TouchEvent) => {
      if (!startPos.current) return;
      const t = e.touches[0];
      const dx = t.clientX - startPos.current.x;
      const dy = t.clientY - startPos.current.y;

      if (phase.current === "drag") {
        e.preventDefault();
        optionsRef.current.onDragMove?.(t.clientY - dragBaseY.current);
        return;
      }
      if (phase.current === "swipe") {
        e.preventDefault();
        setOffset(Math.min(0, Math.max(-SWIPE_REVEAL_PX - SWIPE_OVERSHOOT_PX, baseOffset.current + dx)));
        return;
      }
      if (phase.current === "wait" && (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX)) {
        clearTimer();
        if (swipeEnabled && Math.abs(dx) > Math.abs(dy)) {
          phase.current = "swipe";
          setSwiping(true);
          e.preventDefault();
          setOffset(Math.min(0, Math.max(-SWIPE_REVEAL_PX - SWIPE_OVERSHOOT_PX, baseOffset.current + dx)));
        } else {
          phase.current = "idle"; // vertical intent: let the page scroll natively
        }
      }
    };

    const onEnd = () => {
      lastTouchEndAt.current = Date.now();
      clearTimer();
      if (phase.current === "swipe") {
        const shouldOpen = offsetXRef.current < -SWIPE_OPEN_THRESHOLD;
        setOpen(shouldOpen);
        setOffset(shouldOpen ? -SWIPE_REVEAL_PX : 0);
        setSwiping(false);
      } else if (phase.current === "drag") {
        setDragging(false);
        optionsRef.current.onDragEnd?.();
      } else if (phase.current === "wait") {
        optionsRef.current.onTap?.();
      }
      phase.current = "idle";
      startPos.current = null;
    };

    let mouseStart: { x: number; y: number } | null = null;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || phase.current !== "idle") return;
      if (Date.now() - lastTouchEndAt.current < MOUSE_AFTER_TOUCH_IGNORE_MS) return;
      if ((e.target as HTMLElement | null)?.closest("[data-swipe-ignore]")) return;
      mouseStart = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!mouseStart) return;
      const dx = e.clientX - mouseStart.x;
      const dy = e.clientY - mouseStart.y;
      if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) {
        mouseStart = null;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!mouseStart) return;
      if (Date.now() - lastTouchEndAt.current < MOUSE_AFTER_TOUCH_IGNORE_MS) {
        mouseStart = null;
        return;
      }
      const start = mouseStart;
      mouseStart = null;
      if (e.button !== 0 || phase.current !== "idle") return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) > MOVE_CANCEL_PX || Math.abs(dy) > MOVE_CANCEL_PX) return;
      optionsRef.current.onTap?.();
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", onMouseUp);
      clearTimer();
    };
  }, [open, swipeEnabled]);

  const close = useCallback(() => {
    offsetXRef.current = 0;
    setOpen(false);
    setOffsetX(0);
  }, []);

  return { ref, offsetX, open, dragging, swiping, close };
}
