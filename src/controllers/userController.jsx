const userService = require('../services/userService');
const { parsePaginationParams } = require('../utils/validation');

class UserController {
  async getProfile(req, res) {
    try {
      const user = await userService.getProfile(req.user.id);
      return res.json(user);
    } catch (error) {
      return res.status(404).json({ error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await userService.updateProfile(req.user.id, req.body);
      return res.json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateClientData(req, res) {
    try {
      const client = await userService.updateClientData(req.user.id, req.body);
      return res.json(client);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      }

      await userService.changePassword(req.user.id, { currentPassword, newPassword });
      return res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listUsers(req, res) {
    try {
      const { role, page, limit } = req.query;
      const pagination = parsePaginationParams({ page, limit });
      const result = await userService.listUsers({
        role,
        ...pagination,
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async toggleUserActive(req, res) {
    try {
      const user = await userService.toggleUserActive(req.params.id);
      return res.json(user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
