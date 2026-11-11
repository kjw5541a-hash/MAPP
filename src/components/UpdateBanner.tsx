import { useUIStore } from "../store/uiStore";

export function UpdateBanner() {
  const updatePending = useUIStore((s) => s.updatePending);

  if (!updatePending) return null;

  return (
    <div role="status" className="shrink-0 px-3 pb-2 safe-top">
      <div className="w-full nm-flat rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-[13px]">
        <span className="font-medium truncate text-nm-text">새 버전이 준비됐습니다</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 px-3 py-1.5 rounded-full nm-raised text-nm-accent font-medium text-xs"
        >
          지금 업데이트
        </button>
      </div>
    </div>
  );
}
