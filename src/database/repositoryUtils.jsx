const { randomUUID } = require('crypto');

function generateId() {
  return randomUUID();
}

function toCamelUser(row) {
  if (!row) return null;

  return {
    id: row.user_id ?? row.id,
    email: row.user_email ?? row.email,
    password: row.user_password ?? row.password,
    name: row.user_name ?? row.name,
    role: row.user_role ?? row.role,
    phone: row.user_phone ?? row.phone,
    avatarUrl: row.user_avatar_url ?? row.avatar_url ?? null,
    isFirstLogin: Boolean(row.user_is_first_login ?? row.is_first_login),
    active: Boolean(row.user_active ?? row.active),
    emailVerified: Boolean(row.user_email_verified ?? row.email_verified),
    emailVerifiedAt: row.user_email_verified_at ?? row.email_verified_at ?? null,
    createdAt: row.user_created_at ?? row.created_at,
    updatedAt: row.user_updated_at ?? row.updated_at,
  };
}

function toCamelClient(row) {
  if (!row || !(row.client_id ?? row.id)) return null;

  return {
    id: row.client_id ?? row.id,
    userId: row.client_user_id ?? row.user_id,
    cpf: row.client_cpf ?? row.cpf,
    rg: row.client_rg ?? row.rg ?? null,
    birthDate: row.client_birth_date ?? row.birth_date ?? null,
    profession: row.client_profession ?? row.profession ?? null,
    nationality: row.client_nationality ?? row.nationality ?? null,
    maritalStatus: row.client_marital_status ?? row.marital_status ?? null,
    address: row.client_address ?? row.address ?? null,
    city: row.client_city ?? row.city ?? null,
    state: row.client_state ?? row.state ?? null,
    zipCode: row.client_zip_code ?? row.zip_code ?? null,
    notes: row.client_notes ?? row.notes ?? null,
    createdAt: row.client_created_at ?? row.created_at,
    updatedAt: row.client_updated_at ?? row.updated_at,
  };
}

function toCamelProcess(row) {
  if (!row) return null;

  return {
    id: row.process_id ?? row.id,
    clientId: row.process_client_id ?? row.client_id,
    lawyerId: row.process_lawyer_id ?? row.lawyer_id ?? null,
    processNumber: row.process_number,
    title: row.process_title ?? row.title,
    description: row.process_description ?? row.description ?? null,
    court: row.process_court ?? row.court ?? null,
    instance: row.process_instance ?? row.instance ?? null,
    subject: row.process_subject ?? row.subject ?? null,
    status: row.process_status ?? row.status,
    value: row.process_value ?? row.value ?? null,
    startDate: row.process_start_date ?? row.start_date,
    endDate: row.process_end_date ?? row.end_date ?? null,
    createdAt: row.process_created_at ?? row.created_at,
    updatedAt: row.process_updated_at ?? row.updated_at,
  };
}

function toCamelDocument(row) {
  if (!row) return null;

  return {
    id: row.document_id ?? row.id,
    processId: row.document_process_id ?? row.process_id,
    name: row.document_name ?? row.name,
    fileUrl: row.document_file_url ?? row.file_url,
    type: row.document_type ?? row.type ?? null,
    createdAt: row.document_created_at ?? row.created_at,
  };
}

function toCamelProcessUpdate(row) {
  if (!row) return null;

  return {
    id: row.update_id ?? row.id,
    processId: row.update_process_id ?? row.process_id,
    title: row.update_title ?? row.title,
    description: row.update_description ?? row.description,
    createdAt: row.update_created_at ?? row.created_at,
  };
}

function groupBy(items, key) {
  return items.reduce((accumulator, item) => {
    const value = item[key];
    if (!accumulator[value]) {
      accumulator[value] = [];
    }
    accumulator[value].push(item);
    return accumulator;
  }, {});
}

function paginate({ page = 1, limit = 20 }) {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 20;

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
}

function buildTotalPages(total, limit) {
  return Math.ceil(total / limit);
}

module.exports = {
  buildTotalPages,
  generateId,
  groupBy,
  paginate,
  toCamelClient,
  toCamelDocument,
  toCamelProcess,
  toCamelProcessUpdate,
  toCamelUser,
};
