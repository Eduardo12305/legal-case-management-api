const { spawnSync } = require('node:child_process');
const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não configurada em .env.test');
  process.exit(1);
}

const prismaExecutable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const prismaArgs = ['prisma', ...process.argv.slice(2)];

const result = spawnSync(prismaExecutable, prismaArgs, {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
