const env = require('../config/env.jsx');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  isEnabled() {
    return Boolean(env.smtpHost && env.smtpPort && env.smtpFromEmail);
  }

  getTransporter() {
    if (!this.isEnabled()) {
      return null;
    }

    if (!this.transporter) {
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
      } catch (error) {
        console.warn('[email:dependency-missing] nodemailer não instalado; fallback para log.');
        return null;
      }

      this.transporter = nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: env.smtpUser
          ? {
              user: env.smtpUser,
              pass: env.smtpPass,
            }
          : undefined,
      });
    }

    return this.transporter;
  }

  async send({ to, subject, text, html }) {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log('[email:disabled]', { to, subject, text });
      return { delivered: false, mode: 'log' };
    }

    await transporter.sendMail({
      from: env.smtpFromName
        ? `"${env.smtpFromName}" <${env.smtpFromEmail}>`
        : env.smtpFromEmail,
      to,
      subject,
      text,
      html,
    });

    return { delivered: true, mode: 'smtp' };
  }
}

module.exports = new EmailService();
