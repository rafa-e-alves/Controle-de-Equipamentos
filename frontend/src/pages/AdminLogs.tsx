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
  "ENTRADA":  "bg-green-500/15 border-green-500/30 text-green-300",
  "SAÍDA":    "bg-red-500/15 border-red-500/30 text-red-300",
  "EDIÇÃO":   "bg-amber-500/15 border-amber-500/30 text-amber-300",
  "EXCLUSÃO": "bg-zinc-500/15 border-zinc-500/30 text-zinc-300",
};

const FILTERS = [
  { key: "all",      label: "Todos" },
  { key: "ENTRADA",  label: "ENTRADA" },
  { key: "SAÍDA",    label: "SAÍDA" },
  { key: "EDIÇÃO",   label: "EDIÇÃO" },
  { key: "EXCLUSÃO", label: "EXCLUSÃO" },
];

function exportCSV(logs: Log[]) {
  const escape = (s: string) => (s ?? "").replace(/"/g, "'");
  const header = ["Data", "Usuário", "Ação", "Marca", "Modelo", "Categoria", "Qtd", "Detalhes"];
  const rows = logs.map((l) => [
    new Date(l.created_at).toLocaleString("pt-BR"),
    l.user_name, l.action_type, l.item_brand, l.item_model,
    l.category_name, String(l.quantity), l.details,
  ]);
  const csvRows = [header, ...rows].map((row) =>
    row.map((cell) => ['"', escape(cell), '"'].join("")).join(";")
  );
  const csv = csvRows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `logs_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DetailCell({ details }: { details: string }) {
  if (!details) return <span className="text-white/30">—</span>;

  const parts = details.split(" | ");
  const main = parts[0];
  const extras = parts.slice(1);

  if (extras.length === 0) {
    return <span className="text-white/70">{main}</span>;
  }

  return (
    <div className="flex items-start gap-2">
      <span className="text-white/70">{main}</span>
      <div className="relative group flex-shrink-0 mt-0.5">
        <div className="w-4 h-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center cursor-default text-white/50 text-xs font-bold leading-none">
          +
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover:block w-max max-w-xs">
          <div className="bg-zinc-900 border border-white/15 rounded-xl px-3 py-2.5 shadow-xl space-y-1.5">
            {extras.map((part, i) => {
              const colonIdx = part.indexOf(':');
              if (colonIdx > -1) {
                const label = part.slice(0, colonIdx).trim();
                const value = part.slice(colonIdx + 1).trim();
                return (
                  <div key={i}>
                    <div className="text-xs text-white/40">{label}</div>
                    <div className="text-xs text-white/80">{value}</div>
                  </div>
                );
              }
              return <div key={i} className="text-xs text-white/70">{part}</div>;
            })}
          </div>
          <div className="w-2 h-2 bg-zinc-900 border-r border-b border-white/15 rotate-45 mx-auto -mt-1" />
        </div>
      </div>
    </div>
  );
}

export default function AdminLogs({ token }: { token: string }) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});

  const loadLogs = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/logs" : `/logs?action_type=${encodeURIComponent(filter)}`;
      const data = await apiFetch(url, { headers: { Authorization: `Bearer ${token}` } });
      setLogs(data);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await apiFetch("/logs/stats", { headers: { Authorization: `Bearer ${token}` } });
      setStats(data);
    } catch {}
  };

  useEffect(() => {
    loadLogs();
    loadStats();
    // eslint-disable-next-line
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Logs do Sistema</h1>
          <p className="text-sm text-white/50">Auditoria de todas as ações realizadas no estoque</p>
        </div>
        <button onClick={() => exportCSV(logs)} disabled={logs.length === 0}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
          ↓ Exportar CSV
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Stat label="Total" value={stats.totalLogs} />
        <Stat label="Entradas" value={stats.totalEntradas} color="text-green-300" />
        <Stat label="Saídas" value={stats.totalSaidas} color="text-red-300" />
        <Stat label="Edições" value={stats.totalEdicoes} color="text-amber-300" />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm border transition ${filter === f.key
              ? "bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40"
              : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-visible">
        {loading ? (
          <div className="p-6 text-white/50">Carregando logs…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-white/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Data</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Usuário</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Ação</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Item</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Categoria</th>
                <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Qtd</th>
                <th className="px-4 py-3 text-left font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-white/60 whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{l.user_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs border font-semibold ${ACTION_STYLES[l.action_type] || "bg-white/5 border-white/10 text-white/70"}`}>
                      {l.action_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{l.item_brand} {l.item_model}</td>
                  <td className="px-4 py-3 text-white/70 whitespace-nowrap">{l.category_name}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{l.quantity}</td>
                  <td className="px-4 py-3">
                    <DetailCell details={l.details} />
                  </td>
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
      <div className={`text-2xl font-bold mt-1 ${color || ""}`}>{value ?? 0}</div>
    </div>
  );
}