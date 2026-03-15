const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository.jsx');
const clientRepository = require('../repositories/clientRepository.jsx');
const authRepository = require('../repositories/authRepository.jsx');
const prisma = require('../database/prisma.jsx');
const env = require('../config/env.jsx');
const emailService = require('./emailService.jsx');
const { buildInviteEmail, buildVerificationEmail } = require('./emailTemplateService.jsx');
const {
  ensureEnumValue,
  isPlainObject,
  normalizeDate,
  normalizeOptionalString,
  normalizeRequiredString,
} = require('../utils/validation.jsx');
const { sanitizeUser } = require('../utils/userSerializers.jsx');
const { generateToken, normalizeDigits } = require('../utils/crypto.jsx');

const ALLOWED_ROLES = ['ADMIN', 'LAWYER', 'STAFF', 'CLIENT'];
const INVITED_REGISTRATION_ROLES = ['LAWYER', 'STAFF', 'CLIENT'];

function normalizeClientData(clientData) {
  if (clientData === undefined) return undefined;
  if (!isPlainObject(clientData)) {
    throw new Error('Dados do cliente inválidos');
  }

  return {
    inviteToken: normalizeRequiredString(clientData.inviteToken, 'Invite token'),
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
  getInviteOptions(actor) {
    if (actor.role !== 'ADMIN') {
      throw new Error('Acesso negado');
    }

    return {
      creatableRoles: ['LAWYER', 'STAFF', 'CLIENT'],
      notes: {
        adminCreation: 'Contas ADMIN devem ser provisionadas por seed ou infraestrutura.',
        loginIdentifiers: 'Clientes podem autenticar com email ou CPF. Usuários internos usam email.',
      },
    };
  }

  async register({ email, password, name, phone, role, inviteToken, clientData }) {
    const normalizedRole = ensureEnumValue(role, ALLOWED_ROLES, 'Perfil') || 'CLIENT';
    if (!INVITED_REGISTRATION_ROLES.includes(normalizedRole)) {
      throw new Error('Perfil inválido para cadastro');
    }

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

    const normalizedInviteToken = normalizeOptionalString(inviteToken, 'Invite token')
      || normalizedClientData?.inviteToken;
    const invite = await authRepository.findInviteByToken(normalizedInviteToken || '');
    if (!invite || invite.email !== normalizedEmail || invite.usedAt || invite.expiresAt < new Date() || invite.role !== normalizedRole) {
      throw new Error('Pré-registro inválido');
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
          emailVerified: !env.emailVerificationRequired,
          emailVerifiedAt: env.emailVerificationRequired ? null : new Date(),
        },
      });

      if (normalizedRole === 'CLIENT') {
        const { inviteToken, ...clientPayload } = normalizedClientData;
        await tx.client.create({
          data: {
            userId: user.id,
            ...clientPayload,
          },
        });
      }

      return await tx.user.findUnique({
        where: { id: user.id },
        include: { client: true, userPermissions: true },
      });
    });

    await authRepository.markInviteAsUsed(invite.id);
    let verificationToken;

    if (env.emailVerificationRequired) {
      verificationToken = generateToken(24);
      await authRepository.createEmailVerificationToken({
        userId: result.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      });

      await emailService.send({
        to: result.email,
        ...buildVerificationEmail({
          name: result.name,
          token: verificationToken,
          loginHint: result.role === 'CLIENT' ? 'email ou CPF' : 'email',
        }),
      });
    }

    return {
      user: sanitizeUser(result),
      message: env.emailVerificationRequired
        ? 'Cadastro concluído. Confirme o email antes de acessar a plataforma.'
        : 'Cadastro concluído. Acesso liberado sem confirmação de email.',
      verificationToken: env.nodeEnv === 'development' && env.emailVerificationRequired ? verificationToken : undefined,
    };
  }

  async login({ identifier, email, password }) {
    const rawIdentifier = identifier ?? email;
    const normalizedIdentifier = normalizeRequiredString(rawIdentifier, 'Login');
    const normalizedPassword = normalizeRequiredString(password, 'Senha');
    const user = await this.findUserForLogin(normalizedIdentifier);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.active) {
      throw new Error('Conta desativada');
    }

    if (env.emailVerificationRequired && !user.emailVerified) {
      throw new Error('Email não confirmado');
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

  async createInvite(actor, { email, role, expiresInHours = 72 }) {
    if (actor.role !== 'ADMIN') {
      throw new Error('Acesso negado');
    }

    const normalizedEmail = normalizeRequiredString(email, 'Email').toLowerCase();
    const normalizedRole = ensureEnumValue(role, ['LAWYER', 'STAFF', 'CLIENT'], 'Perfil');

    const invite = await authRepository.createInvite({
      email: normalizedEmail,
      role: normalizedRole,
      token: generateToken(24),
      invitedById: actor.id,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    });

    await emailService.send({
      to: normalizedEmail,
      ...buildInviteEmail({
        email: normalizedEmail,
        role: normalizedRole,
        token: invite.token,
      }),
    });

    return invite;
  }

  async verifyEmail(token) {
    const verification = await authRepository.findEmailVerificationToken(token);
    if (!verification || verification.usedAt || verification.expiresAt < new Date()) {
      throw new Error('Token de confirmação inválido');
    }

    const user = await userRepository.update(verification.userId, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await authRepository.markEmailVerificationTokenAsUsed(verification.id);

    return {
      message: 'Email confirmado com sucesso',
      user: sanitizeUser(user),
    };
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

  async findUserForLogin(identifier) {
    if (identifier.includes('@')) {
      return userRepository.findByEmail(identifier.toLowerCase());
    }

    const normalizedCpf = normalizeDigits(identifier);
    if (!normalizedCpf) {
      return null;
    }

    const client = await clientRepository.findByCpf(normalizedCpf);
    if (!client?.userId) {
      return null;
    }

    return userRepository.findById(client.userId);
  }
}

module.exports = new AuthService();
