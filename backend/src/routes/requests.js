const express = require('express');
const { get, run, all } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Cria a tabela se nao existir
run(`CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  item_brand TEXT,
  item_model TEXT,
  category_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  admin_note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).catch(console.error);

Promise.all([
  run(`ALTER TABLE requests ADD COLUMN item_brand TEXT`).catch(() => {}),
  run(`ALTER TABLE requests ADD COLUMN item_model TEXT`).catch(() => {}),
  run(`ALTER TABLE requests ADD COLUMN category_name TEXT`),
]).catch(() => {});

// POST /requests - usuario cria solicitacao
router.post('/requests', requireAuth, async (req, res) => {
  const b = req.body || {};
  const item_id = Number(b.item_id);
  const quantity = Number(b.quantity || 1);
  const reason = (b.reason || '').trim();

  if (!item_id) return res.status(400).json({ error: 'item_id obrigatorio' });
  if (quantity <= 0) return res.status(400).json({ error: 'Quantidade invalida' });

  try {
    const item = await get(`
      SELECT i.*, c.name as category_name
      FROM items i
      LEFT JOIN categories c ON c.id = i.category_id
      WHERE i.id = ?
    `, [item_id]);
    if (!item) return res.status(404).json({ error: 'Item nao encontrado' });
    if (quantity > item.quantity) return res.status(400).json({ error: 'Quantidade maior que disponivel em estoque' });

    const r = await run(
      `INSERT INTO requests (item_id, user_id, user_name, item_brand, item_model, category_name, quantity, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id, req.user.id, req.user.name || req.user.username,
       item.brand, item.model || '', item.category_name || '',
       quantity, reason]
    );

    return res.status(201).json({ id: r.lastID });
  } catch (e) {
    console.error('create request error', e);
    return res.status(500).json({ error: 'Erro ao criar solicitacao' });
  }
});

// GET /requests - cada usuario ve APENAS as suas
router.get('/requests', requireAuth, async (req, res) => {
  try {
    const rows = await all(`
      SELECT r.*,
        COALESCE(i.brand, r.item_brand) as item_brand,
        COALESCE(i.model, r.item_model) as item_model,
        COALESCE(i.condition, '') as item_condition,
        COALESCE(c.name, r.category_name) as category_name
      FROM requests r
      LEFT JOIN items i ON i.id = r.item_id
      LEFT JOIN categories c ON c.id = i.category_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [req.user.id]);
    return res.json(rows);
  } catch (e) {
    console.error('list requests error', e);
    return res.status(500).json({ error: 'Erro ao listar solicitacoes' });
  }
});

// GET /requests/admin - somente admin ve todas
router.get('/requests/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await all(`
      SELECT r.*,
        COALESCE(i.brand, r.item_brand) as item_brand,
        COALESCE(i.model, r.item_model) as item_model,
        COALESCE(i.condition, '') as item_condition,
        COALESCE(c.name, r.category_name) as category_name
      FROM requests r
      LEFT JOIN items i ON i.id = r.item_id
      LEFT JOIN categories c ON c.id = i.category_id
      ORDER BY r.created_at DESC
    `);
    return res.json(rows);
  } catch (e) {
    console.error('list all requests error', e);
    return res.status(500).json({ error: 'Erro ao listar solicitacoes' });
  }
});

// POST /requests/:id/approve - admin aprova
router.post('/requests/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const admin_note = (req.body?.admin_note || '').trim();

  try {
    const req_ = await get('SELECT * FROM requests WHERE id = ?', [id]);
    if (!req_) return res.status(404).json({ error: 'Solicitacao nao encontrada' });
    if (req_.status !== 'PENDENTE') return res.status(400).json({ error: 'Solicitacao ja processada' });

    const item = await get('SELECT * FROM items WHERE id = ?', [req_.item_id]);
    if (!item) return res.status(404).json({ error: 'Item nao encontrado' });
    if (req_.quantity > item.quantity) return res.status(400).json({ error: 'Estoque insuficiente' });

    const newQty = item.quantity - req_.quantity;
    await run('UPDATE items SET quantity=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [newQty, item.id]);

    await run(
      'UPDATE requests SET status=?, admin_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      ['APROVADO', admin_note, id]
    );

    await run(
      `INSERT INTO logs (action_type, item_id, category_id, user_name, item_brand, item_model, quantity, condition, reason, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['SAÍDA', item.id, item.category_id,
       req.user.name || req.user.username, item.brand, item.model || '-',
       req_.quantity, item.condition, req_.reason,
       'Retirada de ' + req_.user_name + ' aprovada por ' + (req.user.name || req.user.username) + '. ' + item.quantity + ' -> ' + newQty]
    );

    return res.json({ ok: true, newQuantity: newQty });
  } catch (e) {
    console.error('approve error', e);
    return res.status(500).json({ error: 'Erro ao aprovar' });
  }
});

// POST /requests/:id/reject - admin recusa
router.post('/requests/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const admin_note = (req.body?.admin_note || '').trim();

  try {
    const req_ = await get('SELECT * FROM requests WHERE id = ?', [id]);
    if (!req_) return res.status(404).json({ error: 'Solicitacao nao encontrada' });
    if (req_.status !== 'PENDENTE') return res.status(400).json({ error: 'Solicitacao ja processada' });

    await run(
      'UPDATE requests SET status=?, admin_note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
      ['RECUSADO', admin_note, id]
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error('reject error', e);
    return res.status(500).json({ error: 'Erro ao recusar' });
  }
});

module.exports = router;