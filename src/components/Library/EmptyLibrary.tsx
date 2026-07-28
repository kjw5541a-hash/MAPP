import { Music2 } from "lucide-react";
import { ImportButton } from "../ImportButton";
import { useLibraryStore } from "../../store/libraryStore";

export function EmptyLibrary() {
  const importProgress = useLibraryStore((s) => s.importProgress);

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full px-8 text-center">
      <div className="w-20 h-20 rounded-3xl nm-raised flex items-center justify-center text-nm-text-muted">
        <Music2 className="w-9 h-9" />
      </div>
      {importProgress.active ? (
        <p className="text-nm-text-muted text-sm">
          가져오는 중… {importProgress.done}/{importProgress.total}
        </p>
      ) : (
        <>
          <p className="text-nm-text-muted text-sm">
            아직 라이브러리에 곡이 없습니다.
            <br />
            m4a 파일을 추가해보세요.
          </p>
          <ImportButton variant="full" />
        </>
      )}
    </div>
  );
}
