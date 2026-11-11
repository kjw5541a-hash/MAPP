import { useEffect } from "react";
import { useLibraryStore } from "../store/libraryStore";

export function ImportToast() {
  const result = useLibraryStore((s) => s.importResult);
  const dismiss = useLibraryStore((s) => s.dismissImportResult);
  const progress = useLibraryStore((s) => s.importProgress);

  useEffect(() => {
    if (!result) return;
    const id = setTimeout(dismiss, 4000);
    return () => clearTimeout(id);
  }, [result, dismiss]);

  if (progress.active) {
    return (
      <div className="px-3 pb-2">
        <div className="w-full nm-flat rounded-2xl px-4 py-2.5 text-[13px] text-nm-text-muted text-center">
          {progress.done}/{progress.total}곡 가져오는 중…
        </div>
      </div>
    );
  }

  if (!result) return null;

  const parts = [`${result.added}곡 추가`];
  if (result.skipped > 0) parts.push(`중복 ${result.skipped}곡 건너뜀`);
  if (result.failed > 0) parts.push(`실패 ${result.failed}곡`);
  if (result.quotaExceeded) parts.push("저장 공간이 부족합니다");
  else if (result.failedReason) parts.push(result.failedReason);

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
