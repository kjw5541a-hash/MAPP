import { useEffect, useRef, useState } from "react";

// With interactive-widget=resizes-content, the layout viewport resizes when the
// virtual keyboard opens. On supporting browsers, window.innerHeight shrinks
// along with visualViewport.height, so comparing (innerHeight - vv.height) would
// yield ~0 and fail to detect the keyboard. We instead track the uncontracted
// baseline height (resetting on orientation/width changes) and compare vv.height
// against it. We also ensure window.scrollY is restored to 0 when the keyboard
// closes to avoid any stuck scroll offset on iOS.
export function useViewport() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const baselineHeightRef = useRef(0);
  const lastWidthRef = useRef(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const updateBaseline = () => {
      const currentWidth = vv.width;
      const currentHeight = vv.height;

      // On orientation change or desktop resize where width changes, reset baseline
      if (Math.abs(currentWidth - lastWidthRef.current) > 1) {
        lastWidthRef.current = currentWidth;
        baselineHeightRef.current = Math.max(window.innerHeight, currentHeight);
      } else if (currentHeight > baselineHeightRef.current) {
        // Viewport expanded (e.g. keyboard closed or browser chrome collapsed)
        baselineHeightRef.current = currentHeight;
      }
    };

    const apply = () => {
      updateBaseline();
      const currentHeight = vv.height;
      const isOpen =
        baselineHeightRef.current - currentHeight > 120 ||
        window.innerHeight - currentHeight > 120;

      setKeyboardOpen(isOpen);

      if (!isOpen && window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    lastWidthRef.current = vv.width;
    baselineHeightRef.current = Math.max(window.innerHeight, vv.height);
    apply();

    vv.addEventListener("resize", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      vv.removeEventListener("resize", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  return { keyboardOpen };
}

export interface VisualViewportRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getVisualViewportRect(): VisualViewportRect {
  if (typeof window === "undefined") {
    return { top: 0, left: 0, width: 0, height: 0 };
  }
  const vv = window.visualViewport;
  if (vv) {
    return {
      top: vv.offsetTop,
      left: vv.offsetLeft,
      width: vv.width,
      height: vv.height,
    };
  }
  return {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function useVisualViewportRect(): VisualViewportRect {
  const [rect, setRect] = useState<VisualViewportRect>(getVisualViewportRect);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const next = getVisualViewportRect();
      setRect((prev) => {
        if (
          prev.top === next.top &&
          prev.left === next.left &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev;
        }
        return next;
      });
    };

    update();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return rect;
}
