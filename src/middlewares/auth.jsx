const authService = require('../services/authService.jsx');
const userRepository = require('../repositories/userRepository.jsx');
const AppError = require('../utils/appError.jsx');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token não fornecido', 401));
  }

  const token = authHeader.split(' ')[1];

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
    };
    return next();
  } catch {
    return next(new AppError('Token inválido', 401));
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Acesso negado', 403));
    }
    return next();
  };
}

module.exports = { authMiddleware, authorizeRoles };
