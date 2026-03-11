import { useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useModalLock } from '../lib/useModalLock';
import { PortalDropdown } from './PortalDropdown';

type Item = { id: number; brand: string; model: string; condition: string; quantity: number };

const MOTIVOS = [
  "Uso interno", "Empréstimo", "Manutenção", "Descarte",
];

export default function RequestModal({ open, item, categoryName, token, onClose, onSuccess }: {
  open: boolean; item: Item | null; categoryName: string; token: string; onClose: () => void; onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null!);

  useModalLock(open);

  if (!open || !item) return null;

  const submit = async () => {
    setErr(null);
    if (quantity <= 0 || quantity > item.quantity) return setErr('Quantidade inválida.');
    if (!reason) return setErr('Selecione o motivo da retirada.');
    setBusy(true);
    try {
      await apiFetch('/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_id: item.id, quantity, reason }),
      });
      setQuantity(1); setReason('');
      onSuccess(); onClose();
    } catch (e: any) {
      setErr(e?.message || 'Erro ao enviar solicitação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl">
        <div className="p-5 border-b border-white/10">
          <div className="text-lg font-semibold">Solicitar retirada</div>
          <div className="text-xs text-white/50 mt-1">{item.brand} {item.model} — {categoryName}</div>
        </div>
        <div className="p-5 space-y-4">
          {err && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 text-sm">{err}</div>}
          <div>
            <div className="text-xs text-white/50 mb-1">Disponível: <span className="text-white font-semibold">{item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}</span></div>
            <div className="text-xs text-white/60 mb-1.5">Quantidade a retirar *</div>
            <input type="number" min={1} max={item.quantity} value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60" />
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1.5">Motivo *</div>
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
          <button onClick={onClose} disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">Cancelar</button>
          <button onClick={submit} disabled={busy || !reason}
            className="px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/20 border border-[rgb(var(--brand))]/30 text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand))]/28 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {busy ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </div>
      </div>
    </div>
  );
}