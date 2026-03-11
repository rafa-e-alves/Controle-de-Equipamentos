import { useEffect, useRef, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import InventoryPanel from './components/InventoryPanel';
import AdminLogs from './pages/AdminLogs';
import AdminUsers from './pages/AdminUsers';
import AdminCategories from './pages/AdminCategories';
import AdminRequests from './pages/AdminRequests';
import { useToast, ToastContainer } from './components/Toast';

type Tab = 'inventory' | 'logs' | 'users' | 'categories' | 'requests';

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('inventory');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toasts, show: showToast, remove: removeToast } = useToast();

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
  const handler = () => { setUser(null); setToken(null); setTab('inventory'); };
  window.addEventListener('auth:logout', handler);
  return () => window.removeEventListener('auth:logout', handler);
}, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    setTab('inventory');
  };

  if (!user || !token) {
    return (
      <LoginScreen onLogin={(u, t) => { setUser(u); setToken(t); setTab('inventory'); }} />
    );
  }

  const isAdmin = user.role === 'admin';

  const NAV_TABS: { id: Tab; label: string }[] = [
    { id: 'inventory', label: 'Inventário' },
    { id: 'requests', label: 'Solicitações' },
    { id: 'logs', label: 'Logs' },
    { id: 'users', label: 'Usuários' },
    { id: 'categories', label: 'Categorias' },
  ];

  const activeClass = 'bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40 font-medium';
  const inactiveClass = 'bg-white/5 border-white/10 hover:bg-white/10';

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <img src="/brand/CarmemLogo.svg" alt="Carmem Seguros"
              className="h-9 w-9 rounded-full bg-white/5 border border-white/10 object-contain p-1" />
            <div>
              <div className="font-bold leading-tight">Controle de Equipamentos</div>
              <div className="text-xs text-white/50 leading-tight">Carmem Seguros • Painel interno</div>
            </div>
          </div>

          {/* Nav — só admin */}
          {isAdmin && (
            <nav className="flex gap-1 flex-wrap justify-center flex-1">
              {NAV_TABS.map(({ id, label }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${tab === id ? activeClass : inactiveClass}`}>
                  {label}
                </button>
              ))}
            </nav>
          )}

          {/* Avatar com dropdown */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/8 transition group"
            >
              <div className="h-8 w-8 rounded-full bg-[rgb(var(--brand))]/25 border border-[rgb(var(--brand))]/40 flex items-center justify-center text-[rgb(var(--brand))] text-sm font-bold select-none">
                {getInitials(user.name)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium leading-tight">{user.name}</div>
                <div className="text-xs text-white/40 leading-tight">{isAdmin ? 'Admin' : 'Usuário'}</div>
              </div>
              <svg className={`w-3.5 h-3.5 text-white/40 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-white/8">
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className="text-xs text-white/40 mt-0.5">{user.username}</div>
                  <div className="mt-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs border font-medium
                      ${isAdmin
                        ? 'bg-[rgb(var(--brand))]/15 border-[rgb(var(--brand))]/30 text-[rgb(var(--brand))]'
                        : 'bg-white/8 border-white/15 text-white/60'}`}>
                      {isAdmin ? 'Administrador' : 'Usuário'}
                    </span>
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/10 transition text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                    </svg>
                    Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {isAdmin && tab === 'logs' ? (
        <AdminLogs token={token} />
      ) : isAdmin && tab === 'users' ? (
        <AdminUsers token={token} />
      ) : isAdmin && tab === 'categories' ? (
        <AdminCategories token={token} onToast={showToast} />
      ) : isAdmin && tab === 'requests' ? (
        <AdminRequests token={token} onToast={showToast} />
      ) : (
        <InventoryPanel token={token} isAdmin={isAdmin} />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}