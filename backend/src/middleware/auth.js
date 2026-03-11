const jwt = require('jsonwebtoken');
const { get } = require('../db');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;

    // Verifica se o usuário ainda existe e está ativo no banco
    const user = await get('SELECT id, active FROM users WHERE id = ?', [payload.id]);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
    if (user.active === 0) return res.status(401).json({ error: 'Usuário desativado' });

    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Apenas admin' });
  return next();
}

module.exports = { requireAuth, requireAdmin };