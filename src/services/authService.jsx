const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository.jsx');
const clientRepository = require('../repositories/clientRepository.jsx');
const prisma = require('../database/prisma.jsx');
const env = require('../config/env.jsx');
const {
  ensureEnumValue,
  isPlainObject,
  normalizeDate,
  normalizeOptionalString,
  normalizeRequiredString,
} = require('../utils/validation.jsx');
const { sanitizeUser } = require('../utils/userSerializers.jsx');

const ALLOWED_ROLES = ['ADMIN', 'LAWYER', 'CLIENT'];

function normalizeClientData(clientData) {
  if (clientData === undefined) return undefined;
  if (!isPlainObject(clientData)) {
    throw new Error('Dados do cliente inválidos');
  }

  return {
    cpf: normalizeRequiredString(clientData.cpf, 'CPF'),
    rg: normalizeOptionalString(clientData.rg, 'RG'),
    birthDate: normalizeDate(clientData.birthDate, 'Data de nascimento'),
    profession: normalizeOptionalString(clientData.profession, 'Profissão'),
    nationality: normalizeOptionalString(clientData.nationality, 'Nacionalidade'),
    maritalStatus: normalizeOptionalString(clientData.maritalStatus, 'Estado civil'),
    address: normalizeOptionalString(clientData.address, 'Endereço'),
    city: normalizeOptionalString(clientData.city, 'Cidade'),
    state: normalizeOptionalString(clientData.state, 'Estado'),
    zipCode: normalizeOptionalString(clientData.zipCode, 'CEP'),
    notes: normalizeOptionalString(clientData.notes, 'Observações'),
  };
}

class AuthService {
  async register({ email, password, name, phone, role, clientData }) {
    const normalizedRole = ensureEnumValue(role, ALLOWED_ROLES, 'Perfil') || 'CLIENT';
    const normalizedEmail = normalizeRequiredString(email, 'Email').toLowerCase();
    const normalizedPassword = normalizeRequiredString(password, 'Senha');
    const normalizedName = normalizeRequiredString(name, 'Nome');
    const normalizedPhone = normalizeOptionalString(phone, 'Telefone');
    const normalizedClientData = normalizedRole === 'CLIENT'
      ? normalizeClientData(clientData)
      : undefined;

    if (normalizedRole === 'CLIENT' && !normalizedClientData) {
      throw new Error('CPF é obrigatório para clientes');
    }

    if (normalizedPassword.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres');
    }

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    if (normalizedRole === 'CLIENT') {
      const existingCpf = await clientRepository.findByCpf(normalizedClientData.cpf);
      if (existingCpf) {
        throw new Error('CPF já cadastrado');
      }
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: normalizedName,
          phone: normalizedPhone,
          role: normalizedRole,
        },
      });

      if (normalizedRole === 'CLIENT') {
        await tx.client.create({
          data: {
            userId: user.id,
            ...normalizedClientData,
          },
        });
      }

      return await tx.user.findUnique({
        where: { id: user.id },
        include: { client: true },
      });
    });

    const token = this.generateToken(result);

    return { user: sanitizeUser(result), token };
  }

  async login({ email, password }) {
    const normalizedEmail = normalizeRequiredString(email, 'Email').toLowerCase();
    const normalizedPassword = normalizeRequiredString(password, 'Senha');

    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.active) {
      throw new Error('Conta desativada');
    }

    const validPassword = await bcrypt.compare(normalizedPassword, user.password);
    if (!validPassword) {
      throw new Error('Credenciais inválidas');
    }

    if (user.isFirstLogin) {
        return {
            userId: user.id,
            requiresPasswordChange: true,
        };
    }

    const token = this.generateToken(user);

    return { user: sanitizeUser(user), token };
  }

  async changePassword(userId, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const normalizedPassword = normalizeRequiredString(newPassword, 'Nova senha');
    if (normalizedPassword.length < 8) {
      throw new Error('A nova senha deve ter pelo menos 8 caracteres');
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    await userRepository.update(userId, { password: hashedPassword, isFirstLogin: false });

    return { message: 'Senha alterada com sucesso' };
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
  }
}

module.exports = new AuthService();
