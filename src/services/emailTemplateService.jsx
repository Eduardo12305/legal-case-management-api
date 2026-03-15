const env = require('../config/env.jsx');

function buildVerificationEmail({ name, token, loginHint }) {
  const confirmationUrl = `${env.frontendBaseUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  const safeName = name || 'Usuário';

  return {
    subject: 'Confirme seu email na Advon',
    text: [
      `Olá, ${safeName}.`,
      '',
      'Seu cadastro foi concluído e precisa de confirmação de email.',
      `Confirme seu acesso em: ${confirmationUrl}`,
      `Após a confirmação, seu login poderá ser feito com ${loginHint}.`,
      '',
      'Se você não reconhece este cadastro, ignore esta mensagem.',
    ].join('\n'),
    html: `
      <p>Olá, ${safeName}.</p>
      <p>Seu cadastro foi concluído e precisa de confirmação de email.</p>
      <p><a href="${confirmationUrl}">Confirmar email</a></p>
      <p>Após a confirmação, seu login poderá ser feito com ${loginHint}.</p>
      <p>Se você não reconhece este cadastro, ignore esta mensagem.</p>
    `,
  };
}

function buildInviteEmail({ email, role, token }) {
  const registrationUrl = `${env.frontendBaseUrl.replace(/\/$/, '')}/register?inviteToken=${encodeURIComponent(token)}`;

  return {
    subject: 'Seu acesso à Advon foi pré-autorizado',
    text: [
      `Olá, ${email}.`,
      '',
      `Seu acesso com perfil ${role} foi pré-autorizado.`,
      `Finalize o cadastro em: ${registrationUrl}`,
      '',
      'Por segurança, a plataforma não envia senhas por email.',
      'Depois de concluir e confirmar o email, o acesso será feito com email.',
      'Para clientes, o login também poderá ser feito com CPF.',
    ].join('\n'),
    html: `
      <p>Olá, ${email}.</p>
      <p>Seu acesso com perfil <strong>${role}</strong> foi pré-autorizado.</p>
      <p><a href="${registrationUrl}">Finalizar cadastro</a></p>
      <p>Por segurança, a plataforma não envia senhas por email.</p>
      <p>Depois de concluir e confirmar o email, o acesso será feito com email.</p>
      <p>Para clientes, o login também poderá ser feito com CPF.</p>
    `,
  };
}

module.exports = {
  buildInviteEmail,
  buildVerificationEmail,
};
