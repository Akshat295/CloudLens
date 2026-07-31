const nodemailer = require("nodemailer");

let transporterPromise = null;

const buildTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  // Dev fallback: an auto-provisioned Ethereal test inbox. Nothing is
  // actually delivered to a real inbox, but every send is viewable via the
  // preview URL nodemailer.getTestMessageUrl(info) returns — good enough to
  // exercise the whole send pipeline without real SMTP credentials.
  const testAccount = await nodemailer.createTestAccount();
  console.warn("SMTP_HOST not set — emails will go to an Ethereal test inbox (dev only), not real recipients.");

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
};

// Cached across calls (and shared across concurrent callers via the same
// pending promise) so we don't provision a new Ethereal account per email.
const getTransporter = () => {
  if (!transporterPromise) {
    transporterPromise = buildTransporter();
  }
  return transporterPromise;
};

module.exports = { getTransporter };
