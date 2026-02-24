export default function ConfirmModal({
  open,
  title,
  description,
  confirmText,
  danger,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10">
          <div className="text-lg font-semibold">{title}</div>
          {description && <div className="text-sm text-white/55 mt-1">{description}</div>}
        </div>

        <div className="p-5 border-t border-white/10 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm"
            disabled={busy}
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className={
              danger
                ? "px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/25 transition text-sm font-semibold"
                : "px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/20 border border-[rgb(var(--brand))]/30 text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand))]/28 transition text-sm font-semibold"
            }
            disabled={busy}
          >
            {busy ? "Aguarde..." : confirmText || "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
