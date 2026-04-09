/**
 * reset-db.js
 * Roda com: node reset-db.js
 * Limpa todos os dados e cria um admin padrão.
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.resolve(process.cwd(), 'data', 'inventario.db');

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function reset() {
  console.log('🗑️  Limpando banco de dados...');

  await run('DELETE FROM logs');
  await run('DELETE FROM requests');
  await run('DELETE FROM items');
  await run('DELETE FROM categories');
  await run('DELETE FROM users');

  // Reseta os auto-incrementos
  await run("DELETE FROM sqlite_sequence WHERE name IN ('logs','requests','items','categories','users')").catch(() => {});

  console.log('✅ Dados apagados.');

  // Cria admin padrão
  const hash = await bcrypt.hash('admin123', 10);
  await run(
    `INSERT INTO users (username, name, password, role, active) VALUES (?, ?, ?, ?, ?)`,
    ['admin', 'Administrador', hash, 'admin', 1]
  );

  console.log('');
  console.log('👤 Admin criado:');
  console.log('   Usuário: admin');
  console.log('   Senha:   admin123');
  console.log('');
  console.log('⚠️  Troque a senha após o primeiro login!');
  console.log('');
  console.log('🚀 Banco resetado com sucesso!');

  db.close();
}

reset().catch((e) => {
  console.error('Erro ao resetar banco:', e);
  db.close();
  process.exit(1);
});