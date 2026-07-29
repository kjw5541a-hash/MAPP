import { useEffect, useState } from "react";

// iOS keeps the layout viewport at full height when the keyboard opens, so
// bottom chrome ends up hidden behind it. Drive the shell's height from the
// visual viewport instead, and report whether the keyboard is up.
export function useViewport() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;

    const apply = () => {
      const height = vv?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
      setKeyboardOpen(window.innerHeight - height > 120);
    };

    apply();
    vv?.addEventListener("resize", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      vv?.removeEventListener("resize", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  return { keyboardOpen };
}
