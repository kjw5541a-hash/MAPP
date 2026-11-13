interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "삭제",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-xs bg-white border border-am-separator rounded-2xl p-5 text-center">
        <h2 className="text-[16px] font-semibold text-am-text">{title}</h2>
        {description && <p className="text-[13px] text-am-muted mt-2">{description}</p>}
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full bg-am-fill text-am-muted font-medium"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-full bg-am-fill text-am-accent font-medium"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
