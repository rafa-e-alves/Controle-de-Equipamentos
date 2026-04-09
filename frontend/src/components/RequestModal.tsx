import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/api';
import { useModalLock } from '../lib/useModalLock';
import { PortalDropdown } from './PortalDropdown';

type Item = { id: number; brand: string; model: string; condition: string; quantity: number };

const MOTIVOS = ["Uso interno", "Empréstimo", "Manutenção"];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-white/60 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </div>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, error, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean; maxLength?: number;
}) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength}
      className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 text-sm transition
        ${error ? 'border-red-500/70 focus:ring-red-500/40' : 'border-white/10 focus:ring-[rgb(var(--brand))]/60'}`} />
  );
}

function TextArea({ value, onChange, placeholder, error, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean; maxLength?: number;
}) {
  return (
    <div className="relative">
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={2} maxLength={maxLength}
        className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 text-sm resize-none transition
          ${error ? 'border-red-500/70 focus:ring-red-500/40' : 'border-white/10 focus:ring-[rgb(var(--brand))]/60'}`} />
      {maxLength && (
        <div className="text-right text-xs text-white/25 mt-0.5">{value.length}/{maxLength}</div>
      )}
    </div>
  );
}

export default function RequestModal({ open, item, categoryName, token, onClose, onSuccess }: {
  open: boolean; item: Item | null; categoryName: string; token: string; onClose: () => void; onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const [authorizer, setAuthorizer] = useState('');
  const [justification, setJustification] = useState('');
  const [problemDesc, setProblemDesc] = useState('');

  const anchorRef = useRef<HTMLButtonElement>(null!);

  useModalLock(open);

  useEffect(() => {
    if (open) {
      setQuantity(1); setReason(''); setErr(null); setDropdownOpen(false); setFieldErrors({});
      setAuthorizer(''); setJustification(''); setProblemDesc('');
    }
  }, [open]);

  if (!open || !item) return null;

  const handleReasonSelect = (m: string) => {
    setReason(m);
    setDropdownOpen(false);
    setAuthorizer(''); setJustification(''); setProblemDesc('');
    setFieldErrors({});
  };

  const validate = () => {
    const errors: Record<string, boolean> = {};
    if (quantity <= 0 || quantity > item.quantity) errors.quantity = true;
    if (!reason) errors.reason = true;
    if (reason === 'Uso interno' || reason === 'Empréstimo') {
      if (!authorizer.trim()) errors.authorizer = true;
      if (!justification.trim()) errors.justification = true;
    } else if (reason === 'Manutenção') {
      if (!problemDesc.trim()) errors.problemDesc = true;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    setErr(null);
    if (!validate()) { setErr('Preencha todos os campos obrigatórios.'); return; }

    const extra: Record<string, string> = {};
    if (reason === 'Uso interno' || reason === 'Empréstimo') {
      extra.authorizer = authorizer;
      extra.justification = justification;
    } else if (reason === 'Manutenção') {
      extra.problem_description = problemDesc;
    }

    setBusy(true);
    try {
      await apiFetch('/requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ item_id: item.id, quantity, reason, extra }),
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
            <div className="text-xs text-white/50 mb-1">
              Disponível: <span className="text-white font-semibold">{item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}</span>
            </div>
            <Field label="Quantidade a retirar" required>
              <input type="number" min={1} max={item.quantity} value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border focus:outline-none focus:ring-2 transition
                  ${fieldErrors.quantity ? 'border-red-500/70 focus:ring-red-500/40' : 'border-white/10 focus:ring-[rgb(var(--brand))]/60'}`} />
            </Field>
          </div>

          <Field label="Motivo" required>
            <button ref={anchorRef} type="button" onClick={() => setDropdownOpen((v) => !v)}
              className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-left flex items-center justify-between transition
                ${fieldErrors.reason ? 'border-red-500/70' : dropdownOpen ? 'border-[rgb(var(--brand))]/60 ring-2 ring-[rgb(var(--brand))]/30' : 'border-white/10 hover:border-white/20'}`}>
              <span className={reason ? "text-white text-sm" : "text-white/40 text-sm"}>{reason || "Selecione o motivo..."}</span>
              <span className="text-white/40 text-xs">{dropdownOpen ? "▲" : "▼"}</span>
            </button>
            {dropdownOpen && (
              <PortalDropdown anchorRef={anchorRef} options={MOTIVOS} value={reason}
                onSelect={handleReasonSelect} onClose={() => setDropdownOpen(false)} />
            )}
          </Field>

          {(reason === 'Uso interno' || reason === 'Empréstimo') && (
            <div className="space-y-3 rounded-xl border border-white/8 bg-white/3 p-4">
              <Field label="Gestor autorizante" required>
                <TextInput value={authorizer} onChange={setAuthorizer}
                  placeholder="Nome do gestor que autorizou"
                  error={fieldErrors.authorizer} maxLength={50} />
              </Field>
              <Field label="Justificativa" required>
                <TextArea value={justification} onChange={setJustification}
                  placeholder="Descreva a necessidade do item..."
                  error={fieldErrors.justification} maxLength={300} />
              </Field>
            </div>
          )}

          {reason === 'Manutenção' && (
            <div className="space-y-3 rounded-xl border border-white/8 bg-white/3 p-4">
              <Field label="Descrição do problema" required>
                <TextArea value={problemDesc} onChange={setProblemDesc}
                  placeholder="Descreva o problema do equipamento..."
                  error={fieldErrors.problemDesc} maxLength={300} />
              </Field>
            </div>
          )}

          <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-2.5 text-xs text-amber-300/80">
            Certifique-se de ter autorização do seu gestor antes de enviar a solicitação.
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3 justify-end">
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