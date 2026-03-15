const Roles = Object.freeze({
  ADMIN: 'ADMIN',
  LAWYER: 'LAWYER',
  STAFF: 'STAFF',
  CLIENT: 'CLIENT',
});

const Permissions = Object.freeze({
  USERS_MANAGE: 'users:manage',
  USERS_VIEW: 'users:view',
  SETTINGS_MANAGE: 'settings:manage',
  REPORTS_VIEW: 'reports:view',
  AUDIT_VIEW: 'audit:view',
  STAFF_PERMISSION_MANAGE: 'staff-permission:manage',
  CLIENT_CREATE: 'client:create',
  CLIENT_VIEW: 'client:view',
  CLIENT_UPDATE: 'client:update',
  CLIENT_DEACTIVATE: 'client:deactivate',
  PROCESS_CREATE: 'process:create',
  PROCESS_VIEW: 'process:view',
  PROCESS_UPDATE: 'process:update',
  PROCESS_ASSIGN: 'process:assign',
  PROCESS_STATUS_CHANGE: 'process:status-change',
  PROCESS_DELETE: 'process:delete',
  LEGAL_EVENT_CREATE: 'legal-event:create',
  DOCUMENT_UPLOAD: 'document:upload',
  PROCESS_INTAKE_CREATE: 'process-intake:create',
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_MANAGE: 'financial:manage',
});

const StaffPermissions = Object.freeze({
  CLIENT_CREATE: 'CLIENT_CREATE',
  CLIENT_VIEW: 'CLIENT_VIEW',
  CLIENT_UPDATE: 'CLIENT_UPDATE',
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  PROCESS_VIEW_ASSIGNED: 'PROCESS_VIEW_ASSIGNED',
  PROCESS_INTAKE_CREATE: 'PROCESS_INTAKE_CREATE',
  LEGAL_EVENT_CREATE: 'LEGAL_EVENT_CREATE',
  FINANCIAL_VIEW: 'FINANCIAL_VIEW',
  FINANCIAL_MANAGE: 'FINANCIAL_MANAGE',
});

const STAFF_GRANTABLE_PERMISSIONS = Object.freeze([
  StaffPermissions.CLIENT_CREATE,
  StaffPermissions.CLIENT_VIEW,
  StaffPermissions.CLIENT_UPDATE,
  StaffPermissions.DOCUMENT_UPLOAD,
  StaffPermissions.PROCESS_VIEW_ASSIGNED,
  StaffPermissions.PROCESS_INTAKE_CREATE,
  StaffPermissions.LEGAL_EVENT_CREATE,
  StaffPermissions.FINANCIAL_VIEW,
  StaffPermissions.FINANCIAL_MANAGE,
]);

const rolePermissions = Object.freeze({
  [Roles.ADMIN]: [
    Permissions.USERS_MANAGE,
    Permissions.USERS_VIEW,
    Permissions.SETTINGS_MANAGE,
    Permissions.REPORTS_VIEW,
    Permissions.AUDIT_VIEW,
    Permissions.STAFF_PERMISSION_MANAGE,
  ],
  [Roles.LAWYER]: [
    Permissions.CLIENT_VIEW,
    Permissions.PROCESS_CREATE,
    Permissions.PROCESS_VIEW,
    Permissions.PROCESS_UPDATE,
    Permissions.PROCESS_ASSIGN,
    Permissions.PROCESS_STATUS_CHANGE,
    Permissions.LEGAL_EVENT_CREATE,
    Permissions.DOCUMENT_UPLOAD,
  ],
  [Roles.STAFF]: [
  ],
  [Roles.CLIENT]: [
    Permissions.PROCESS_VIEW,
  ],
});

function getRolePermissions(role) {
  return rolePermissions[role] || [];
}

function hasPermission(role, permission) {
  return getRolePermissions(role).includes(permission);
}

module.exports = {
  Permissions,
  Roles,
  STAFF_GRANTABLE_PERMISSIONS,
  StaffPermissions,
  getRolePermissions,
  hasPermission,
};
