const AppError = require('../utils/appError.jsx');

function loadEnv() {
  const port = Number(process.env.PORT || 3000);

  if (!process.env.DATABASE_URL) {
    throw new AppError('DATABASE_URL não configurada', 500);
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET não configurado', 500);
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new AppError('PORT inválida', 500);
  }

  return {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development',
    port,
  };
}

module.exports = loadEnv();
