import { useEffect, useState } from "react";

// Temporary: iOS standalone cannot be reproduced locally, so the numbers it
// reports are surfaced in-app to pin down the gap under the tab bar.
// Remove once that is settled.
export function useViewportDiagnostics() {
  const [text, setText] = useState("");

  useEffect(() => {
    const measure = () => {
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:100dvh;visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      const dvh = Math.round(probe.getBoundingClientRect().height);
      probe.remove();

      const sab = getComputedStyle(document.documentElement).getPropertyValue("--sab").trim();
      const nav = document.querySelector("nav")?.getBoundingClientRect();
      const gap = nav ? Math.round(window.innerHeight - nav.bottom) : -1;

      setText(
        `ih${window.innerHeight} vv${Math.round(window.visualViewport?.height ?? 0)} ` +
          `ch${document.documentElement.clientHeight} dvh${dvh} sab${sab} gap${gap}`,
      );
    };

    const id = setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return text;
}
