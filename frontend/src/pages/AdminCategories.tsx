import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import { useModalLock } from "../lib/useModalLock";
import ConfirmModal from "../components/ConfirmModal";

type CategoryRow = { id: number; name: string; item_count: number; total_quantity: number };

export default function AdminCategories({ token, onToast }: { token: string; onToast: (msg: string, type?: "success" | "error" | "info") => void }) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameOld, setRenameOld] = useState("");
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<CategoryRow | null>(null);
  const [removing, setRemoving] = useState(false);

  useModalLock(renameOpen || confirmOpen);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/categories", { headers: { Authorization: `Bearer ${token}` } });
      setCategories(Array.isArray(data) ? data : []);
    } catch (e: any) {
      onToast(e?.message || "Erro ao carregar categorias", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, q]);

  const create = async () => {
    const n = name.trim();
    if (!n) return;
    try {
      setCreating(true);
      await apiFetch("/categories", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: n }),
      });
      setName("");
      onToast(`Categoria "${n}" criada com sucesso!`, "success");
      await load();
    } catch (e: any) {
      onToast(e?.message || "Erro ao criar categoria", "error");
    } finally {
      setCreating(false);
    }
  };

  const askRemove = (c: CategoryRow) => {
    setConfirmTarget(c);
    setConfirmOpen(true);
  };

  const doRemove = async () => {
    if (!confirmTarget) return;
    try {
      setRemoving(true);
      await apiFetch(`/categories/${confirmTarget.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      onToast(`Categoria "${confirmTarget.name}" removida.`, "success");
      setConfirmOpen(false);
      setConfirmTarget(null);
      await load();
    } catch (e: any) {
      onToast(e?.message || "Não foi possível remover. Remova os itens vinculados antes.", "error");
      setConfirmOpen(false);
    } finally {
      setRemoving(false);
    }
  };

  const openRename = (c: CategoryRow) => {
    setRenameId(c.id); setRenameOld(c.name); setRenameName(c.name); setRenameOpen(true);
  };

  const doRename = async () => {
    if (!renameId) return;
    const nn = renameName.trim();
    if (!nn) { onToast("Digite o novo nome.", "error"); return; }
    if (nn.toLowerCase() === renameOld.trim().toLowerCase()) { setRenameOpen(false); return; }
    try {
      setRenaming(true);
      await apiFetch(`/categories/${renameId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nn }),
      });
      setRenameOpen(false);
      onToast(`Categoria renomeada para "${nn}".`, "success");
      await load();
    } catch (e: any) {
      onToast(e?.message || "Erro ao renomear categoria", "error");
    } finally {
      setRenaming(false);
    }
  };

  const totalItems = categories.reduce((acc, c) => acc + (c.item_count || 0), 0);
  const totalUnits = categories.reduce((acc, c) => acc + (c.total_quantity || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <div className="text-2xl font-bold">Categorias</div>
          <div className="text-sm text-white/50">Administração de categorias do inventário.</div>
        </div>
        <button onClick={load}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Categorias</div>
          <div className="text-2xl font-bold mt-1">{categories.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Tipos de itens</div>
          <div className="text-2xl font-bold mt-1">{totalItems}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Unidades em estoque</div>
          <div className="text-2xl font-bold mt-1">{totalUnits}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold">Lista</div>
              <div className="text-xs text-white/50">Remoção só funciona se a categoria estiver vazia.</div>
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)}
              className="w-full md:w-72 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60 text-sm"
              placeholder="Buscar categoria..." />
          </div>
          {loading ? (
            <div className="p-6 text-sm text-white/60">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-white/60">Nenhuma categoria encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-white/60">
                  <tr>
                    <th className="px-4 py-3 text-left">Nome</th>
                    <th className="px-4 py-3 text-left w-24">Itens</th>
                    <th className="px-4 py-3 text-left w-28">Unidades</th>
                    <th className="px-4 py-3 text-left w-44">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-white/70">{c.item_count}</td>
                      <td className="px-4 py-3 text-white/70">{c.total_quantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openRename(c)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs hover:bg-white/10 transition">Editar</button>
                          <button onClick={() => askRemove(c)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs hover:bg-red-500/25 transition">Remover</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="font-semibold mb-1">Criar categoria</div>
          <div className="text-xs text-white/50 mb-4">Ex.: "Notebooks", "Monitores", "Telefonia", "Periféricos".</div>
          <div className="text-xs text-white/50 mb-1.5">Nome</div>
          <input value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60 text-sm mb-3"
            placeholder="Digite o nome..." />
          <button onClick={create} disabled={creating || !name.trim()}
            className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/25 border border-[rgb(var(--brand))]/40 text-sm font-semibold hover:bg-[rgb(var(--brand))]/32 transition disabled:opacity-50">
            {creating ? "Criando..." : "Criar"}
          </button>
          <div className="mt-3 text-xs text-white/40">Dica: padronize no plural (ex.: "Monitores" em vez de "Monitor").</div>
        </div>
      </div>

      {/* Modal renomear */}
      {renameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setRenameOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">Renomear categoria</div>
                <div className="text-xs text-white/50 mt-0.5">Atual: {renameOld}</div>
              </div>
              <button onClick={() => setRenameOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs hover:bg-white/10 transition">✕</button>
            </div>
            <div className="text-xs text-white/50 mb-1.5">Novo nome</div>
            <input value={renameName} onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doRename()}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60 mb-4"
              autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setRenameOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm">Cancelar</button>
              <button onClick={doRename} disabled={renaming}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/25 border border-[rgb(var(--brand))]/40 text-sm font-semibold hover:bg-[rgb(var(--brand))]/32 transition disabled:opacity-50">
                {renaming ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar remoção */}
      <ConfirmModal
        open={confirmOpen}
        title={`Remover "${confirmTarget?.name}"?`}
        description="A categoria será removida permanentemente. Isso só será possível caso não haja itens vinculados a mesma."
        confirmText="Remover"
        danger
        busy={removing}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        onConfirm={doRemove}
      />
    </div>
  );
}