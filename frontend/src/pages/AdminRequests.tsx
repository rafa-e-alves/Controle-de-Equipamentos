import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type Request = {
  id: number;
  user_name: string;
  item_brand: string;
  item_model: string;
  item_condition: string;
  category_name: string;
  quantity: number;
  reason: string;
  status: 'PENDENTE' | 'APROVADO' | 'RECUSADO';
  admin_note: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDENTE: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
  APROVADO: 'bg-green-500/15 border-green-500/30 text-green-300',
  RECUSADO: 'bg-red-500/15 border-red-500/30 text-red-300',
};

export default function AdminRequests({ token, onToast }: { token: string; onToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionOpen, setActionOpen] = useState(false);
  const [actionReq, setActionReq] = useState<Request | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [adminNote, setAdminNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/requests/admin', { headers: { Authorization: `Bearer ${token}` } });
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'PENDENTE').length;
  const showActions = filter === 'all' || filter === 'PENDENTE';

  const openAction = (req: Request, type: 'approve' | 'reject') => {
    setActionReq(req);
    setActionType(type);
    setAdminNote('');
    setActionOpen(true);
  };

  const doAction = async () => {
    if (!actionReq) return;
    setBusy(true);
    try {
      const endpoint = actionType === 'approve' ? 'approve' : 'reject';
      await apiFetch(`/requests/${actionReq.id}/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ admin_note: adminNote }),
      });
      setActionOpen(false);
      onToast(actionType === 'approve' ? 'Solicitação aprovada!' : 'Solicitação recusada.');
      load();
    } catch (e: any) {
      onToast(e?.message || 'Erro ao processar.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Solicitações de Retirada</h1>
          <p className="text-sm text-white/50">Gerencie os pedidos de retirada de equipamentos</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-semibold">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
          <button onClick={load} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm transition">
            Atualizar
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {[['all', 'Todas'], ['PENDENTE', 'Pendentes'], ['APROVADO', 'Aprovadas'], ['RECUSADO', 'Recusadas']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm border transition ${filter === key ? 'bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-white/50">Carregando…</div>
        ) : (
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: '140px' }} />
              <col style={{ width: '90px' }} />
              <col style={{ width: '150px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: '220px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '140px' }} />
              {showActions && <col style={{ width: '160px' }} />}
            </colgroup>
            <thead className="border-b border-white/10 text-white/60">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Qtd</th>
                <th className="px-4 py-3 text-left">Motivo</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Observação</th>
                {showActions && <th className="px-4 py-3 text-left">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 align-top">
                  <td className="px-4 py-3 text-white/60 text-xs">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 font-medium">{r.user_name}</td>
                  <td className="px-4 py-3">{r.item_brand} {r.item_model}</td>
                  <td className="px-4 py-3 text-white/70">{r.category_name}</td>
                  <td className="px-4 py-3 font-semibold">{r.quantity}</td>
                  <td className="px-4 py-3 text-white/70 break-words">{r.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs border font-semibold ${STATUS_STYLES[r.status] || ''}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40 break-words">{r.admin_note || '—'}</td>
                  {showActions && (
                    <td className="px-4 py-3">
                      {r.status === 'PENDENTE' && (
                        <div className="flex gap-2">
                          <button onClick={() => openAction(r, 'approve')}
                            className="px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-200 hover:bg-green-500/25 text-xs">
                            Aprovar
                          </button>
                          <button onClick={() => openAction(r, 'reject')}
                            className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/25 text-xs">
                            Recusar
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td className="px-4 py-6 text-white/50" colSpan={showActions ? 9 : 8}>Nenhuma solicitação encontrada.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {actionOpen && actionReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setActionOpen(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/90 p-5">
            <div className="font-semibold mb-1">{actionType === 'approve' ? 'Aprovar solicitação' : 'Recusar solicitação'}</div>
            <div className="text-xs text-white/50 mb-1">{actionReq.item_brand} {actionReq.item_model} — {actionReq.quantity} un — {actionReq.user_name}</div>
            <div className="text-xs text-white/40 mb-4 bg-white/5 rounded-xl px-3 py-2">{actionReq.reason}</div>
            <div className="text-xs text-white/50 mb-1">Observação (opcional)</div>
            <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={3}
              placeholder="Ex: Aprovado para uso no setor Y"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none resize-none text-sm mb-4" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setActionOpen(false)} disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm">Cancelar</button>
              <button onClick={doAction} disabled={busy}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${actionType === 'approve' ? 'bg-green-500/20 border border-green-500/30 text-green-200 hover:bg-green-500/30' : 'bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30'}`}>
                {busy ? 'Processando...' : actionType === 'approve' ? 'Confirmar aprovação' : 'Confirmar recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}