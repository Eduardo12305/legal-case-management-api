const db = require('../database/mysql.jsx');
const {
  buildTotalPages,
  generateId,
  paginate,
  toCamelDocument,
  toCamelProcess,
  toCamelProcessUpdate,
  toCamelUser,
  toCamelClient,
} = require('../database/repositoryUtils.jsx');

function baseProcessSelect(whereClause = 'WHERE p.id = ?', orderClause = '') {
  return `
    SELECT
      p.id AS process_id,
      p.client_id AS process_client_id,
      p.lawyer_id AS process_lawyer_id,
      p.process_number,
      p.title AS process_title,
      p.description AS process_description,
      p.court AS process_court,
      p.instance AS process_instance,
      p.subject AS process_subject,
      p.status AS process_status,
      p.value AS process_value,
      p.start_date AS process_start_date,
      p.end_date AS process_end_date,
      p.created_at AS process_created_at,
      p.updated_at AS process_updated_at,
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
    FROM processes p
    INNER JOIN clients c ON c.id = p.client_id
    INNER JOIN users u ON u.id = c.user_id
    ${whereClause}
    ${orderClause}
  `;
}

class ProcessRepository {
  async hydrateProcess(row, { includeAllUpdates = true, updatesLimit } = {}) {
    if (!row) return null;

    const process = toCamelProcess(row);
    process.client = {
      ...toCamelClient(row),
      user: toCamelUser(row),
    };

    process.documents = await this.findDocuments(process.id);
    process.updates = await this.findUpdates(process.id, { includeAllUpdates, limit: updatesLimit });
    return process;
  }

  async hydrateProcessList(rows, options = {}) {
    return Promise.all(rows.map((row) => this.hydrateProcess(row, options)));
  }

  async create(data) {
    const id = data.id || generateId();

    await db.execute(
      `INSERT INTO processes (
        id, client_id, lawyer_id, process_number, title, description, court,
        instance, subject, status, value, start_date, end_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())`,
      [
        id,
        data.clientId,
        data.lawyerId ?? null,
        data.processNumber,
        data.title,
        data.description ?? null,
        data.court ?? null,
        data.instance ?? null,
        data.subject ?? null,
        data.status || 'ACTIVE',
        data.value ?? null,
        data.endDate ?? null,
      ],
    );

    return this.findById(id);
  }

  async findById(id) {
    const row = await db.one(baseProcessSelect('WHERE p.id = ? LIMIT 1'), [id]);
    return this.hydrateProcess(row);
  }

  async findByProcessNumber(processNumber) {
    const row = await db.one(baseProcessSelect('WHERE p.process_number = ? LIMIT 1'), [processNumber]);
    return this.hydrateProcess(row, { includeAllUpdates: false, updatesLimit: 3 });
  }

  async findByClientId(clientId, { lawyerId, status, page = 1, limit = 20 } = {}) {
    const pagination = paginate({ page, limit });
    const conditions = ['p.client_id = ?'];
    const params = [clientId];

    if (lawyerId) {
      conditions.push('p.lawyer_id = ?');
      params.push(lawyerId);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const rows = await db.query(
      baseProcessSelect(where, 'ORDER BY p.created_at DESC LIMIT ? OFFSET ?'),
      [...params, pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total FROM processes p ${where}`,
      params,
    );

    return {
      processes: await this.hydrateProcessList(rows, { includeAllUpdates: false, updatesLimit: 3 }),
      total,
      page: pagination.page,
      totalPages: buildTotalPages(total, pagination.limit),
    };
  }

  async findAll({ status, lawyerId, page = 1, limit = 20 }) {
    const pagination = paginate({ page, limit });
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (lawyerId) {
      conditions.push('p.lawyer_id = ?');
      params.push(lawyerId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await db.query(
      baseProcessSelect(where, 'ORDER BY p.created_at DESC LIMIT ? OFFSET ?'),
      [...params, pagination.limit, pagination.offset],
    );

    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total FROM processes p ${where}`,
      params,
    );

    return {
      processes: await this.hydrateProcessList(rows, { includeAllUpdates: false, updatesLimit: 3 }),
      total,
      page: pagination.page,
      totalPages: buildTotalPages(total, pagination.limit),
    };
  }

  async update(id, data) {
    const columnMap = {
      clientId: 'client_id',
      lawyerId: 'lawyer_id',
      processNumber: 'process_number',
      title: 'title',
      description: 'description',
      court: 'court',
      instance: 'instance',
      subject: 'subject',
      status: 'status',
      value: 'value',
      endDate: 'end_date',
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
        `UPDATE processes SET ${assignments.join(', ')}, updated_at = NOW() WHERE id = ?`,
        [...values, id],
      );
    }

    return this.findById(id);
  }

  async delete(id) {
    await db.execute('DELETE FROM processes WHERE id = ?', [id]);
    return { id };
  }

  async addDocument(data) {
    const id = generateId();
    await db.execute(
      `INSERT INTO documents (id, process_id, name, file_url, type, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id, data.processId, data.name, data.fileUrl, data.type ?? null],
    );
    return this.findDocumentById(id);
  }

  async addUpdate(data) {
    const id = generateId();
    await db.execute(
      `INSERT INTO process_updates (id, process_id, title, description, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, data.processId, data.title, data.description],
    );
    return this.findUpdateById(id);
  }

  async findDocuments(processId) {
    const rows = await db.query(
      `SELECT
        id AS document_id,
        process_id AS document_process_id,
        name AS document_name,
        file_url AS document_file_url,
        type AS document_type,
        created_at AS document_created_at
      FROM documents
      WHERE process_id = ?
      ORDER BY created_at DESC`,
      [processId],
    );

    return rows.map(toCamelDocument);
  }

  async findUpdates(processId, { includeAllUpdates = true, limit } = {}) {
    const sqlLimit = !includeAllUpdates && limit ? `LIMIT ${Number(limit)}` : '';
    const rows = await db.query(
      `SELECT
        id AS update_id,
        process_id AS update_process_id,
        title AS update_title,
        description AS update_description,
        created_at AS update_created_at
      FROM process_updates
      WHERE process_id = ?
      ORDER BY created_at DESC
      ${sqlLimit}`,
      [processId],
    );

    return rows.map(toCamelProcessUpdate);
  }

  async findDocumentById(id) {
    const row = await db.one(
      `SELECT
        id AS document_id,
        process_id AS document_process_id,
        name AS document_name,
        file_url AS document_file_url,
        type AS document_type,
        created_at AS document_created_at
      FROM documents
      WHERE id = ?
      LIMIT 1`,
      [id],
    );
    return toCamelDocument(row);
  }

  async findUpdateById(id) {
    const row = await db.one(
      `SELECT
        id AS update_id,
        process_id AS update_process_id,
        title AS update_title,
        description AS update_description,
        created_at AS update_created_at
      FROM process_updates
      WHERE id = ?
      LIMIT 1`,
      [id],
    );
    return toCamelProcessUpdate(row);
  }

  async findLinkedLawyerIdsByClientUserId(clientUserId) {
    const rows = await db.query(
      `SELECT DISTINCT p.lawyer_id AS lawyerId
       FROM processes p
       INNER JOIN clients c ON c.id = p.client_id
       INNER JOIN users u ON u.id = p.lawyer_id
       WHERE c.user_id = ?
         AND p.lawyer_id IS NOT NULL
         AND u.active = TRUE
         AND u.email_verified = TRUE
       ORDER BY p.created_at DESC`,
      [clientUserId],
    );

    return rows.map((row) => row.lawyerId);
  }

  async findLinkedClientUserIdsByLawyerId(lawyerId) {
    const rows = await db.query(
      `SELECT DISTINCT c.user_id AS userId
       FROM processes p
       INNER JOIN clients c ON c.id = p.client_id
       INNER JOIN users u ON u.id = c.user_id
       WHERE p.lawyer_id = ?
         AND u.active = TRUE
         AND u.email_verified = TRUE
       ORDER BY p.created_at DESC`,
      [lawyerId],
    );

    return rows.map((row) => row.userId);
  }
}

module.exports = new ProcessRepository();
