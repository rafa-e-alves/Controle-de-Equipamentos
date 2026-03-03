import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";
export type ToastData = { id: number; message: string; type: ToastType };

const STYLES: Record<ToastType, string> = {
  success: "bg-green-500/20 border-green-500/40 text-green-200",
  error: "bg-red-500/20 border-red-500/40 text-red-200",
  info: "bg-white/10 border-white/20 text-white/90",
};

const ICONS: Record<ToastType, string> = {
  success: "\u2713",
  error: "\u2715",
  info: "\u2139",
};

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => setVisible(false), 2800);
    const t3 = setTimeout(() => onRemove(toast.id), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [toast.id, onRemove]);
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all duration-300 ${STYLES[toast.type]} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
      <span>{ICONS[toast.type]}</span>
      <span>{toast.message}</span>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: { toasts: ToastData[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}

let _id = 0;
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const show = (message: string, type: ToastType = "success") => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  return { toasts, show, remove };
}