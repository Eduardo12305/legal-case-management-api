const db = require('../database/mysql.jsx');
const { generateId } = require('../database/repositoryUtils.jsx');
const userRepository = require('./userRepository.jsx');

class AuthRepository {
  async findInviteByToken(token) {
    return db.one(
      `SELECT
        id,
        email,
        role,
        invited_by_id AS invitedById,
        token,
        expires_at AS expiresAt,
        used_at AS usedAt,
        created_at AS createdAt
      FROM registration_invites
      WHERE token = ?
      LIMIT 1`,
      [token],
    );
  }

  async createInvite(data) {
    const id = data.id || generateId();
    await db.execute(
      `INSERT INTO registration_invites (
        id, email, role, invited_by_id, token, expires_at, used_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        data.email,
        data.role,
        data.invitedById ?? null,
        data.token,
        data.expiresAt,
        data.usedAt ?? null,
      ],
    );

    return db.one(
      `SELECT
        id,
        email,
        role,
        invited_by_id AS invitedById,
        token,
        expires_at AS expiresAt,
        used_at AS usedAt,
        created_at AS createdAt
      FROM registration_invites
      WHERE id = ?
      LIMIT 1`,
      [id],
    );
  }

  async markInviteAsUsed(id) {
    await db.execute(
      'UPDATE registration_invites SET used_at = NOW() WHERE id = ?',
      [id],
    );
  }

  async createEmailVerificationToken(data) {
    const id = data.id || generateId();
    await db.execute(
      `INSERT INTO email_verification_tokens (
        id, user_id, token, expires_at, used_at, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, data.userId, data.token, data.expiresAt, data.usedAt ?? null],
    );

    return this.findEmailVerificationToken(data.token);
  }

  async findEmailVerificationToken(token) {
    const row = await db.one(
      `SELECT
        id,
        user_id AS userId,
        token,
        expires_at AS expiresAt,
        used_at AS usedAt,
        created_at AS createdAt
      FROM email_verification_tokens
      WHERE token = ?
      LIMIT 1`,
      [token],
    );

    if (!row) return null;

    return {
      ...row,
      user: await userRepository.findById(row.userId),
    };
  }

  async markEmailVerificationTokenAsUsed(id) {
    await db.execute(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?',
      [id],
    );
  }
}

module.exports = new AuthRepository();
