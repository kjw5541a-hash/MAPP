import { useRef } from "react";
import { Plus, FolderPlus } from "lucide-react";
import { useLibraryStore } from "../store/libraryStore";

declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

const SUPPORTS_DIRECTORY =
  typeof HTMLInputElement !== "undefined" && "webkitdirectory" in HTMLInputElement.prototype;

interface ImportButtonProps {
  variant?: "icon" | "full";
}

export function ImportButton({ variant = "icon" }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
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
        ref={fileInputRef}
        type="file"
        accept=".m4a,audio/mp4,audio/x-m4a"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      {SUPPORTS_DIRECTORY && (
        <input
          ref={folderInputRef}
          type="file"
          accept=".m4a,audio/mp4,audio/x-m4a"
          multiple
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={handleChange}
        />
      )}
      {variant === "icon" ? (
        <>
          <button
            type="button"
            aria-label="곡 추가"
            title="곡 추가"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full nm-flat flex items-center justify-center shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
          {SUPPORTS_DIRECTORY && (
            <button
              type="button"
              aria-label="폴더 추가"
              title="폴더 추가"
              onClick={() => folderInputRef.current?.click()}
              className="w-9 h-9 rounded-full nm-flat flex items-center justify-center shrink-0"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 rounded-full nm-raised text-nm-accent font-medium"
          >
            <Plus className="w-4 h-4" /> m4a 파일 추가
          </button>
          {SUPPORTS_DIRECTORY && (
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 rounded-full nm-raised text-nm-accent font-medium"
            >
              <FolderPlus className="w-4 h-4" /> 폴더 추가
            </button>
          )}
        </div>
      )}
    </>
  );
}
