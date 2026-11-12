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

    const handleScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    lastWidthRef.current = vv.width;
    baselineHeightRef.current = Math.max(window.innerHeight, vv.height);
    apply();

    vv.addEventListener("resize", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    window.addEventListener("scroll", handleScroll);

    return () => {
      vv.removeEventListener("resize", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { keyboardOpen };
}
