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
      <div className="w-full max-w-xs nm-raised rounded-3xl p-5 text-center">
        <h2 className="text-[16px] font-semibold">{title}</h2>
        {description && <p className="text-[13px] text-nm-text-muted mt-2">{description}</p>}
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full nm-flat text-nm-text-muted font-medium"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-full nm-flat text-red-500 font-medium"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
