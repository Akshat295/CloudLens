const AuditLog = require("../../models/AuditLog");

const createAuditLog = async ({ userId, action, description }) => {
  return await AuditLog.create({ userId, action, description });
};

const getAuditLogsByUserId = async (userId) => {
  return await AuditLog.find({ userId }).sort({ createdAt: -1 });
};

module.exports = {
  createAuditLog,
  getAuditLogsByUserId,
};
