const processService = require('../services/processService');
const { parsePaginationParams } = require('../utils/validation');

class ProcessController {
  async create(req, res) {
    try {
      const { clientId, lawyerId, processNumber, title, description, court, instance, subject, value } = req.body;

      if (!clientId || !processNumber || !title) {
        return res.status(400).json({ error: 'ClientId, número do processo e título são obrigatórios' });
      }

      const process = await processService.create({
        clientId, lawyerId, processNumber, title, description, court, instance, subject, value,
      });
      return res.status(201).json(process);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const process = await processService.getById(req.params.id, req.user);
      return res.json(process);
    } catch (error) {
      const statusCode = error.message === 'Acesso negado' ? 403 : 404;
      return res.status(statusCode).json({ error: error.message });
    }
  }

  async getMyProcesses(req, res) {
    try {
      const { page, limit } = req.query;
      const pagination = parsePaginationParams({ page, limit });
      const result = await processService.getMyProcesses(req.user.id, pagination);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getByClientId(req, res) {
    try {
      const { page, limit } = req.query;
      const pagination = parsePaginationParams({ page, limit });
      const result = await processService.getByClientId(req.params.clientId, pagination);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listAll(req, res) {
    try {
      const { status, page, limit } = req.query;
      const pagination = parsePaginationParams({ page, limit });
      const result = await processService.listAll({
        status,
        ...pagination,
      });
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const process = await processService.update(req.params.id, req.body);
      return res.json(process);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
      }
      const process = await processService.updateStatus(req.params.id, status);
      return res.json(process);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      await processService.delete(req.params.id);
      return res.json({ message: 'Processo removido com sucesso' });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async addDocument(req, res) {
    try {
      const { name, fileUrl, type } = req.body;
      if (!name || !fileUrl) {
        return res.status(400).json({ error: 'Nome e URL do arquivo são obrigatórios' });
      }
      const document = await processService.addDocument(req.params.id, { name, fileUrl, type });
      return res.status(201).json(document);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async addUpdate(req, res) {
    try {
      const { title, description } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
      }
      const update = await processService.addUpdate(req.params.id, { title, description });
      return res.status(201).json(update);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProcessController();
