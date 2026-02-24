import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type Log = {
  id: number;
  created_at: string;
  action_type: string;
  user_name: string;
  item_brand: string;
  item_model: string;
  category_name: string;
  quantity: number;
  details: string;
};

const ACTION_STYLES: Record<string, string> = {
  ENTRADA: "bg-green-500/15 border-green-500/30 text-green-300",
  SAÍDA: "bg-red-500/15 border-red-500/30 text-red-300",
  EDIÇÃO: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  EXCLUSÃO: "bg-zinc-500/15 border-zinc-500/30 text-zinc-300",
};

export default function AdminLogs({ token }: { token: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  const loadLogs = async () => {
    setLoading(true);
    try {
      const url =
        filter === "all"
          ? "/logs"
          : `/logs?action_type=${encodeURIComponent(filter)}`;

      const data = await apiFetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const data = await apiFetch("/logs/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStats(data);
  };

  useEffect(() => {
    loadLogs();
    loadStats();
    // eslint-disable-next-line
  }, [filter]);

  const filters = [
    { key: "all", label: "Todos" },
    { key: "ENTRADA", label: "ENTRADA" },
    { key: "SAÍDA", label: "SAÍDA" },
    { key: "EDIÇÃO", label: "EDIÇÃO" },
    { key: "EXCLUSÃO", label: "EXCLUSÃO" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Logs do Sistema</h1>
        <p className="text-sm text-white/50">
          Auditoria de todas as ações realizadas no estoque
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total" value={stats.totalLogs} />
        <Stat label="Entradas" value={stats.totalEntradas} color="text-green-300" />
        <Stat label="Saídas" value={stats.totalSaidas} color="text-red-300" />
        <Stat label="Edições" value={stats.totalEdicoes} color="text-amber-300" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm border transition ${filter === f.key
                ? "bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40"
                : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-white/50">Carregando logs…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Ação</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Qtd</th>
                <th className="px-4 py-3 text-left">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/70">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">{l.user_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs border font-semibold ${ACTION_STYLES[l.action_type] || "bg-white/5 border-white/10 text-white/70"
                        }`}
                    >
                      {l.action_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{l.item_brand} {l.item_model}</td>
                  <td className="px-4 py-3">{l.category_name}</td>
                  <td className="px-4 py-3">{l.quantity}</td>
                  <td className="px-4 py-3 text-white/60">{l.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-white/50" colSpan={7}>Nenhum log encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/50">{label}</div>
      <div className={`text-2xl font-bold ${color || ""}`}>{value ?? 0}</div>
    </div>
  );
}