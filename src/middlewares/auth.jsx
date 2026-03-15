const authService = require('../services/authService.jsx');
const userRepository = require('../repositories/userRepository.jsx');
const AppError = require('../utils/appError.jsx');
const { getRolePermissions } = require('../modules/access-control/permissions.jsx');

async function authMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next(new AppError('Token não fornecido', 401));
  }

  try {
    const decoded = authService.verifyToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user || !user.active) {
      return next(new AppError('Usuário não autorizado', 401));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: [
        ...new Set([
          ...getRolePermissions(user.role),
          ...(user.userPermissions || []).map((permission) => permission.permission),
        ]),
      ],
    };
    return next();
  } catch {
    return next(new AppError('Token inválido', 401));
  }
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  if (typeof req.query?.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }

  return null;
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Acesso negado', 403));
    }
    return next();
  };
}

function authorizePermissions(...permissions) {
  return (req, res, next) => {
    if (!req.user || !permissions.every((permission) => req.user.permissions?.includes(permission))) {
      return next(new AppError('Permissão insuficiente', 403));
    }
    return next();
  };
}

module.exports = { authMiddleware, authorizePermissions, authorizeRoles };
