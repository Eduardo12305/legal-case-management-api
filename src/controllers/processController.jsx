const processService = require('../services/processService.jsx');

class ProcessController {
  async create(req, res) {
    const process = await processService.create(req.user, req.body);
    return res.status(201).json(process);
  }

  async getById(req, res) {
    const process = await processService.getById(req.params.id, req.user);
    return res.json(process);
  }

  async getLogs(req, res) {
    const result = await processService.getLogs(req.user, req.params.id, req.query);
    return res.json(result);
  }

  async getMyProcesses(req, res) {
    const result = await processService.getMyProcesses(req.user.id, req.query);
    return res.json(result);
  }

  async getByClientId(req, res) {
    const result = await processService.getByClientId(req.user, req.params.clientId, req.query);
    return res.json(result);
  }

  async listAll(req, res) {
    const result = await processService.listAll(req.user, req.query);
    return res.json(result);
  }

  async update(req, res) {
    const process = await processService.update(req.user, req.params.id, req.body);
    return res.json(process);
  }

  async updateStatus(req, res) {
    const process = await processService.updateStatus(req.user, req.params.id, req.body.status);
    return res.json(process);
  }

  async delete(req, res) {
    await processService.delete(req.user, req.params.id);
    return res.json({ message: 'Processo removido com sucesso' });
  }

  async addDocument(req, res) {
    const document = await processService.addDocument(req.user, req.params.id, req.body);
    return res.status(201).json(document);
  }

  async addUpdate(req, res) {
    const update = await processService.addUpdate(req.user, req.params.id, req.body);
    return res.status(201).json(update);
  }
}

module.exports = new ProcessController();
