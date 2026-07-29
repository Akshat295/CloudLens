const { parsePolicyDocument, toArray } = require("../utils/iamPolicy.util");

// A role's trust policy lists which principals can assume it — this pulls
// out just the AWS service principals (e.g. "ec2.amazonaws.com") from any
// Allow statement, which is what "Trusted Services" means for a role.
const extractTrustedServices = (assumeRolePolicyDocument) => {
  const policy = parsePolicyDocument(assumeRolePolicyDocument);
  if (!policy) return [];

  const services = new Set();
  for (const statement of toArray(policy.Statement)) {
    if (statement.Effect !== "Allow") continue;
    for (const service of toArray(statement.Principal?.Service)) {
      services.add(service);
    }
  }

  return Array.from(services);
};

const mapIAMUsers = (response) =>
  (response.Users || []).map((user) => ({
    userName: user.UserName,
    arn: user.Arn,
    createDate: user.CreateDate,
    passwordLastUsed: user.PasswordLastUsed || null,
  }));

const mapIAMRoles = (response) =>
  (response.Roles || []).map((role) => ({
    roleName: role.RoleName,
    arn: role.Arn,
    // Path is what identifies AWS-managed service-linked roles
    // (/aws-service-role/...) — see iam.analyzer.js's isServiceLinkedRole.
    path: role.Path,
    createDate: role.CreateDate,
    lastUsedDate: role.RoleLastUsed?.LastUsedDate || null,
    trustedServices: extractTrustedServices(role.AssumeRolePolicyDocument),
  }));

module.exports = {
  mapIAMUsers,
  mapIAMRoles,
};
