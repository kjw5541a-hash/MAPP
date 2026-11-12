import { useState } from "react";

interface RenamePlaylistModalProps {
  initialName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export function RenamePlaylistModal({
  initialName,
  onClose,
  onRename,
}: RenamePlaylistModalProps) {
  const [name, setName] = useState(initialName);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onRename(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm bg-white border border-am-separator rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-am-text mb-4">재생목록 이름 변경</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            else if (e.key === "Escape") onClose();
          }}
          placeholder="재생목록 이름"
          className="w-full bg-am-fill rounded-xl px-4 py-3 outline-none text-am-text placeholder:text-am-muted"
        />
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-am-fill text-am-muted font-medium"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-full bg-am-fill text-am-accent font-medium disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
