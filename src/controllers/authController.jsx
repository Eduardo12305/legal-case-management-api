const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const { email, password, name, phone, role, clientData } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
      }

      if (role === 'CLIENT' && (!clientData || !clientData.cpf)) {
        return res.status(400).json({ error: 'CPF é obrigatório para clientes' });
      }

      const result = await authService.register({ email, password, name, phone, role, clientData });
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const result = await authService.login({ email, password });

      return res.json(result);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        return res.status(400).json({ error: 'O ID do usuário e a nova senha são obrigatórios' });
      }

      const result = await authService.changePassword(userId, newPassword);
      
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
