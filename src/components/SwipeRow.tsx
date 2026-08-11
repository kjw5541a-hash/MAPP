import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useRowGesture, SWIPE_REVEAL_PX } from "../hooks/useRowGesture";

interface SwipeRowProps {
  children: ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  onDeleteRequest: () => void;
  deleteLabel?: string;
  /** Turns off swiping only — tap and long-press still work. Use this while
   *  the row is in a selection mode, where a horizontal swipe would conflict
   *  with tap-to-toggle. */
  swipeEnabled?: boolean;
  onDragStart?: () => void;
  onDragMove?: (deltaY: number) => void;
  onDragEnd?: () => void;
  translateY?: number;
  elevated?: boolean;
  className?: string;
}

/** Wraps a row with swipe-to-reveal-delete, and — when drag callbacks are
 *  given — a long press that continues into a vertical drag on the same
 *  touch. See useRowGesture for why the gesture has to be one state machine. */
export function SwipeRow({
  children,
  onTap,
  onLongPress,
  onDeleteRequest,
  deleteLabel = "삭제",
  swipeEnabled = true,
  onDragStart,
  onDragMove,
  onDragEnd,
  translateY,
  elevated,
  className = "",
}: SwipeRowProps) {
  const { ref, offsetX, dragging, swiping, close } = useRowGesture({
    onTap,
    onLongPress,
    onDragStart,
    onDragMove,
    onDragEnd,
    swipeEnabled,
  });

  const ty = translateY ?? 0;
  const active = dragging || elevated;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden rounded-2xl touch-row ${className}`}
      style={{
        zIndex: active ? 10 : undefined,
        transform: ty ? `translateY(${ty}px)` : undefined,
        transition: dragging ? "none" : "transform 150ms ease",
      }}
    >
      <button
        type="button"
        aria-label={deleteLabel}
        data-swipe-ignore
        onClick={() => {
          close();
          onDeleteRequest();
        }}
        className="absolute right-0 top-0 h-full flex items-center justify-center text-white bg-red-500"
        style={{ width: SWIPE_REVEAL_PX }}
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <div
        className="bg-nm-bg"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? "none" : "transform 200ms ease",
          boxShadow: active ? "var(--nm-raised)" : undefined,
          borderRadius: "inherit",
        }}
      >
        {children}
      </div>
    </div>
  );
}
