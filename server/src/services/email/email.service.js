const nodemailer = require("nodemailer");
const { getTransporter } = require("../../config/mailer");
const {
  buildScanCompletedEmail,
  buildHighSeverityEmail,
  buildWeeklyReportEmail,
} = require("./emailTemplates");

const FROM_ADDRESS = process.env.EMAIL_FROM || "CloudLens <notifications@cloudlens.app>";

const sendMail = async ({ to, subject, html }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({ from: FROM_ADDRESS, to, subject, html });

  // Ethereal (the dev fallback in config/mailer.js) never delivers for
  // real — this is how a send can still be inspected during development.
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Email preview ("${subject}" -> ${to}): ${previewUrl}`);
  }

  return info;
};

const sendScanCompletedEmail = async (email, stats) => {
  return await sendMail({
    to: email,
    subject: "CloudLens — Scan Completed",
    html: buildScanCompletedEmail(stats),
  });
};

const sendHighSeverityEmail = async (email, data) => {
  return await sendMail({
    to: email,
    subject: `CloudLens — ${data.highCount} High Severity Finding${data.highCount === 1 ? "" : "s"}`,
    html: buildHighSeverityEmail(data),
  });
};

const sendWeeklyReportEmail = async (email, data) => {
  return await sendMail({
    to: email,
    subject: "CloudLens — Your Weekly Cost Report",
    html: buildWeeklyReportEmail(data),
  });
};

module.exports = {
  sendScanCompletedEmail,
  sendHighSeverityEmail,
  sendWeeklyReportEmail,
};
