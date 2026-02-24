const express = require("express");
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Token inválido" });
  next();
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Apenas admin" });
  next();
}

// Log compatível com logs schema NOT NULL (action_type, user_name, item_brand, item_model, quantity)
function writeSystemLog(db, { actionType, actorName, actorId, categoryId, details }) {
  return new Promise((resolve) => {
    db.run(
      `INSERT INTO logs (
        action_type,
        user_name,
        user_id,
        item_id,
        category_id,
        item_brand,
        item_model,
        quantity,
        details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actionType,
        actorName || "Sistema",
        actorId ?? null,
        null,
        categoryId ?? null,
        "SISTEMA",
        "CATEGORIAS",
        0,
        details || "",
      ],
      (err) => {
        if (err) console.error("Erro ao gravar log (categories):", err.message);
        resolve();
      }
    );
  });
}

/**
 * GET /api/categories
 */
router.get("/categories", requireAuth, (req, res) => {
  const db = req.db;
  const sql = `
    SELECT
      c.id,
      c.name,
      COUNT(i.id) AS item_count,
      COALESCE(SUM(i.quantity), 0) AS total_quantity
    FROM categories c
    LEFT JOIN items i ON i.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY c.name COLLATE NOCASE ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Erro ao listar categorias" });
    res.json(rows);
  });
});

/**
 * GET /api/categories/:id/items
 */
router.get("/categories/:id/items", requireAuth, (req, res) => {
  const db = req.db;
  const categoryId = Number(req.params.id);
  if (!categoryId) return res.status(400).json({ error: "ID inválido" });

  db.all(
    `SELECT id, category_id, brand, model, type, condition, quantity, location, notes
     FROM items
     WHERE category_id = ?
     ORDER BY brand COLLATE NOCASE ASC, model COLLATE NOCASE ASC`,
    [categoryId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Erro ao listar itens" });
      res.json(rows);
    }
  );
});

/**
 * POST /api/categories  (ADMIN)
 */
router.post("/categories", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Nome requerido" });

  db.run("INSERT INTO categories (name) VALUES (?)", [name], async function (err) {
    if (err) {
      if (String(err.message).toUpperCase().includes("UNIQUE")) {
        return res.status(400).json({ error: "Categoria já existe" });
      }
      return res.status(500).json({ error: "Erro ao criar categoria" });
    }

    const newId = this.lastID;

    await writeSystemLog(db, {
      actionType: "EDIÇÃO",
      actorName: req.user?.name,
      actorId: req.user?.id,
      categoryId: newId,
      details: `Criou categoria: ${name}`,
    });

    res.json({ ok: true, id: newId });
  });
});

/**
 * PUT /api/categories/:id  (ADMIN)  ✅ RENOMEAR
 */
router.put("/categories/:id", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;
  const categoryId = Number(req.params.id);
  const newName = String(req.body?.name || "").trim();

  if (!categoryId) return res.status(400).json({ error: "ID inválido" });
  if (!newName) return res.status(400).json({ error: "Nome requerido" });

  db.get("SELECT id, name FROM categories WHERE id = ?", [categoryId], (err, cat) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar categoria" });
    if (!cat) return res.status(404).json({ error: "Categoria não encontrada" });

    // Checa duplicado (case-insensitive)
    db.get(
      "SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id <> ?",
      [newName, categoryId],
      (err2, dup) => {
        if (err2) return res.status(500).json({ error: "Erro ao validar categoria" });
        if (dup) return res.status(400).json({ error: "Já existe uma categoria com esse nome" });

        db.run("UPDATE categories SET name = ? WHERE id = ?", [newName, categoryId], async (err3) => {
          if (err3) return res.status(500).json({ error: "Erro ao renomear categoria" });

          await writeSystemLog(db, {
            actionType: "EDIÇÃO",
            actorName: req.user?.name,
            actorId: req.user?.id,
            categoryId,
            details: `Renomeou categoria: "${cat.name}" → "${newName}"`,
          });

          res.json({ ok: true });
        });
      }
    );
  });
});

/**
 * DELETE /api/categories/:id (ADMIN) com trava 409 se tiver itens
 */
router.delete("/categories/:id", requireAuth, requireAdmin, (req, res) => {
  const db = req.db;
  const categoryId = Number(req.params.id);
  if (!categoryId) return res.status(400).json({ error: "ID inválido" });

  db.get("SELECT id, name FROM categories WHERE id = ?", [categoryId], (err, cat) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar categoria" });
    if (!cat) return res.status(404).json({ error: "Categoria não encontrada" });

    db.get("SELECT COUNT(1) AS total FROM items WHERE category_id = ?", [categoryId], (err2, row) => {
      if (err2) return res.status(500).json({ error: "Erro ao validar categoria" });

      if ((row?.total || 0) > 0) {
        return res.status(409).json({
          error: "Não é possível remover: existem itens vinculados a esta categoria.",
        });
      }

      db.run("DELETE FROM categories WHERE id = ?", [categoryId], async (err3) => {
        if (err3) return res.status(500).json({ error: "Erro ao remover categoria" });

        await writeSystemLog(db, {
          actionType: "EXCLUSÃO",
          actorName: req.user?.name,
          actorId: req.user?.id,
          categoryId,
          details: `Removeu categoria: ${cat.name}`,
        });

        res.json({ ok: true });
      });
    });
  });
});

module.exports = router;
