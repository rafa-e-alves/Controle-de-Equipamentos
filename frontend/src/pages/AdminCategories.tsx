import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type CategoryRow = {
  id: number;
  name: string;
  item_count: number;
  total_quantity: number;
};

export default function AdminCategories({ token }: { token: string }) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // rename modal state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameOld, setRenameOld] = useState("");
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(Array.isArray(data) ? data : []);
    } catch (e: any) {
      alert(e?.message || "Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, q]);

  const create = async () => {
    const n = name.trim();
    if (!n) return alert("Digite o nome da categoria.");

    try {
      setCreating(true);
      await apiFetch("/categories", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: n }),
      });
      setName("");
      await load();
    } catch (e: any) {
      alert(e?.message || "Erro ao criar categoria");
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: number, cname: string) => {
    if (!confirm(`Remover categoria "${cname}"?`)) return;

    try {
      await apiFetch(`/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await load();
    } catch (e: any) {
      alert(
        e?.message ||
          "Não foi possível remover. Se houver itens vinculados, remova/mova os itens antes."
      );
    }
  };

  const openRename = (c: CategoryRow) => {
    setRenameId(c.id);
    setRenameOld(c.name);
    setRenameName(c.name);
    setRenameOpen(true);
  };

  const doRename = async () => {
    if (!renameId) return;
    const nn = renameName.trim();
    if (!nn) return alert("Digite o novo nome.");
    if (nn.toLowerCase() === renameOld.trim().toLowerCase()) {
      setRenameOpen(false);
      return;
    }

    try {
      setRenaming(true);
      await apiFetch(`/categories/${renameId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nn }),
      });
      setRenameOpen(false);
      await load();
    } catch (e: any) {
      alert(e?.message || "Erro ao renomear categoria");
    } finally {
      setRenaming(false);
    }
  };

  const totalCategories = categories.length;
  const totalItems = categories.reduce((acc, c) => acc + (c.item_count || 0), 0);
  const totalUnits = categories.reduce((acc, c) => acc + (c.total_quantity || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <div className="text-2xl font-bold">Categorias</div>
          <div className="text-sm text-white/50">
            Administração de categorias do inventário.
          </div>
        </div>

        <button
          onClick={load}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Categorias</div>
          <div className="text-2xl font-bold mt-1">{totalCategories}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Tipos de itens (linhas)</div>
          <div className="text-2xl font-bold mt-1">{totalItems}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/50">Unidades (estoque)</div>
          <div className="text-2xl font-bold mt-1">{totalUnits}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="font-semibold">Lista</div>
              <div className="text-xs text-white/50">
                Remoção só funciona se a categoria estiver vazia.
              </div>
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full md:w-72 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none"
              placeholder="Buscar categoria..."
            />
          </div>

          {loading ? (
            <div className="p-6 text-sm text-white/60">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-white/60">Nenhuma categoria encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/60">
                  <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left">
                    <th>Nome</th>
                    <th className="w-28">Itens</th>
                    <th className="w-32">Unidades</th>
                    <th className="w-48">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-white/70">{c.item_count}</td>
                      <td className="px-4 py-3 text-white/70">{c.total_quantity}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => openRename(c)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => remove(c.id, c.name)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/25 transition"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Criar */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="font-semibold">Criar categoria</div>
          <div className="text-xs text-white/50 mt-1">
            Ex.: “Notebooks”, “Monitores”, “Telefonia”, “Periféricos”.
          </div>

          <div className="mt-4">
            <div className="text-xs text-white/50 mb-2">Nome</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none"
              placeholder="Digite o nome..."
            />

            <button
              onClick={create}
              disabled={creating}
              className="w-full mt-3 px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/25 border border-[rgb(var(--brand))]/40 text-sm font-semibold hover:bg-[rgb(var(--brand))]/32 transition disabled:opacity-50"
            >
              {creating ? "Criando..." : "Criar"}
            </button>
          </div>

          <div className="mt-4 text-xs text-white/50">
            Dica: padronize plural (ex.: “Monitores” em vez de “Monitor”).
          </div>
        </div>
      </div>

      {/* Rename modal */}
      {renameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">Renomear categoria</div>
                <div className="text-xs text-white/50 mt-1">Atual: {renameOld}</div>
              </div>
              <button onClick={() => setRenameOpen(false)} className="text-white/60 hover:text-white">
                ✕
              </button>
            </div>

            <div className="text-xs text-white/50 mb-2">Novo nome</div>
            <input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none"
              autoFocus
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setRenameOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                Cancelar
              </button>
              <button
                onClick={doRename}
                disabled={renaming}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/25 border border-[rgb(var(--brand))]/40 font-semibold hover:bg-[rgb(var(--brand))]/32 transition disabled:opacity-50"
              >
                {renaming ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
