const prisma = require('../database/prisma.jsx');

class AuthRepository {
  async findInviteByToken(token) {
    return prisma.registrationInvite.findUnique({
      where: { token },
    });
  }

  async createInvite(data) {
    return prisma.registrationInvite.create({ data });
  }

  async markInviteAsUsed(id) {
    return prisma.registrationInvite.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async createEmailVerificationToken(data) {
    return prisma.emailVerificationToken.create({ data });
  }

  async findEmailVerificationToken(token) {
    return prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: { include: { client: true, userPermissions: true } } },
    });
  }

  async markEmailVerificationTokenAsUsed(id) {
    return prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}

module.exports = new AuthRepository();
