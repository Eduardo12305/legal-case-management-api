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
}

module.exports = new AuthController();
