import { useEffect, useState } from "react";

// iOS keeps the layout viewport at full height when the keyboard opens, so
// bottom chrome would otherwise sit hidden behind it. The shell itself is
// sized in CSS (h-dvh); this only reports whether the keyboard is up.
export function useViewport() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const apply = () => setKeyboardOpen(window.innerHeight - vv.height > 120);

    apply();
    vv.addEventListener("resize", apply);
    return () => vv.removeEventListener("resize", apply);
  }, []);

  return { keyboardOpen };
}
