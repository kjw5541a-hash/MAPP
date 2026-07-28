import { useRef } from "react";
import { Plus } from "lucide-react";
import { useLibraryStore } from "../store/libraryStore";

interface ImportButtonProps {
  variant?: "icon" | "full";
}

export function ImportButton({ variant = "icon" }: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const importFiles = useLibraryStore((s) => s.importFiles);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      importFiles(e.target.files);
    }
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".m4a,audio/mp4,audio/x-m4a"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      {variant === "icon" ? (
        <button
          type="button"
          aria-label="곡 추가"
          onClick={() => inputRef.current?.click()}
          className="w-9 h-9 rounded-full nm-flat flex items-center justify-center shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-6 py-3 rounded-full nm-raised text-nm-accent font-medium"
        >
          <Plus className="w-4 h-4" /> m4a 파일 추가
        </button>
      )}
    </>
  );
}
