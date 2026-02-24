const express = require('express');
const { all, get } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/logs', requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 200), 1000);
  const action = (req.query.action_type || '').trim();

  try {
    const where = action ? 'WHERE l.action_type = ?' : '';
    const params = action ? [action, limit] : [limit];

    const rows = await all(
      `SELECT l.*, c.name as category_name
         FROM logs l
    LEFT JOIN categories c ON c.id = l.category_id
         ${where}
     ORDER BY l.created_at DESC, l.id DESC
        LIMIT ?`,
      params
    );

    return res.json(rows);
  } catch (e) {
    console.error('logs error', e);
    return res.status(500).json({ error: 'Erro ao carregar logs' });
  }
});

router.get('/logs/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalLogs = await get('SELECT COUNT(*) as totalLogs FROM logs');
    const totalEntradas = await get("SELECT COUNT(*) as totalEntradas FROM logs WHERE action_type = 'ENTRADA'");
    const totalSaidas = await get("SELECT COUNT(*) as totalSaidas FROM logs WHERE action_type = 'SAÍDA'");
    const totalEdicoes = await get("SELECT COUNT(*) as totalEdicoes FROM logs WHERE action_type = 'EDIÇÃO'");

    return res.json({
      totalLogs: totalLogs?.totalLogs || 0,
      totalEntradas: totalEntradas?.totalEntradas || 0,
      totalSaidas: totalSaidas?.totalSaidas || 0,
      totalEdicoes: totalEdicoes?.totalEdicoes || 0
    });
  } catch (e) {
    console.error('logs stats error', e);
    return res.status(500).json({ error: 'Erro ao carregar stats de logs' });
  }
});

module.exports = router;
