import { useState } from "react";
import { useLibraryStore } from "../../store/libraryStore";

interface NewPlaylistModalProps {
  onClose: () => void;
  onCreated?: (playlistId: string) => void;
}

export function NewPlaylistModal({ onClose, onCreated }: NewPlaylistModalProps) {
  const [name, setName] = useState("");
  const createPlaylist = useLibraryStore((s) => s.createPlaylist);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const playlist = await createPlaylist(trimmed);
    onCreated?.(playlist.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm nm-raised rounded-3xl p-5">
        <h2 className="text-lg font-semibold mb-4">새로운 재생목록</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="재생목록 이름"
          className="w-full nm-inset-sm rounded-xl px-4 py-3 outline-none placeholder:text-nm-text-muted"
        />
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full nm-flat text-nm-text-muted font-medium"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-full nm-flat text-nm-accent font-medium disabled:opacity-40"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  );
}
