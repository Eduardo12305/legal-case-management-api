require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const env = require('../config/env.jsx');

const prisma = new PrismaClient({
  datasourceUrl: env.databaseUrl,
});

module.exports = prisma;
