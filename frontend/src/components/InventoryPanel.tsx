import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";
import SaidaModal from "./SaidaModal";
import ItemUpsertModal from "./ItemUpsertModal";
import ConfirmModal from "./ConfirmModal";

type Category = {
  id: number;
  name: string;
  item_count: number;
  total_quantity: number;
  expanded: boolean;
  items: Item[];
};

type Item = {
  id: number;
  category_id: number;
  brand: string;
  model: string;
  type: string;
  condition: "Novo" | "Usado";
  quantity: number;
};

type Stats = {
  totalQuantity: number;
  newItems: number;
  usedItems: number;
};

function plural(n: number, singular: string, plural: string) {
  return n === 1 ? singular : plural;
}

export default function InventoryPanel({
  token,
  isAdmin,
  onDataChanged,
}: {
  token: string;
  isAdmin: boolean;
  onDataChanged?: () => void;
}) {
  const onChanged = onDataChanged || (() => {});

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<Stats>({ totalQuantity: 0, newItems: 0, usedItems: 0 });
  const [statsError, setStatsError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [saidaOpen, setSaidaOpen] = useState(false);
  const [saidaItem, setSaidaItem] = useState<Item | null>(null);

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<"create" | "edit">("create");
  const [upsertCategory, setUpsertCategory] = useState<{ id: number; name: string } | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);

  const loadStats = async () => {
    try {
      setStatsError(null);
      const s = await apiFetch("/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats({
        totalQuantity: Number(s?.totalQuantity || 0),
        newItems: Number(s?.newItems || 0),
        usedItems: Number(s?.usedItems || 0),
      });
    } catch (e: any) {
      setStatsError(e?.message || "Erro ao carregar stats");
      setStats({ totalQuantity: 0, newItems: 0, usedItems: 0 });
    }
  };

  const loadItems = async (categoryId: number) => {
    const items = await apiFetch(`/categories/${categoryId}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, items } : c)));
  };

  const loadCategories = async (preserveExpandedIds: number[] = []) => {
    setLoading(true);
    try {
      const data = await apiFetch("/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const next: Category[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        item_count: c.item_count,
        total_quantity: c.total_quantity,
        expanded: preserveExpandedIds.includes(c.id),
        items: [],
      }));

      setCategories(next);

      for (const id of preserveExpandedIds) {
        await loadItems(id);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (categoryId: number) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;

    if (!cat.expanded && cat.items.length === 0) {
      await loadItems(categoryId);
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, expanded: !c.expanded } : c))
    );
  };

  const refreshAll = async () => {
    const expandedIds = categories.filter((c) => c.expanded).map((c) => c.id);
    await Promise.all([loadCategories(expandedIds), loadStats()]);
    onChanged();
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadCategories(), loadStats()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const openCreate = (cat: Category) => {
    setUpsertMode("create");
    setUpsertCategory({ id: cat.id, name: cat.name });
    setEditingItem(null);
    setUpsertOpen(true);
  };

  const openEdit = (cat: Category, item: Item) => {
    setUpsertMode("edit");
    setUpsertCategory({ id: cat.id, name: cat.name });
    setEditingItem(item);
    setUpsertOpen(true);
  };

  const askDelete = (item: Item) => {
    setDeleteItem(item);
    setDeleteOpen(true);
  };

  const doDelete = async () => {
    if (!deleteItem) return;
    setDeleteBusy(true);
    try {
      await apiFetch(`/items/${deleteItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteOpen(false);
      setDeleteItem(null);
      await refreshAll();
    } catch {
      setDeleteOpen(false);
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-white/60">
        Carregando inventário…
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="mb-4">
          <div className="text-2xl font-bold">Visão geral</div>
          <div className="text-sm text-white/50">Estoque e movimentações</div>
        </div>

        {statsError && (
          <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Erro ao carregar métricas: {statsError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div className="rounded-2xl border border-[rgb(var(--brand))]/20 bg-[rgb(var(--brand))]/8 p-4">
            <div className="text-xs text-white/60">Total em estoque</div>
            <div className="text-3xl font-bold mt-1">{stats.totalQuantity}</div>
          </div>

          <div className="rounded-2xl border border-[rgb(var(--brand))]/20 bg-[rgb(var(--brand))]/8 p-4">
            <div className="text-xs text-white/60">Itens novos</div>
            <div className="text-3xl font-bold mt-1">{stats.newItems}</div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
            <div className="text-xs text-white/60">Itens usados</div>
            <div className="text-3xl font-bold mt-1">{stats.usedItems}</div>
          </div>
        </div>

        {/* Barra de categorias */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Categorias</div>
            <div className="text-xs text-white/50">
              Expanda para ver itens {isAdmin ? "e registrar saída" : "(apenas visualização)"}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60 text-sm"
            />
            <button
              onClick={refreshAll}
              className="px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 hover:bg-white/12 transition text-sm"
              title="Recarregar inventário"
            >
              ↻
            </button>
          </div>
        </div>

        <div className="space-y-3 pb-10">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  onClick={() => toggleCategory(c.id)}
                  className="flex-1 flex items-center justify-between hover:bg-white/0 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[rgb(var(--brand))]/12 border border-[rgb(var(--brand))]/20 flex items-center justify-center text-[rgb(var(--brand))]">
                      ▣
                    </div>

                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-white/50">
                        {c.item_count} {plural(c.item_count, "item", "itens")} • {c.total_quantity} {plural(c.total_quantity, "unidade", "unidades")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/6 border border-white/10 text-white/70">
                      {c.total_quantity} {plural(c.total_quantity, "un", "un")}
                    </span>
                    <div className="text-sm text-white/60">{c.expanded ? "▲" : "▼"}</div>
                  </div>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => openCreate(c)}
                    className="ml-3 px-3 py-2 rounded-xl bg-[rgb(var(--brand))]/20 border border-[rgb(var(--brand))]/30 text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand))]/28 transition text-sm font-semibold"
                    title="Adicionar item"
                  >
                    + Adicionar
                  </button>
                )}
              </div>

              {c.expanded && (
                <div className="border-t border-white/10">
                  {c.items.length === 0 ? (
                    <div className="px-5 py-6 text-sm text-white/50">Nenhum item nesta categoria.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-white/60">
                          <tr className="border-b border-white/10">
                            <th className="text-left px-5 py-3 font-medium">Marca</th>
                            <th className="text-left px-5 py-3 font-medium">Modelo</th>
                            <th className="text-left px-5 py-3 font-medium">Tipo</th>
                            <th className="text-left px-5 py-3 font-medium">Condição</th>
                            <th className="text-left px-5 py-3 font-medium">Qtd</th>
                            <th className="text-left px-5 py-3 font-medium">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.items.map((it) => (
                            <tr key={it.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-5 py-3">{it.brand}</td>
                              <td className="px-5 py-3">{it.model}</td>
                              <td className="px-5 py-3 text-white/70">{it.type}</td>
                              <td className="px-5 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs border ${
                                    it.condition === "Novo"
                                      ? "bg-[rgb(var(--brand))]/12 border-[rgb(var(--brand))]/25 text-[rgb(var(--brand))]"
                                      : "bg-amber-500/10 border-amber-500/25 text-amber-200"
                                  }`}
                                >
                                  {it.condition}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-semibold">{it.quantity}</td>
                              <td className="px-5 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {isAdmin && (
                                    <button
                                      onClick={() => { setSaidaItem(it); setSaidaOpen(true); }}
                                      className="px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-200 hover:bg-orange-500/25 transition text-xs"
                                    >
                                      Saída
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <>
                                      <button
                                        onClick={() => openEdit(c, it)}
                                        className="px-3 py-1.5 rounded-lg bg-white/6 border border-white/10 text-white/80 hover:bg-white/10 transition text-xs"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => askDelete(it)}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/25 transition text-xs"
                                      >
                                        Deletar
                                      </button>
                                    </>
                                  )}
                                  {!isAdmin && (
                                    <span className="text-xs text-white/40">Somente visualização</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!isAdmin && (
                    <div className="px-5 py-4 text-xs text-white/40">
                      Você está como usuário. Funções administrativas ficam disponíveis apenas para Admin.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <SaidaModal
        open={saidaOpen}
        onClose={() => setSaidaOpen(false)}
        item={saidaItem}
        token={token}
        onSuccess={refreshAll}
      />

      <ItemUpsertModal
        open={upsertOpen}
        mode={upsertMode}
        token={token}
        categoryId={upsertCategory?.id || 0}
        categoryName={upsertCategory?.name || ""}
        initialItem={editingItem}
        onClose={() => setUpsertOpen(false)}
        onSuccess={refreshAll}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Remover item?"
        description="Essa ação remove o item do inventário. (O log é registrado.)"
        confirmText="Remover"
        danger
        busy={deleteBusy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={doDelete}
      />
    </>
  );
}