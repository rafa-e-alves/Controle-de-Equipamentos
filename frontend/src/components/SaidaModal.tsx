import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Item = {
  id: number;
  brand: string;
  model: string;
  quantity: number;
};

export default function SaidaModal({
  open,
  onClose,
  item,
  token,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  item: Item | null;
  token: string;
  onSuccess: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setQty(1);
      setReason("");
      setLoading(false);
    }
  }, [open]);

  if (!open || !item) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (qty <= 0) return;

    if (qty > item.quantity) {
      alert("Quantidade maior que o disponível!");
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[rgb(var(--panel))]/85 backdrop-blur border border-white/10 shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Registrar saída</div>
            <div className="text-sm text-white/55">
              {item.brand} {item.model}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-xs text-white/50">Disponível</div>
          <div className="text-xl font-bold">{item.quantity} unidades</div>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Quantidade</label>
            <input
              type="number"
              min={1}
              max={item.quantity}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Motivo</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60"
              required
            >
              <option value="">Selecione...</option>
              <option value="Uso interno">Uso interno</option>
              <option value="Empréstimo">Empréstimo</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Transferência">Transferência</option>
              <option value="Descarte">Descarte</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-black
                       bg-[rgb(var(--brand))] hover:brightness-110 transition
                       disabled:opacity-60 disabled:hover:brightness-100"
          >
            {loading ? "Registrando..." : "Confirmar saída"}
          </button>
        </form>
      </div>
    </div>
  );
}
