import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
import { useModalLock } from "../lib/useModalLock";
import { PortalDropdown } from "./PortalDropdown";

type Item = { id: number; brand: string; model: string; quantity: number };

const MOTIVOS = [
  "Uso interno",
  "Empréstimo",
  "Manutenção",
  "Descarte",
];

export default function SaidaModal({ open, onClose, item, token, onSuccess }: {
  open: boolean; onClose: () => void; item: Item | null; token: string; onSuccess: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null!);

  useModalLock(open);

  useEffect(() => {
    if (open) { setQty(1); setReason(""); setLoading(false); setDropdownOpen(false); }
  }, [open]);

  if (!open || !item) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0 || qty > item.quantity || !reason) return;
    setLoading(true);
    try {
      await apiFetch(`/items/${item.id}/saida`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity: qty, reason }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Erro ao registrar saída");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl">

        <div className="p-5 border-b border-white/10">
          <div className="text-lg font-semibold">Registrar saída</div>
          <div className="text-sm text-white/55">{item.brand} {item.model}</div>
        </div>

        <form onSubmit={submit}>
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs text-white/50">Disponível</div>
              <div className="text-xl font-bold mt-0.5">{item.quantity} {item.quantity === 1 ? "unidade" : "unidades"}</div>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Quantidade *</label>
              <input type="number" min={1} max={item.quantity} value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60"
                required />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Motivo *</label>
              <button ref={anchorRef} type="button" onClick={() => setDropdownOpen((v) => !v)}
                className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-left flex items-center justify-between transition
                  ${dropdownOpen ? "border-[rgb(var(--brand))]/60 ring-2 ring-[rgb(var(--brand))]/30" : "border-white/10 hover:border-white/20"}`}>
                <span className={reason ? "text-white text-sm" : "text-white/40 text-sm"}>{reason || "Selecione o motivo..."}</span>
                <span className="text-white/40 text-xs">{dropdownOpen ? "▲" : "▼"}</span>
              </button>
              {dropdownOpen && (
                <PortalDropdown anchorRef={anchorRef} options={MOTIVOS} value={reason}
                  onSelect={(m) => { setReason(m); setDropdownOpen(false); }}
                  onClose={() => setDropdownOpen(false)} />
              )}
            </div>
          </div>

          <div className="p-5 border-t border-white/10 flex gap-3 justify-end">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">Cancelar</button>
            <button type="submit" disabled={loading || !reason || qty <= 0}
              className="px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/20 border border-[rgb(var(--brand))]/30 text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand))]/28 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Registrando..." : "Confirmar saída"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}