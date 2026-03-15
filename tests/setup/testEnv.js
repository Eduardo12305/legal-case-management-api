const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(process.cwd(), '.env.test'),
});

process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada para os testes');
}

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado para os testes');
}
