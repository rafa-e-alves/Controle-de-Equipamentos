import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { useModalLock } from "../lib/useModalLock";
import { CustomSelect } from "./PortalDropdown";

type Item = {
  id: number; category_id: number; brand: string; model: string;
  type: string; condition: "Novo" | "Usado"; quantity: number;
};

export default function ItemUpsertModal({
  open, mode, token, categoryId, categoryName, initialItem, onClose, onSuccess, onToast,
}: {
  open: boolean; mode: "create" | "edit"; token: string; categoryId: number; categoryName: string;
  initialItem?: Item | null; onClose: () => void; onSuccess: () => void;
  onToast?: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("N/A");
  const [condition, setCondition] = useState<"Novo" | "Usado">("Novo");
  const [quantity, setQuantity] = useState<number>(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const title = useMemo(() => (mode === "create" ? "Adicionar item" : "Editar item"), [mode]);

  useModalLock(open);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (mode === "edit" && initialItem) {
      setBrand(initialItem.brand || ""); setModel(initialItem.model || "");
      setType(initialItem.type || "N/A"); setCondition(initialItem.condition || "Novo");
      setQuantity(Number(initialItem.quantity ?? 1));
    } else {
      setBrand(""); setModel(""); setType("N/A"); setCondition("Novo"); setQuantity(1);
    }
  }, [open, mode, initialItem]);

  const save = async () => {
    setErr(null);
    if (!brand.trim()) return setErr("Marca é obrigatória.");
    if (quantity <= 0) return setErr("Quantidade inválida.");
    setBusy(true);
    try {
      if (mode === "create") {
        await apiFetch("/items", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ category_id: categoryId, brand, model, type, condition, quantity }),
        });
        onToast?.("Item adicionado com sucesso!");
      } else {
        if (!initialItem?.id) throw new Error("Item inválido para edição");
        await apiFetch(`/items/${initialItem.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ brand, model, type, condition, quantity }),
        });
        onToast?.("Item atualizado com sucesso!");
      }
      onSuccess(); onClose();
    } catch (e: any) {
      setErr(e?.message || "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl">
        <div className="p-5 border-b border-white/10">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-white/55 mt-1">Categoria: <span className="text-white/75 font-medium">{categoryName}</span></div>
        </div>
        <div className="p-5 space-y-4">
          {err && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 text-sm">{err}</div>}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Marca *">
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Dell"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60" />
            </Field>
            <Field label="Modelo">
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ex: Latitude 5420"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Tipo"><CustomSelect value={type} onChange={setType} options={["Com fio", "Sem fio", "N/A"]} /></Field>
            <Field label="Condição *"><CustomSelect value={condition} onChange={(v) => setCondition(v as "Novo" | "Usado")} options={["Novo", "Usado"]} /></Field>
          </div>
          <Field label="Quantidade *">
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60" />
          </Field>
        </div>
        <div className="p-5 border-t border-white/10 flex gap-3 justify-end">
          <button onClick={onClose} disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">Cancelar</button>
          <button onClick={save} disabled={busy}
            className="px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/20 border border-[rgb(var(--brand))]/30 text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand))]/28 transition text-sm font-semibold">
            {busy ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs text-white/60 mb-1">{label}</div>{children}</div>;
}