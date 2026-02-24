import { useEffect, useState } from "react";
import LoginScreen from "./components/LoginScreen";
import InventoryPanel from "./components/InventoryPanel";
import AdminLogs from "./pages/AdminLogs";
import AdminUsers from "./pages/AdminUsers";
import AdminCategories from "./pages/AdminCategories";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // ✅ por padrão: TODO MUNDO entra no inventário
  const [tab, setTab] = useState<"inventory" | "logs" | "users" | "categories">("inventory");
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setToken(null);
    setTab("inventory");
    setAdminMode(false);
  };

  if (!user || !token) {
    return (
      <LoginScreen
        onLogin={(u, t) => {
          setUser(u);
          setToken(t);
          setTab("inventory");
          setAdminMode(false);
        }}
      />
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* ✅ Logo topo (puxa de /public/brand/logo-carmem.png) */}
            <img
              src="/brand/logo-carmem.png"
              alt="Carmem Seguros"
              className="h-9 w-9 rounded-full bg-black/30 border border-white/10 object-contain"
            />
            <div>
              <div className="font-bold leading-tight">Controle de Equipamentos</div>
              <div className="text-xs text-white/50 leading-tight">Carmem Seguros • Painel interno</div>
              <div className="text-[11px] text-white/40">
                {user.name} • {user.role === "admin" ? "Admin" : "Usuário"}
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {/* ✅ Botão único pra ligar/desligar modo admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  const next = !adminMode;
                  setAdminMode(next);
                  setTab("inventory"); // sempre volta pro inventário quando alterna
                }}
                className={`px-4 py-2 rounded-xl text-sm border transition ${
                  adminMode
                    ? "bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
                title="Ativar/desativar modo admin"
              >
                {adminMode ? "Modo Admin: ON" : "Modo Admin: OFF"}
              </button>
            )}

            {/* ✅ Só mostra tabs de admin se adminMode estiver ON */}
            {isAdmin && adminMode && (
              <>
                <button
                  onClick={() => setTab("inventory")}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${
                    tab === "inventory"
                      ? "bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Inventário
                </button>

                <button
                  onClick={() => setTab("logs")}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${
                    tab === "logs"
                      ? "bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Logs
                </button>

                <button
                  onClick={() => setTab("users")}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${
                    tab === "users"
                      ? "bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Usuários
                </button>

                <button
                  onClick={() => setTab("categories")}
                  className={`px-4 py-2 rounded-xl text-sm border transition ${
                    tab === "categories"
                      ? "bg-[rgb(var(--brand))]/25 border-[rgb(var(--brand))]/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  Categorias
                </button>
              </>
            )}

            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {isAdmin && adminMode && tab === "logs" ? (
        <AdminLogs token={token} />
      ) : isAdmin && adminMode && tab === "users" ? (
        <AdminUsers token={token} />
      ) : isAdmin && adminMode && tab === "categories" ? (
        <AdminCategories token={token} />
      ) : (
        // ✅ inventário SEMPRE existe (admin e user)
        <InventoryPanel token={token} isAdmin={isAdmin} />
      )}
    </div>
  );
}
