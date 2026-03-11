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
  const [showPass, setShowPass] = useState(false);

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
      setError(err.message || "Usuário ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-start justify-center pt-16 p-6">

      {/* Fundo com glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-[rgb(var(--brand))]/18 blur-[120px]" />
        <div className="absolute -bottom-56 -right-32 h-[500px] w-[500px] rounded-full bg-[rgb(var(--brand-2))]/12 blur-[100px]" />
        <div className="absolute top-1/2 -left-48 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[rgb(var(--brand))]/8 blur-[100px]" />
      </div>

      {/* Grid sutil de fundo */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative w-full max-w-lg">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="text-3xl font-bold tracking-tight">
            <span className="text-[rgb(var(--brand))]">Carmem</span>
<span className="text-white/30 text-lg font-light ml-1">Seguros</span>
          </div>
          <div className="text-xs text-white/40 tracking-widest uppercase">Controle de Equipamentos</div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">

          {/* Linha decorativa no topo */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgb(var(--brand))]/60 to-transparent" />

          <div className="p-7">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight">Acesso interno</h1>
              <p className="text-sm text-white/45 mt-1">Entre com seu usuário corporativo.</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 text-red-200 px-4 py-3 rounded-xl text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-white/55 mb-1.5 font-medium">Usuário</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/50 focus:border-[rgb(var(--brand))]/40 transition text-sm placeholder:text-white/25"
                  placeholder="ex: rafael.alves"
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-xs text-white/55 mb-1.5 font-medium">Senha</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand))]/50 focus:border-[rgb(var(--brand))]/40 transition text-sm placeholder:text-white/25"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition p-1">
                    {showPass ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-black bg-[rgb(var(--brand))] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Entrando...
                  </span>
                ) : "Entrar"}
              </button>
            </form>
          </div>

          {/* Rodapé do card */}
          <div className="px-7 py-4 border-t border-white/6 bg-white/[0.02]">
            <p className="text-xs text-white/35">Precisa de acesso? Solicite ao Departamento Pessoal.</p>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-white/25">
          © {new Date().getFullYear()} Carmem Seguros • TI
        </div>
      </div>
    </div>
  );
}