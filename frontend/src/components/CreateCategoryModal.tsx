import { useState } from "react";
import { apiFetch } from "../lib/api";
import { useModalLock } from "../lib/useModalLock";

export default function CreateCategoryModal({
  token,
  open,
  onClose,
  onCreated,
}: {
  token: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useModalLock(open);
  if (!open) return null;

  const create = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      await apiFetch("/categories", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      setName("");
      onCreated();
      onClose();
    } catch (e: any) {
      alert(e?.message || "Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") create();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Nova Categoria</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-lg">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-white/50 mb-1">Nome</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKey}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60"
              placeholder="Ex: Monitores, Notebooks..."
              autoFocus
            />
          </div>
          <button onClick={create} disabled={loading || !name.trim()}
            className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/25 border border-[rgb(var(--brand))]/40 text-sm font-semibold hover:bg-[rgb(var(--brand))]/32 transition disabled:opacity-50">
            {loading ? "Criando..." : "Criar Categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}