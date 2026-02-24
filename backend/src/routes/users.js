const express = require("express");
const bcrypt = require("bcryptjs");
const { all, get, run } = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function parseActiveFilter(q) {
  const v = String(q ?? "1").toLowerCase().trim(); // default: só ativos
  if (v === "all") return "all";
  if (v === "0" || v === "false" || v === "disabled") return 0;
  return 1;
}

// GET /api/users?active=1|0|all
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const active = parseActiveFilter(req.query.active);

    let sql = "SELECT id, username, name, role, active, created_at FROM users ";
    const params = [];

    if (active === "all") {
      sql += "ORDER BY active DESC, role DESC, id DESC";
    } else {
      sql += "WHERE active = ? ORDER BY role DESC, id DESC";
      params.push(active);
    }

    const users = await all(sql, params);
    return res.json(users);
  } catch (e) {
    console.error("list users error", e);
    return res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

// POST /api/users (criar)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const b = req.body || {};
  const username = (b.username || "").trim();
  const name = (b.name || "").trim();
  const role = (b.role || "user").trim();
  const password = (b.password || "").trim();

  if (!username || !name || !password) {
    return res.status(400).json({ error: "Preencha username, name e password" });
  }
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ error: "role inválida" });
  }

  try {
    const exists = await get("SELECT id FROM users WHERE username = ?", [username]);
    if (exists) return res.status(409).json({ error: "Usuário já existe" });

    const hashed = await bcrypt.hash(password, 10);

    await run(
      `INSERT INTO users (username, name, role, password, active)
       VALUES (?, ?, ?, ?, 1)`,
      [username, name, role, hashed]
    );

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error("create user error", e);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// PUT /api/users/:id (editar dados)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const username = (b.username || "").trim();
  const name = (b.name || "").trim();
  const role = (b.role || "").trim();

  if (!id) return res.status(400).json({ error: "ID inválido" });
  if (!username || !name) return res.status(400).json({ error: "username e name são obrigatórios" });
  if (role && !["user", "admin"].includes(role)) return res.status(400).json({ error: "role inválida" });

  try {
    const u = await get("SELECT id, role FROM users WHERE id = ?", [id]);
    if (!u) return res.status(404).json({ error: "Usuário não encontrado" });

    // evita duplicar username em outro id
    const dup = await get("SELECT id FROM users WHERE username = ? AND id <> ?", [username, id]);
    if (dup) return res.status(409).json({ error: "username já está em uso" });

    // se trocar admin -> user, evita derrubar último admin ativo
    if (u.role === "admin" && role === "user") {
      const admins = await get("SELECT COUNT(*) as c FROM users WHERE role='admin' AND active=1");
      if ((admins?.c || 0) <= 1) {
        return res.status(400).json({ error: "Não é possível rebaixar o último admin ativo" });
      }
    }

    await run(
      "UPDATE users SET username = ?, name = ?, role = COALESCE(?, role) WHERE id = ?",
      [username, name, role || null, id]
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("edit user error", e);
    return res.status(500).json({ error: "Erro ao editar usuário" });
  }
});

// POST /api/users/:id/reset-password (resetar senha)
router.post("/:id/reset-password", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const password = (req.body?.password || "").trim();

  if (!id) return res.status(400).json({ error: "ID inválido" });
  if (!password || password.length < 4) return res.status(400).json({ error: "Senha inválida (mínimo 4 caracteres)" });

  try {
    const u = await get("SELECT id FROM users WHERE id = ?", [id]);
    if (!u) return res.status(404).json({ error: "Usuário não encontrado" });

    const hashed = await bcrypt.hash(password, 10);
    await run("UPDATE users SET password = ? WHERE id = ?", [hashed, id]);

    return res.json({ ok: true });
  } catch (e) {
    console.error("reset password error", e);
    return res.status(500).json({ error: "Erro ao resetar senha" });
  }
});

// DELETE /api/users/:id  (desativar)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const u = await get("SELECT id, role, active FROM users WHERE id = ?", [id]);
    if (!u) return res.status(404).json({ error: "Usuário não encontrado" });

    if (Number(u.active) === 0) return res.json({ ok: true, disabled: true });

    if (u.role === "admin") {
      const admins = await get("SELECT COUNT(*) as c FROM users WHERE role='admin' AND active=1");
      if ((admins?.c || 0) <= 1) {
        return res.status(400).json({ error: "Não é possível desativar o último admin ativo" });
      }
    }

    await run("UPDATE users SET active = 0 WHERE id = ?", [id]);
    return res.json({ ok: true, disabled: true });
  } catch (e) {
    console.error("disable user error", e);
    return res.status(500).json({ error: "Erro ao desativar usuário" });
  }
});

// POST /api/users/:id/enable (reativar)
router.post("/:id/enable", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const u = await get("SELECT id, active FROM users WHERE id = ?", [id]);
    if (!u) return res.status(404).json({ error: "Usuário não encontrado" });

    if (Number(u.active) === 1) return res.json({ ok: true, enabled: true });

    await run("UPDATE users SET active = 1 WHERE id = ?", [id]);
    return res.json({ ok: true, enabled: true });
  } catch (e) {
    console.error("enable user error", e);
    return res.status(500).json({ error: "Erro ao reativar usuário" });
  }
});

// DELETE /api/users/:id/hard (excluir de verdade)
// Regra: só exclui se NÃO houver logs do usuário (por user_id OU user_name)
router.delete("/:id/hard", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const u = await get("SELECT id, username, role FROM users WHERE id = ?", [id]);
    if (!u) return res.status(404).json({ error: "Usuário não encontrado" });

    // segurança: não delete o último admin
    if (u.role === "admin") {
      const admins = await get("SELECT COUNT(*) as c FROM users WHERE role='admin'");
      if ((admins?.c || 0) <= 1) {
        return res.status(400).json({ error: "Não é possível excluir o último admin" });
      }
    }

    // se logs têm user_id, usa; se não tiver, vai pelo user_name
    const hasUserIdCol = await get("PRAGMA table_info(logs)");
    const colNames = [];
    // PRAGMA table_info não funciona via get normalmente. Então vamos tentar direto por contagem segura:
    // (fallback: checa logs por user_id e por user_name em try/catch)
    let logsCount = 0;

    try {
      const c1 = await get("SELECT COUNT(*) as c FROM logs WHERE user_id = ?", [id]);
      logsCount += (c1?.c || 0);
    } catch {}

    try {
      const c2 = await get("SELECT COUNT(*) as c FROM logs WHERE user_name = ?", [u.username]);
      logsCount += (c2?.c || 0);
    } catch {}

    if (logsCount > 0) {
      return res.status(400).json({
        error: "Não é possível excluir: usuário possui logs. Use 'Desativar'.",
        logsCount,
      });
    }

    await run("DELETE FROM users WHERE id = ?", [id]);
    return res.json({ ok: true, deleted: true });
  } catch (e) {
    console.error("hard delete user error", e);
    return res.status(500).json({ error: "Erro ao excluir usuário" });
  }
});

module.exports = router;