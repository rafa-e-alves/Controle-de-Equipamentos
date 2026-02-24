const express = require('express');
const { get } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const total = await get('SELECT COALESCE(SUM(quantity), 0) as totalQuantity FROM items');
    const novos = await get("SELECT COALESCE(SUM(quantity), 0) as newItems FROM items WHERE condition = 'Novo'");
    const usados = await get("SELECT COALESCE(SUM(quantity), 0) as usedItems FROM items WHERE condition = 'Usado'");

    return res.json({
      totalQuantity: total?.totalQuantity || 0,
      newItems: novos?.newItems || 0,
      usedItems: usados?.usedItems || 0
    });
  } catch (e) {
    console.error('stats error', e);
    return res.status(500).json({ error: 'Erro ao carregar stats' });
  }
});

module.exports = router;
