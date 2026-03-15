require('dotenv').config();

const mysql = require('mysql2/promise');
const env = require('../config/env.jsx');

const databaseUrl = new URL(env.databaseUrl);

const pool = mysql.createPool({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.replace(/^\//, ''),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
  decimalNumbers: false,
});

function makeExecutor(connection) {
  return {
    async query(sql, params = []) {
      const [rows] = await connection.query(sql, params);
      return rows;
    },
    async execute(sql, params = []) {
      const [result] = await connection.execute(sql, params);
      return result;
    },
    async one(sql, params = []) {
      const rows = await this.query(sql, params);
      return rows[0] || null;
    },
  };
}

const db = {
  pool,
  async query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async execute(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result;
  },
  async one(sql, params = []) {
    const rows = await db.query(sql, params);
    return rows[0] || null;
  },
  async transaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const tx = makeExecutor(connection);
      const result = await callback(tx);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  async close() {
    await pool.end();
  },
};

module.exports = db;
