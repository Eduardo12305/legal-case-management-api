const authService = require('../services/authService.jsx');

class AuthController {
  async register(req, res) {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  }

  async login(req, res) {
    const result = await authService.login(req.body);
    return res.json(result);
  }

  async getInviteOptions(req, res) {
    const result = authService.getInviteOptions(req.user);
    return res.json(result);
  }

  async createInvite(req, res) {
    const invite = await authService.createInvite(req.user, req.body);
    return res.status(201).json(invite);
  }

  async verifyEmail(req, res) {
    const result = await authService.verifyEmail(req.query.token);
    return res.json(result);
  }
}

module.exports = new AuthController();
