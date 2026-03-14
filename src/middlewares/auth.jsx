const authService = require('../services/authService');
const userRepository = require('../repositories/userRepository');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = authService.verifyToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuário não autorizado' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

module.exports = { authMiddleware, authorizeRoles };
