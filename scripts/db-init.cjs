require('dotenv').config();

const db = require('../src/database/mysql.jsx');

async function main() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(191) NOT NULL,
      role ENUM('ADMIN','LAWYER','STAFF','CLIENT') NOT NULL DEFAULT 'CLIENT',
      phone VARCHAR(50) NULL,
      avatar_url TEXT NULL,
      is_first_login BOOLEAN NOT NULL DEFAULT TRUE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      email_verified_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS clients (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL UNIQUE,
      cpf VARCHAR(50) NOT NULL UNIQUE,
      rg VARCHAR(50) NULL,
      birth_date DATETIME NULL,
      profession VARCHAR(191) NULL,
      nationality VARCHAR(191) NULL DEFAULT 'Brasileiro(a)',
      marital_status VARCHAR(191) NULL,
      address TEXT NULL,
      city VARCHAR(191) NULL,
      state VARCHAR(191) NULL,
      zip_code VARCHAR(50) NULL,
      notes TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_clients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS processes (
      id VARCHAR(36) PRIMARY KEY,
      client_id VARCHAR(36) NOT NULL,
      lawyer_id VARCHAR(36) NULL,
      process_number VARCHAR(191) NOT NULL UNIQUE,
      title VARCHAR(191) NOT NULL,
      description TEXT NULL,
      court VARCHAR(191) NULL,
      instance VARCHAR(191) NULL,
      subject VARCHAR(191) NULL,
      status ENUM('ACTIVE','ARCHIVED','SUSPENDED','CLOSED','WON','LOST') NOT NULL DEFAULT 'ACTIVE',
      value DECIMAL(15,2) NULL,
      start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_processes_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      CONSTRAINT fk_processes_lawyer FOREIGN KEY (lawyer_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS documents (
      id VARCHAR(36) PRIMARY KEY,
      process_id VARCHAR(36) NOT NULL,
      name VARCHAR(191) NOT NULL,
      file_url TEXT NOT NULL,
      type VARCHAR(100) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_documents_process FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS process_updates (
      id VARCHAR(36) PRIMARY KEY,
      process_id VARCHAR(36) NOT NULL,
      title VARCHAR(191) NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_process_updates_process FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id VARCHAR(36) PRIMARY KEY,
      sender_id VARCHAR(36) NOT NULL,
      recipient_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_chat_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_chat_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(36) PRIMARY KEY,
      actor_id VARCHAR(36) NULL,
      action ENUM('LOGIN','USER_CREATED','USER_UPDATED','USER_ROLE_CHANGED','USER_PERMISSION_CHANGED','PROCESS_CREATED','PROCESS_UPDATED','PROCESS_STATUS_CHANGED','PROCESS_DELETED','PROCESS_ASSIGNED','DOCUMENT_ADDED','LEGAL_EVENT_CREATED') NOT NULL,
      entity_type ENUM('USER','CLIENT','PROCESS','DOCUMENT','LEGAL_EVENT','SYSTEM') NOT NULL,
      entity_id VARCHAR(36) NULL,
      context JSON NULL,
      metadata JSON NULL,
      ip_address VARCHAR(191) NULL,
      user_agent TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS legal_events (
      id VARCHAR(36) PRIMARY KEY,
      process_id VARCHAR(36) NOT NULL,
      author_id VARCHAR(36) NULL,
      type ENUM('PROCESS_CREATED','STATUS_CHANGED','DOCUMENT_ADDED','LAWYER_ASSIGNED','NOTE_ADDED','INTERNAL_MOVEMENT','CLIENT_CONTACT') NOT NULL,
      title VARCHAR(191) NOT NULL,
      description TEXT NULL,
      metadata JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_legal_events_process FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
      CONSTRAINT fk_legal_events_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS process_versions (
      id VARCHAR(36) PRIMARY KEY,
      process_id VARCHAR(36) NOT NULL,
      version_number INT NOT NULL,
      changed_by_id VARCHAR(36) NULL,
      change_type VARCHAR(191) NOT NULL,
      previous_data JSON NULL,
      new_data JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_process_versions_process_version (process_id, version_number),
      CONSTRAINT fk_process_versions_process FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
      CONSTRAINT fk_process_versions_actor FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS process_assignments (
      id VARCHAR(36) PRIMARY KEY,
      process_id VARCHAR(36) NOT NULL,
      lawyer_id VARCHAR(36) NOT NULL,
      assigned_by_id VARCHAR(36) NULL,
      role ENUM('RESPONSIBLE','SUPPORTING') NOT NULL DEFAULT 'RESPONSIBLE',
      assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME NULL,
      CONSTRAINT fk_process_assignments_process FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
      CONSTRAINT fk_process_assignments_lawyer FOREIGN KEY (lawyer_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_process_assignments_actor FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS user_permissions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      permission ENUM('CLIENT_CREATE','CLIENT_VIEW','CLIENT_UPDATE','DOCUMENT_UPLOAD','PROCESS_VIEW_ASSIGNED','PROCESS_INTAKE_CREATE','LEGAL_EVENT_CREATE','FINANCIAL_VIEW','FINANCIAL_MANAGE') NOT NULL,
      granted_by_id VARCHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_permissions_user_permission (user_id, permission),
      CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_user_permissions_actor FOREIGN KEY (granted_by_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS registration_invites (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(191) NOT NULL UNIQUE,
      role ENUM('ADMIN','LAWYER','STAFF','CLIENT') NOT NULL,
      invited_by_id VARCHAR(36) NULL,
      token VARCHAR(191) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_registration_invites_actor FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token VARCHAR(191) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_email_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  ];

  for (const statement of statements) {
    await db.execute(statement);
  }

  console.log('Banco inicializado com sucesso.');
}

main()
  .catch((error) => {
    console.error('Erro ao inicializar banco:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
