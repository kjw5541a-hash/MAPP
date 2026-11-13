import { useUIStore } from "../store/uiStore";

export function UpdateBanner() {
  const updatePending = useUIStore((s) => s.updatePending);

  if (!updatePending) return null;

  return (
    <div role="status" className="shrink-0 px-3 pb-2 safe-top">
      <div className="w-full bg-am-fill border border-am-separator rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 text-[13px]">
        <span className="font-medium truncate text-am-text">새 버전이 준비됐습니다</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 px-3 py-1.5 rounded-full bg-am-accent text-white font-medium text-xs hover:bg-am-accent/90 transition-colors"
        >
          지금 업데이트
        </button>
      </div>
    </div>
  );
}
