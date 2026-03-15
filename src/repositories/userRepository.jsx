const db = require('../database/mysql.jsx');
const {
  buildTotalPages,
  generateId,
  groupBy,
  paginate,
  toCamelClient,
  toCamelUser,
} = require('../database/repositoryUtils.jsx');

function buildRoleVisibility(actor, role) {
  const clauses = ['u.id <> ?'];
  const params = [actor.id];

  if (role) {
    clauses.push('u.role = ?');
    params.push(role);
  }

  if (actor.role === 'CLIENT') {
    clauses.push('1 = 0');
  } else if (actor.role === 'STAFF' || actor.role === 'LAWYER') {
    clauses.push("u.role IN ('STAFF', 'CLIENT')");
  }

  return { clauses, params };
}

class UserRepository {
  async hydrateUsers(rows) {
    if (rows.length === 0) {
      return [];
    }

    const userIds = rows.map((row) => row.user_id);
    const placeholders = userIds.map(() => '?').join(',');

    const permissionRows = await db.query(
      `SELECT id, user_id, permission, granted_by_id, created_at
       FROM user_permissions
       WHERE user_id IN (${placeholders})
       ORDER BY created_at ASC`,
      userIds,
    );

    const permissionsByUserId = groupBy(permissionRows, 'user_id');

    return rows.map((row) => {
      const user = toCamelUser(row);
      const client = row.client_id ? toCamelClient(row) : null;

      return {
        ...user,
        client,
        userPermissions: (permissionsByUserId[user.id] || []).map((permission) => ({
          id: permission.id,
          userId: permission.user_id,
          permission: permission.permission,
          grantedById: permission.granted_by_id,
          createdAt: permission.created_at,
        })),
      };
    });
  }

  async create(data) {
    const id = data.id || generateId();

    await db.execute(
      `INSERT INTO users (
        id, email, password, name, role, phone, avatar_url, is_first_login,
        active, email_verified, email_verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        data.email,
        data.password,
        data.name,
        data.role || 'CLIENT',
        data.phone ?? null,
        data.avatarUrl ?? null,
        data.isFirstLogin ?? true,
        data.active ?? true,
        data.emailVerified ?? false,
        data.emailVerifiedAt ?? null,
      ],
    );

    return this.findById(id);
  }

  async findById(id) {
    const rows = await db.query(
      `SELECT
        u.id AS user_id,
        u.email AS user_email,
        u.password AS user_password,
        u.name AS user_name,
        u.role AS user_role,
        u.phone AS user_phone,
        u.avatar_url AS user_avatar_url,
        u.is_first_login AS user_is_first_login,
        u.active AS user_active,
        u.email_verified AS user_email_verified,
        u.email_verified_at AS user_email_verified_at,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        c.id AS client_id,
        c.user_id AS client_user_id,
        c.cpf AS client_cpf,
        c.rg AS client_rg,
        c.birth_date AS client_birth_date,
        c.profession AS client_profession,
        c.nationality AS client_nationality,
        c.marital_status AS client_marital_status,
        c.address AS client_address,
        c.city AS client_city,
        c.state AS client_state,
        c.zip_code AS client_zip_code,
        c.notes AS client_notes,
        c.created_at AS client_created_at,
        c.updated_at AS client_updated_at
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      WHERE u.id = ?
      LIMIT 1`,
      [id],
    );

    const users = await this.hydrateUsers(rows);
    return users[0] || null;
  }

  async findByEmail(email) {
    const rows = await db.query(
      `SELECT
        u.id AS user_id,
        u.email AS user_email,
        u.password AS user_password,
        u.name AS user_name,
        u.role AS user_role,
        u.phone AS user_phone,
        u.avatar_url AS user_avatar_url,
        u.is_first_login AS user_is_first_login,
        u.active AS user_active,
        u.email_verified AS user_email_verified,
        u.email_verified_at AS user_email_verified_at,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        c.id AS client_id,
        c.user_id AS client_user_id,
        c.cpf AS client_cpf,
        c.rg AS client_rg,
        c.birth_date AS client_birth_date,
        c.profession AS client_profession,
        c.nationality AS client_nationality,
        c.marital_status AS client_marital_status,
        c.address AS client_address,
        c.city AS client_city,
        c.state AS client_state,
        c.zip_code AS client_zip_code,
        c.notes AS client_notes,
        c.created_at AS client_created_at,
        c.updated_at AS client_updated_at
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      WHERE u.email = ?
      LIMIT 1`,
      [email],
    );

    const users = await this.hydrateUsers(rows);
    return users[0] || null;
  }

  async findAll({ role, page = 1, limit = 20 }) {
    const pagination = paginate({ page, limit });
    const where = role ? 'WHERE u.role = ?' : '';
    const params = role ? [role] : [];

    const rows = await db.query(
      `SELECT
        u.id AS user_id,
        u.email AS user_email,
        u.password AS user_password,
        u.name AS user_name,
        u.role AS user_role,
        u.phone AS user_phone,
        u.avatar_url AS user_avatar_url,
        u.is_first_login AS user_is_first_login,
        u.active AS user_active,
        u.email_verified AS user_email_verified,
        u.email_verified_at AS user_email_verified_at,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        c.id AS client_id,
        c.user_id AS client_user_id,
        c.cpf AS client_cpf,
        c.rg AS client_rg,
        c.birth_date AS client_birth_date,
        c.profession AS client_profession,
        c.nationality AS client_nationality,
        c.marital_status AS client_marital_status,
        c.address AS client_address,
        c.city AS client_city,
        c.state AS client_state,
        c.zip_code AS client_zip_code,
        c.notes AS client_notes,
        c.created_at AS client_created_at,
        c.updated_at AS client_updated_at
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      params,
    );

    return {
      users: await this.hydrateUsers(rows),
      total,
      page: pagination.page,
      totalPages: buildTotalPages(total, pagination.limit),
    };
  }

  async findVisibleUsers({ actor, role, page = 1, limit = 20 }) {
    const pagination = paginate({ page, limit });
    const visibility = buildRoleVisibility(actor, role);
    const where = `WHERE ${visibility.clauses.join(' AND ')}`;

    const rows = await db.query(
      `SELECT
        u.id AS user_id,
        u.email AS user_email,
        u.password AS user_password,
        u.name AS user_name,
        u.role AS user_role,
        u.phone AS user_phone,
        u.avatar_url AS user_avatar_url,
        u.is_first_login AS user_is_first_login,
        u.active AS user_active,
        u.email_verified AS user_email_verified,
        u.email_verified_at AS user_email_verified_at,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        c.id AS client_id,
        c.user_id AS client_user_id,
        c.cpf AS client_cpf,
        c.rg AS client_rg,
        c.birth_date AS client_birth_date,
        c.profession AS client_profession,
        c.nationality AS client_nationality,
        c.marital_status AS client_marital_status,
        c.address AS client_address,
        c.city AS client_city,
        c.state AS client_state,
        c.zip_code AS client_zip_code,
        c.notes AS client_notes,
        c.created_at AS client_created_at,
        c.updated_at AS client_updated_at
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?`,
      [...visibility.params, pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`,
      visibility.params,
    );

    return {
      users: await this.hydrateUsers(rows),
      total,
      page: pagination.page,
      totalPages: buildTotalPages(total, pagination.limit),
    };
  }

  async update(id, data) {
    const columnMap = {
      email: 'email',
      password: 'password',
      name: 'name',
      role: 'role',
      phone: 'phone',
      avatarUrl: 'avatar_url',
      isFirstLogin: 'is_first_login',
      active: 'active',
      emailVerified: 'email_verified',
      emailVerifiedAt: 'email_verified_at',
    };

    const assignments = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (!Object.prototype.hasOwnProperty.call(columnMap, key)) continue;
      assignments.push(`${columnMap[key]} = ?`);
      values.push(value);
    }

    if (assignments.length > 0) {
      await db.execute(
        `UPDATE users SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = ?`,
        [...values, id],
      );
    }

    return this.findById(id);
  }

  async replaceStaffPermissions(userId, permissions, grantedById) {
    await db.execute('DELETE FROM user_permissions WHERE user_id = ?', [userId]);

    for (const permission of permissions) {
      await db.execute(
        `INSERT INTO user_permissions (id, user_id, permission, granted_by_id, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [generateId(), userId, permission, grantedById || null],
      );
    }

    return this.findById(userId);
  }

  async countActiveAdmins() {
    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total
       FROM users
       WHERE role = 'ADMIN' AND active = 1`,
    );

    return total;
  }

  async delete(id) {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    return { id };
  }
}

module.exports = new UserRepository();
