const clientService = require('../services/clientService.jsx');

class ClientController {
  async search(req, res) {
    const result = await clientService.searchClients(req.user, req.query);
    return res.json(result);
  }

  async toggleActive(req, res) {
    const user = await clientService.toggleClientActive(req.user, req.params.id);
    return res.json(user);
  }
}

module.exports = new ClientController();
