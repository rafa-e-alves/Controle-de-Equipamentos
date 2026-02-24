import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

type User = {
  id: number;
  username: string;
  name: string;
  role: "admin" | "user";
  created_at: string;
  active: number;
};

export default function AdminUsers({ token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDisabled, setShowDisabled] = useState(true);

  // Create
  const [form, setForm] = useState({
    username: "",
    name: "",
    role: "user",
    password: "",
  });

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ username: "", name: "", role: "user" });

  // Reset pass modal
  const [passOpen, setPassOpen] = useState(false);
  const [passUser, setPassUser] = useState<User | null>(null);
  const [newPass, setNewPass] = useState("");

  const loadUsers = async (includeDisabled: boolean = showDisabled) => {
    setLoading(true);
    try {
      const activeParam = includeDisabled ? "all" : "1";
      const data = await apiFetch(`/users?active=${activeParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadUsers(showDisabled);
    // eslint-disable-next-line
  }, [showDisabled]);

  // Create
  const createUser = async () => {
    if (!form.username.trim() || !form.name.trim() || !form.password.trim()) {
      alert("Preencha username, nome e senha.");
      return;
    }

    await apiFetch("/users", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });

    setForm({ username: "", name: "", role: "user", password: "" });
    loadUsers();
  };

  // Disable / Enable
  const disableUser = async (u: User) => {
    const ok = confirm(`Desativar "${u.username}"? Ele não conseguirá logar.`);
    if (!ok) return;

    await apiFetch(`/users/${u.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    loadUsers();
  };

  const enableUser = async (u: User) => {
    const ok = confirm(`Reativar "${u.username}"?`);
    if (!ok) return;

    await apiFetch(`/users/${u.id}/enable`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    loadUsers();
  };

  // Hard delete
  const hardDeleteUser = async (u: User) => {
    const ok = confirm(
      `EXCLUIR DEFINITIVAMENTE "${u.username}"?\n\nSó funciona se ele não tiver logs.\nRecomendado apenas para testes.`
    );
    if (!ok) return;

    try {
      await apiFetch(`/users/${u.id}/hard`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      loadUsers();
    } catch (e: any) {
      // apiFetch já loga; aqui só dá feedback simples
      alert("Não foi possível excluir. Se ele tiver logs, use Desativar.");
    }
  };

  // Edit
  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({ username: u.username, name: u.name, role: u.role });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editUser) return;
    if (!editForm.username.trim() || !editForm.name.trim()) {
      alert("Username e Nome são obrigatórios.");
      return;
    }

    await apiFetch(`/users/${editUser.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });

    setEditOpen(false);
    setEditUser(null);
    loadUsers();
  };

  // Reset password
  const openResetPass = (u: User) => {
    setPassUser(u);
    setNewPass("");
    setPassOpen(true);
  };

  const saveResetPass = async () => {
    if (!passUser) return;
    if (!newPass.trim() || newPass.trim().length < 4) {
      alert("Senha inválida (mínimo 4 caracteres).");
      return;
    }

    await apiFetch(`/users/${passUser.id}/reset-password`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: newPass }),
    });

    setPassOpen(false);
    setPassUser(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-white/50">
            Crie, edite, resete senha, desative/reative e exclua usuários (com segurança)
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-2 text-sm text-white/70 select-none">
            <input
              type="checkbox"
              checked={showDisabled}
              onChange={(e) => setShowDisabled(e.target.checked)}
              className="accent-[rgb(var(--brand))]"
            />
            Mostrar desativados
          </label>

          <button
            onClick={() => loadUsers()}
            className="px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 hover:bg-white/12 transition text-sm"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Lista */}
        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 overflow-x-auto">
          {loading ? (
            <div className="p-6 text-white/50">Carregando usuários…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-white/60">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Usuário</th>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const isActive = Number(u.active) === 1;

                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-white/5 hover:bg-white/5 ${
                        !isActive ? "opacity-70" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-white/60">{u.id}</td>
                      <td className="px-4 py-3 font-semibold">{u.username}</td>
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3 text-white/70">{u.role}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs border ${
                            isActive
                              ? "bg-[rgb(var(--brand))]/12 border-[rgb(var(--brand))]/25 text-[rgb(var(--brand))]"
                              : "bg-red-500/10 border-red-500/25 text-red-200"
                          }`}
                        >
                          {isActive ? "Ativo" : "Desativado"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openEdit(u)}
                            className="px-3 py-1.5 rounded-lg bg-white/6 border border-white/10 text-white/80 text-xs hover:bg-white/10"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => openResetPass(u)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs hover:bg-amber-500/20"
                          >
                            Senha
                          </button>

                          {isActive ? (
                            <button
                              onClick={() => disableUser(u)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs hover:bg-red-500/25"
                            >
                              Desativar
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => enableUser(u)}
                                className="px-3 py-1.5 rounded-lg bg-[rgb(var(--brand))]/20 border border-[rgb(var(--brand))]/30 text-[rgb(var(--brand))] text-xs hover:bg-[rgb(var(--brand))]/28"
                              >
                                Reativar
                              </button>

                              <button
                                onClick={() => hardDeleteUser(u)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/35 text-red-200 text-xs hover:bg-red-500/30"
                                title="Exclui definitivamente (apenas se não tiver logs)"
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-white/50" colSpan={6}>
                      Nenhum usuário para exibir.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-semibold mb-4">Criar usuário</h2>

          <div className="space-y-3">
            <Input label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
            <Input label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />

            <div>
              <div className="text-xs text-white/50 mb-1">Role</div>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none"
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <Input
              label="Senha"
              type="password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
            />

            <button
              onClick={createUser}
              className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/25 border border-[rgb(var(--brand))]/40 text-sm font-semibold hover:bg-[rgb(var(--brand))]/32 transition"
            >
              Criar
            </button>

            <p className="text-xs text-white/40 pt-2">
              Excluir definitivo só aparece quando o usuário estiver desativado e sem logs.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Edit */}
      {editOpen && editUser && (
        <Modal title={`Editar: ${editUser.username}`} onClose={() => setEditOpen(false)}>
          <div className="space-y-3">
            <Input label="Username" value={editForm.username} onChange={(v) => setEditForm({ ...editForm, username: v })} />
            <Input label="Nome" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
            <div>
              <div className="text-xs text-white/50 mb-1">Role</div>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none"
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              onClick={saveEdit}
              className="w-full px-4 py-2.5 rounded-xl bg-[rgb(var(--brand))]/25 border border-[rgb(var(--brand))]/40 text-sm font-semibold hover:bg-[rgb(var(--brand))]/32 transition"
            >
              Salvar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Reset Password */}
      {passOpen && passUser && (
        <Modal title={`Resetar senha: ${passUser.username}`} onClose={() => setPassOpen(false)}>
          <div className="space-y-3">
            <Input label="Nova senha" type="password" value={newPass} onChange={(v) => setNewPass(v)} />
            <button
              onClick={saveResetPass}
              className="w-full px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-100 text-sm font-semibold hover:bg-amber-500/25 transition"
            >
              Atualizar senha
            </button>
            <p className="text-xs text-white/40">
              Dica: use algo temporário e peça para o usuário trocar depois (se quiser, a gente implementa “trocar minha senha”).
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:outline-none"
      />
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: any;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0f0c] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/6 border border-white/10 text-white/80 text-xs hover:bg-white/10"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}