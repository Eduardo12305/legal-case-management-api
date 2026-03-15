const AppError = require('../utils/appError.jsx');

function loadEnv() {
  const port = Number(process.env.PORT || 3000);
  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173';
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;

  if (!process.env.DATABASE_URL) {
    throw new AppError('DATABASE_URL não configurada', 500);
  }

  if (!process.env.JWT_SECRET) {
    throw new AppError('JWT_SECRET não configurado', 500);
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new AppError('PORT inválida', 500);
  }

  if (smtpPort !== undefined && (!Number.isInteger(smtpPort) || smtpPort <= 0)) {
    throw new AppError('SMTP_PORT inválida', 500);
  }

  return {
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development',
    port,
    corsAllowedOrigins,
    appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${port}`,
    frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFromEmail: process.env.SMTP_FROM_EMAIL || '',
    smtpFromName: process.env.SMTP_FROM_NAME || 'Advon',
  };
}

module.exports = loadEnv();
