import { ChevronLeft } from "lucide-react";
import { useUIStore } from "../store/uiStore";

interface BackHeaderProps {
  title: string;
  onBack: () => void;
}

export function BackHeader({ title, onBack }: BackHeaderProps) {
  const updatePending = useUIStore((s) => s.updatePending);

  return (
    <div className={`flex items-center gap-3 px-4 pb-2 shrink-0 border-b border-am-separator ${updatePending ? "pt-2" : "safe-top"}`}>
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로"
        className="w-9 h-9 am-icon-btn flex items-center justify-center shrink-0 text-am-accent"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-semibold truncate text-am-text">{title}</h1>
    </div>
  );
}
