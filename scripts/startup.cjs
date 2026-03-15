require('dotenv').config();

const db = require('../src/database/mysql.jsx');
const { initDatabase } = require('./db-init.cjs');
const { runSeed } = require('./seed.cjs');

async function main() {
  await initDatabase({ closeConnection: false });

  if (process.env.SEED_ON_START === 'true') {
    await runSeed();
  }

  require('../server.js');
}

main().catch(async (error) => {
  console.error('Erro ao inicializar aplicacao:', error);
  await db.close();
  process.exit(1);
});
