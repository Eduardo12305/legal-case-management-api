const userService = require('../services/userService.jsx');

class UserController {
  async getProfile(req, res) {
    const user = await userService.getProfile(req.user.id);
    return res.json(user);
  }

  async updateProfile(req, res) {
    const user = await userService.updateProfile(req.user.id, req.body);
    return res.json(user);
  }

  async updateClientData(req, res) {
    const client = await userService.updateClientData(req.user.id, req.body);
    return res.json(client);
  }

  async changePassword(req, res) {
    await userService.changePassword(req.user.id, req.body);
    return res.json({ message: 'Senha alterada com sucesso' });
  }

  async listUsers(req, res) {
    const result = await userService.listUsersForActor(req.user, req.query);
    return res.json(result);
  }

  async toggleUserActive(req, res) {
    const user = await userService.toggleUserActive(req.user, req.params.id);
    return res.json(user);
  }

  async setStaffPermissions(req, res) {
    const user = await userService.setStaffPermissions(req.params.id, req.body.permissions, req.user);
    return res.json(user);
  }
}

module.exports = new UserController();
