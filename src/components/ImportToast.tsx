import { useEffect } from "react";
import { useLibraryStore } from "../store/libraryStore";

export function ImportToast() {
  const result = useLibraryStore((s) => s.importResult);
  const dismiss = useLibraryStore((s) => s.dismissImportResult);

  useEffect(() => {
    if (!result) return;
    const id = setTimeout(dismiss, 4000);
    return () => clearTimeout(id);
  }, [result, dismiss]);

  if (!result) return null;

  const parts = [`${result.added}곡 추가`];
  if (result.skipped > 0) parts.push(`중복 ${result.skipped}곡 건너뜀`);
  if (result.failed > 0) parts.push(`실패 ${result.failed}곡`);

  return (
    <div className="px-3 pb-2">
      <button
        type="button"
        onClick={dismiss}
        className="w-full nm-flat rounded-2xl px-4 py-2.5 text-[13px] text-nm-text-muted"
      >
        {parts.join(" · ")}
      </button>
    </div>
  );
}
