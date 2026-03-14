const userRepository = require('../repositories/userRepository.jsx');
const clientRepository = require('../repositories/clientRepository.jsx');
const bcrypt = require('bcryptjs');
const {
  isPlainObject,
  normalizeDate,
  normalizeOptionalString,
  normalizeRequiredString,
} = require('../utils/validation.jsx');
const { sanitizeUser, sanitizeUserCollection } = require('../utils/userSerializers.jsx');

function buildUserProfileUpdate(data) {
  if (!isPlainObject(data)) {
    throw new Error('Dados de perfil inválidos');
  }

  const updateData = {};

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    updateData.name = normalizeRequiredString(data.name, 'Nome');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'phone')) {
    updateData.phone = normalizeOptionalString(data.phone, 'Telefone');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'avatarUrl')) {
    updateData.avatarUrl = normalizeOptionalString(data.avatarUrl, 'Avatar');
  }

  return updateData;
}

function buildClientUpdate(data) {
  if (!isPlainObject(data)) {
    throw new Error('Dados do cliente inválidos');
  }

  const updateData = {};
  const simpleFields = ['rg', 'profession', 'nationality', 'maritalStatus', 'address', 'city', 'state', 'zipCode', 'notes'];
  const fieldLabels = {
    rg: 'RG',
    profession: 'Profissão',
    nationality: 'Nacionalidade',
    maritalStatus: 'Estado civil',
    address: 'Endereço',
    city: 'Cidade',
    state: 'Estado',
    zipCode: 'CEP',
    notes: 'Observações',
  };

  if (Object.prototype.hasOwnProperty.call(data, 'cpf')) {
    updateData.cpf = normalizeRequiredString(data.cpf, 'CPF');
  }

  if (Object.prototype.hasOwnProperty.call(data, 'birthDate')) {
    updateData.birthDate = normalizeDate(data.birthDate, 'Data de nascimento');
  }

  for (const field of simpleFields) {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updateData[field] = normalizeOptionalString(data[field], fieldLabels[field]);
    }
  }

  return updateData;
}

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    return sanitizeUser(user);
  }

  async updateProfile(userId, data) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const updateData = buildUserProfileUpdate(data);

    if (Object.prototype.hasOwnProperty.call(data, 'email')) {
      const normalizedEmail = normalizeRequiredString(data.email, 'Email').toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await userRepository.findByEmail(normalizedEmail);
        if (existing) throw new Error('Email já está em uso');
        updateData.email = normalizedEmail;
      }
    }

    const updated = await userRepository.update(userId, updateData);
    return sanitizeUser(updated);
  }

  async updateClientData(userId, clientData) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');
    if (user.role !== 'CLIENT') throw new Error('Usuário não é um cliente');

    const normalizedClientData = buildClientUpdate(clientData);

    if (normalizedClientData.cpf && normalizedClientData.cpf !== user.client?.cpf) {
      const existingClient = await clientRepository.findByCpf(normalizedClientData.cpf);
      if (existingClient && existingClient.id !== user.client?.id) {
        throw new Error('CPF já cadastrado');
      }
    }

    if (!user.client) {
      if (!normalizedClientData.cpf) {
        throw new Error('CPF é obrigatório para clientes');
      }

      const created = await clientRepository.create({ userId, ...normalizedClientData });
      return created;
    }

    const updated = await clientRepository.update(user.client.id, normalizedClientData);
    return updated;
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const normalizedCurrentPassword = normalizeRequiredString(currentPassword, 'Senha atual');
    const normalizedNewPassword = normalizeRequiredString(newPassword, 'Nova senha');

    if (normalizedNewPassword.length < 8) {
      throw new Error('A nova senha deve ter pelo menos 8 caracteres');
    }

    if (normalizedCurrentPassword === normalizedNewPassword) {
      throw new Error('A nova senha deve ser diferente da senha atual');
    }

    const validPassword = await bcrypt.compare(normalizedCurrentPassword, user.password);
    if (!validPassword) throw new Error('Senha atual incorreta');

    const hashedPassword = await bcrypt.hash(normalizedNewPassword, 10);
    await userRepository.update(userId, { password: hashedPassword, isFirstLogin: false });
  }

  async listUsers({ role, page, limit }) {
    const allowedRoles = ['ADMIN', 'LAWYER', 'CLIENT'];
    if (role !== undefined && !allowedRoles.includes(role)) {
      throw new Error('Perfil inválido');
    }

    const result = await userRepository.findAll({ role, page, limit });
    return {
      ...result,
      users: sanitizeUserCollection(result.users),
    };
  }

  async toggleUserActive(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');

    const updated = await userRepository.update(userId, { active: !user.active });
    return sanitizeUser(updated);
  }
}

module.exports = new UserService();
