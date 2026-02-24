import { useState } from "react";
import { apiFetch } from "../lib/api";

type Props = {
  onLogin: (user: any, token: string) => void;
};

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* glow de marca */}
      <div className="pointer-events-none absolute -top-56 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-[rgb(var(--brand))]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-64 -right-40 h-[520px] w-[520px] rounded-full bg-[rgb(var(--brand-2))]/15 blur-3xl" />

      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              <img
                src="/logo-carmem.png"
                className="h-9 w-9 object-contain"
                alt="Carmem Seguros"
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
              />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-wide">Carmem Seguros</div>
              <div className="text-sm text-white/60">Controle de Equipamentos</div>
            </div>
          </div>

          <div className="rounded-2xl bg-[rgb(var(--panel))]/70 backdrop-blur border border-white/10 shadow-2xl p-7">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Acesso interno</h1>
                <p className="text-sm text-white/55 mt-1">
                  Entre com seu usuário corporativo.
                </p>
              </div>
              <div className="hidden sm:block text-xs text-white/45 text-right">
                Segurança<br />JWT • 12h
              </div>
            </div>

            {error && (
              <div className="mt-5 bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Usuário</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60"
                  placeholder="ex: rafael.alves"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/60"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-black
                           bg-[rgb(var(--brand))] hover:brightness-110 transition
                           disabled:opacity-60 disabled:hover:brightness-100"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="mt-6 text-xs text-white/45">
              Precisa de acesso? Solicite ao Departamento Pessoal.
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-white/35">
            © {new Date().getFullYear()} Carmem Seguros • TI
          </div>
        </div>
      </div>
    </div>
  );
}
