import { useRef, useState } from "react";
import { arrayMove } from "../lib/arrayMove";

const ROW_GAP = 4; // px — matches the list's gap-1

/** Long-press-drag reordering for a flat id list: tracks a live-reordered
 *  copy while the drag is in progress, and only commits the final order
 *  (via onCommit) on release, to avoid spamming writes per frame. */
export function useDragReorder(ids: string[], onCommit: (ids: string[]) => void) {
  const [workingIds, setWorkingIds] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const rowHeight = useRef(0);
  const originalIndex = useRef(0);
  const currentIndex = useRef(0);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const workingIdsRef = useRef<string[] | null>(null);

  const orderedIds = workingIds ?? ids;

  const startDrag = (trackId: string, index: number) => {
    const el = rowRefs.current[trackId];
    rowHeight.current = (el?.getBoundingClientRect().height ?? 60) + ROW_GAP;
    originalIndex.current = index;
    currentIndex.current = index;
    workingIdsRef.current = ids;
    setWorkingIds(ids);
    setDraggingId(trackId);
  };

  const moveDrag = (trackId: string, deltaY: number) => {
    const step = rowHeight.current || 60;
    const rawSteps = Math.round(deltaY / step);
    const len = ids.length;
    const targetIndex = Math.max(0, Math.min(len - 1, originalIndex.current + rawSteps));
    const appliedSteps = targetIndex - originalIndex.current;
    setDragOffsetY(deltaY - appliedSteps * step);

    if (targetIndex !== currentIndex.current) {
      const prev = workingIdsRef.current ?? ids;
      const from = prev.indexOf(trackId);
      const next = arrayMove(prev, from, targetIndex);
      workingIdsRef.current = next;
      setWorkingIds(next);
      currentIndex.current = targetIndex;
    }
  };

  const endDrag = () => {
    if (workingIdsRef.current) onCommit(workingIdsRef.current);
    workingIdsRef.current = null;
    setWorkingIds(null);
    setDraggingId(null);
    setDragOffsetY(0);
  };

  return { orderedIds, draggingId, dragOffsetY, rowRefs, startDrag, moveDrag, endDrag };
}
