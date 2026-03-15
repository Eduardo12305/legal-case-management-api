const clientSearchRepository = require('../repositories/clientSearchRepository.jsx');
const userRepository = require('../repositories/userRepository.jsx');
const AppError = require('../utils/appError.jsx');
const { normalizeDigits } = require('../utils/crypto.jsx');

function normalizeActiveFilter(active) {
  if (active === undefined || active === null || active === '') {
    return undefined;
  }

  if (typeof active === 'boolean') {
    return active;
  }

  if (active === 'true') {
    return true;
  }

  if (active === 'false') {
    return false;
  }

  throw new AppError('Parâmetro active inválido', 400);
}

class ClientService {
  async searchClients(actor, { search, active, page, limit }) {
    if (actor.role === 'CLIENT') {
      throw new AppError('Acesso negado', 403);
    }

    const normalizedSearch = search ? normalizeDigits(search) || search.trim() : undefined;
    const normalizedActive = normalizeActiveFilter(active);

    const result = await clientSearchRepository.search({
      search: normalizedSearch,
      active: normalizedActive,
      page,
      limit,
      userId: actor.id,
    });

    return {
      ...result,
      clients: result.clients.map((client) => ({
        id: client.id,
        userId: client.userId,
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpf: client.cpf,
        active: Boolean(client.active),
        processCount: Number(client.processCount || 0),
      })),
    };
  }

  async toggleClientActive(actor, clientUserId) {
    if (actor.role !== 'ADMIN') {
      throw new AppError('Acesso negado', 403);
    }

    const user = await userRepository.findById(clientUserId);
    if (!user || user.role !== 'CLIENT') {
      throw new AppError('Cliente não encontrado', 404);
    }

    return userRepository.update(clientUserId, { active: !user.active });
  }
}

module.exports = new ClientService();
