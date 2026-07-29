import { ChevronLeft } from "lucide-react";

interface BackHeaderProps {
  title: string;
  onBack: () => void;
}

export function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 pb-2 shrink-0 safe-top">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로"
        className="w-9 h-9 rounded-full nm-flat flex items-center justify-center shrink-0"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-semibold truncate">{title}</h1>
    </div>
  );
}
