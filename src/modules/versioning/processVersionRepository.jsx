const db = require('../../database/mysql.jsx');
const { generateId } = require('../../database/repositoryUtils.jsx');

class ProcessVersionRepository {
  async findLatestVersionNumber(processId) {
    const row = await db.one(
      `SELECT version_number AS versionNumber
       FROM process_versions
       WHERE process_id = ?
       ORDER BY version_number DESC
       LIMIT 1`,
      [processId],
    );

    return row?.versionNumber || 0;
  }

  async create(data) {
    const id = generateId();
    await db.execute(
      `INSERT INTO process_versions (
        id, process_id, version_number, changed_by_id, change_type,
        previous_data, new_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        data.processId,
        data.versionNumber,
        data.changedById ?? null,
        data.changeType,
        data.previousData ? JSON.stringify(data.previousData) : null,
        data.newData ? JSON.stringify(data.newData) : null,
      ],
    );

    return {
      id,
      ...data,
    };
  }
}

module.exports = ProcessVersionRepository;
