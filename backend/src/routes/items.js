const express = require('express');
const { get, run } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

async function logAction({ action_type, item_id, category_id, user_name, item_brand, item_model, quantity, condition, reason, details }) {
  // logs.item_brand / item_model no schema atual são NOT NULL
  const safeBrand = item_brand || '-';
  const safeModel = item_model || '-';
  const safeQty = Number.isFinite(quantity) ? quantity : 0;

  await run(
    `INSERT INTO logs (action_type, item_id, category_id, user_name, item_brand, item_model, quantity, condition, reason, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

    [action_type, item_id ?? null, category_id ?? null, user_name, safeBrand, safeModel, safeQty, condition ?? null, reason ?? null, details ?? null]
  );
}

router.post('/items', requireAuth, requireAdmin, async (req, res) => {
  const b = req.body || {};
  const category_id = Number(b.category_id);
  const brand = (b.brand || '').trim();
  const model = (b.model || '').trim();
  const type = (b.type || 'N/A').trim();
  const condition = (b.condition || 'Novo').trim();
  const quantity = Number(b.quantity || 1);

  if (!category_id) return res.status(400).json({ error: 'category_id é obrigatório' });
  if (!brand) return res.status(400).json({ error: 'brand é obrigatório' });

  try {
    const r = await run(
      `INSERT INTO items (category_id, brand, model, type, condition, quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [category_id, brand, model, type, condition, quantity]
    );

    await logAction({
      action_type: 'ENTRADA',
      item_id: r.lastID,
      category_id,
      user_name: req.user?.name || req.user?.username || 'Usuário',
      item_brand: brand,
      item_model: model || '-',
      quantity,
      condition,
      details: 'Item adicionado ao estoque'
    });

    return res.status(201).json({ id: r.lastID });
  } catch (e) {
    console.error('create item error', e);
    return res.status(500).json({ error: 'Erro ao criar item' });
  }
});

router.put('/items/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};

  try {
    const before = await get('SELECT * FROM items WHERE id = ?', [id]);
    if (!before) return res.status(404).json({ error: 'Item não encontrado' });

    const brand = (b.brand ?? before.brand).trim();
    const model = (b.model ?? before.model ?? '').trim();
    const type = (b.type ?? before.type ?? 'N/A').trim();
    const condition = (b.condition ?? before.condition ?? 'Novo').trim();
    const quantity = Number(b.quantity ?? before.quantity ?? 1);

    await run(
      `UPDATE items SET brand=?, model=?, type=?, condition=?, quantity=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [brand, model, type, condition, quantity, id]
    );

    await logAction({
      action_type: 'EDIÇÃO',
      item_id: id,
      category_id: before.category_id,
      user_name: req.user?.name || req.user?.username || 'Usuário',
      item_brand: brand,
      item_model: model || '-',
      quantity,
      condition,
      details: `Antes: ${before.brand} ${before.model || ''}\n (${before.condition} - Quantidade antiga ${before.quantity})`
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('edit item error', e);
    return res.status(500).json({ error: 'Erro ao editar item' });
  }
});

router.post('/items/:id/saida', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const qty = Number(req.body?.quantity || 1);
  const reason = (req.body?.reason || 'Não especificado').trim();

  if (!Number.isFinite(qty) || qty <= 0) return res.status(400).json({ error: 'Quantidade inválida' });

  try {
    const item = await get('SELECT * FROM items WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });
    if (qty > item.quantity) return res.status(400).json({ error: 'Quantidade maior que disponível' });

    const newQty = item.quantity - qty;

    await run('UPDATE items SET quantity=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [newQty, id]);

    await logAction({
      action_type: 'SAÍDA',
      item_id: id,
      category_id: item.category_id,
      user_name: req.user?.name || req.user?.username || 'Usuário',
      item_brand: item.brand,
      item_model: item.model || '-',
      quantity: qty,
      condition: item.condition,
      reason,
      details: `Saída de ${item.quantity} unidade(s). Motivo: ${reason} \n ${item.quantity} -> ${newQty}`
    });

    return res.json({ ok: true, newQuantity: newQty });
  } catch (e) {
    console.error('saida error', e);
    return res.status(500).json({ error: 'Erro ao registrar saída' });
  }
});

router.delete('/items/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const item = await get('SELECT * FROM items WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Item não encontrado' });

    await logAction({
      action_type: 'EXCLUSÃO',
      item_id: id,
      category_id: item.category_id,
      user_name: req.user?.name || req.user?.username || 'Usuário',
      item_brand: item.brand,
      item_model: item.model || '-',
      quantity: item.quantity,
      condition: item.condition,
      details: 'Item removido do inventário'
    });

    await run('DELETE FROM items WHERE id = ?', [id]);
    return res.json({ ok: true });
  } catch (e) {
    console.error('delete item error', e);
    return res.status(500).json({ error: 'Erro ao deletar item' });
  }
});

module.exports = router;
