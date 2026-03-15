const db = require('../database/mysql.jsx');
const {
  buildTotalPages,
  generateId,
  paginate,
  toCamelClient,
  toCamelUser,
} = require('../database/repositoryUtils.jsx');

function hydrateClientRow(row) {
  if (!row) return null;

  return {
    ...toCamelClient(row),
    user: row.user_id ? toCamelUser(row) : null,
    processes: [],
  };
}

class ClientRepository {
  async create(data) {
    const id = data.id || generateId();

    await db.execute(
      `INSERT INTO clients (
        id, user_id, cpf, rg, birth_date, profession, nationality, marital_status,
        address, city, state, zip_code, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        data.userId,
        data.cpf,
        data.rg ?? null,
        data.birthDate ?? null,
        data.profession ?? null,
        data.nationality ?? 'Brasileiro(a)',
        data.maritalStatus ?? null,
        data.address ?? null,
        data.city ?? null,
        data.state ?? null,
        data.zipCode ?? null,
        data.notes ?? null,
      ],
    );

    return this.findById(id);
  }

  async findById(id) {
    const row = await db.one(
      `SELECT
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
        c.updated_at AS client_updated_at,
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
        u.updated_at AS user_updated_at
      FROM clients c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
      LIMIT 1`,
      [id],
    );

    const client = hydrateClientRow(row);
    if (!client) return null;
    client.processes = await this.findProcessSummaries(client.id);
    return client;
  }

  async findByUserId(userId) {
    const row = await db.one(
      `SELECT
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
        c.updated_at AS client_updated_at,
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
        u.updated_at AS user_updated_at
      FROM clients c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.user_id = ?
      LIMIT 1`,
      [userId],
    );

    const client = hydrateClientRow(row);
    if (!client) return null;
    client.processes = await this.findProcessSummaries(client.id);
    return client;
  }

  async findByCpf(cpf) {
    const row = await db.one(
      `SELECT
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
        c.updated_at AS client_updated_at,
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
        u.updated_at AS user_updated_at
      FROM clients c
      INNER JOIN users u ON u.id = c.user_id
      WHERE c.cpf = ?
      LIMIT 1`,
      [cpf],
    );

    const client = hydrateClientRow(row);
    return client;
  }

  async findAll({ page = 1, limit = 20 }) {
    const pagination = paginate({ page, limit });
    const rows = await db.query(
      `SELECT
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
        c.updated_at AS client_updated_at,
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
        u.updated_at AS user_updated_at
      FROM clients c
      INNER JOIN users u ON u.id = c.user_id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query('SELECT COUNT(*) AS total FROM clients');
    const clients = await Promise.all(rows.map(async (row) => {
      const client = hydrateClientRow(row);
      client.processes = await this.findProcessSummaries(client.id);
      return client;
    }));

    return { clients, total, page: pagination.page, totalPages: buildTotalPages(total, pagination.limit) };
  }

  async update(id, data) {
    const columnMap = {
      cpf: 'cpf',
      rg: 'rg',
      birthDate: 'birth_date',
      profession: 'profession',
      nationality: 'nationality',
      maritalStatus: 'marital_status',
      address: 'address',
      city: 'city',
      state: 'state',
      zipCode: 'zip_code',
      notes: 'notes',
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
        `UPDATE clients SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = ?`,
        [...values, id],
      );
    }

    return this.findById(id);
  }

  async delete(id) {
    await db.execute('DELETE FROM clients WHERE id = ?', [id]);
    return { id };
  }

  async findProcessSummaries(clientId) {
    return db.query(
      `SELECT id, status FROM processes WHERE client_id = ? ORDER BY created_at DESC`,
      [clientId],
    );
  }
}

module.exports = new ClientRepository();
