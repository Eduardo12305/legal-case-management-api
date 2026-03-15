const { Permissions, Roles, hasPermission } = require('./permissions.jsx');

function isResponsibleLawyer(actor, process) {
  return actor?.role === Roles.LAWYER && process?.lawyerId === actor.id;
}

function isAssignedStaff(actor, process) {
  // Transitional rule: staff access should be tied to an explicit operational assignment model.
  return actor?.role === Roles.STAFF && false;
}

function canCreateProcess(actor) {
  return hasPermission(actor?.role, Permissions.PROCESS_CREATE);
}

function canViewProcess(actor, process) {
  if (!hasPermission(actor?.role, Permissions.PROCESS_VIEW)) {
    return false;
  }

  if (actor?.role === Roles.ADMIN) {
    return true;
  }

  if (actor?.role === Roles.LAWYER) {
    return isResponsibleLawyer(actor, process);
  }

  if (actor?.role === Roles.STAFF) {
    return isAssignedStaff(actor, process);
  }

  if (actor?.role === Roles.CLIENT) {
    return process?.client?.userId === actor.id;
  }

  return false;
}

function canUpdateProcess(actor, process) {
  if (!hasPermission(actor?.role, Permissions.PROCESS_UPDATE)) {
    return false;
  }

  return isResponsibleLawyer(actor, process);
}

function canChangeProcessStatus(actor, process) {
  if (!hasPermission(actor?.role, Permissions.PROCESS_STATUS_CHANGE)) {
    return false;
  }

  return isResponsibleLawyer(actor, process);
}

function canAssignProcess(actor) {
  return hasPermission(actor?.role, Permissions.PROCESS_ASSIGN);
}

module.exports = {
  canAssignProcess,
  canChangeProcessStatus,
  canCreateProcess,
  canUpdateProcess,
  canViewProcess,
  isResponsibleLawyer,
};
