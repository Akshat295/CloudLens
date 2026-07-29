const {
  getUsers,
  getRoles,
  getRootAccountSecuritySummary,
  hasUserMFA,
  hasConsoleAccess,
  getAttachedUserPolicies,
  getInlineUserPolicies,
  getCustomerManagedPolicyDocuments,
  getUserGroups,
  getUserAccessKeys,
  getUserTags,
  getAttachedRolePolicies,
  getInlineRolePolicies,
  getRoleTags,
} = require("../aws/iam.service");

const { saveResources } = require("../database/resource.repository");
const { saveRecommendation } = require("../database/recommendation.repository");

const { isServiceLinkedRole, analyzeUserSecurity, analyzeRoleSecurity } = require("../analyzer/iam.analyzer");
const {
  getConsoleMFARecommendation,
  getRootAccountMFARecommendation,
  getRootAccessKeysRecommendation,
  getAdminAccessRecommendation,
  getWildcardPermissionRecommendation,
  getAccessKeyAgeRecommendation,
  getLoginActivityRecommendation,
  getRoleUsageRecommendation,
  getTagsRecommendation,
  getLongNameRecommendation,
  getAgeRecommendation,
  mergeIAMUserRecommendations,
  mergeIAMRoleRecommendations,
  mergeRootAccountRecommendations,
} = require("../recommender/iam.recommender");

// Every IAM recommendation is a security finding, never a cost one — see
// the Recommendation model's `category` field (defaults to COST for
// EC2/S3/RDS, explicit here).
const IAM_CATEGORY = "SECURITY";

// Synthetic resourceId for the account-wide root findings — there's no
// natural IAM user/role for them, but they still fit the same
// Resource/Recommendation schema as everything else (see processRootAccount).
const ROOT_ACCOUNT_RESOURCE_ID = "root-account";

const logUserScanResult = (user, { analysis, mergedRecommendation }) => {
  console.log("=================================");
  console.log("IAM User:", user.userName);
  console.log("Analysis:", analysis);
  console.log("Recommendation:", mergedRecommendation);
};

const logRoleScanResult = (role, { analysis, mergedRecommendation }) => {
  console.log("=================================");
  console.log("IAM Role:", role.roleName);
  console.log("Analysis:", analysis);
  console.log("Recommendation:", mergedRecommendation);
};

// Analyzes a single IAM user (console access, MFA, policies, groups,
// access keys, tags), persists ONE merged recommendation for it (mirroring
// the established one-resource-one-recommendation shape from EC2/S3/RDS),
// and returns the Resource record to be persisted for it.
const processUser = async (scanId, user) => {
  const [mfaEnabled, consoleAccess, attachedPolicies, inlinePolicies, groups, accessKeys, tags] = await Promise.all([
    hasUserMFA(user.userName),
    hasConsoleAccess(user.userName),
    getAttachedUserPolicies(user.userName),
    getInlineUserPolicies(user.userName),
    getUserGroups(user.userName),
    getUserAccessKeys(user.userName),
    getUserTags(user.userName),
  ]);

  const customerManagedPolicies = await getCustomerManagedPolicyDocuments(attachedPolicies);

  const analysis = analyzeUserSecurity({
    hasConsoleAccess: consoleAccess,
    mfaEnabled,
    attachedPolicies,
    inlinePolicies,
    customerManagedPolicies,
    accessKeys,
    passwordLastUsed: user.passwordLastUsed,
    createDate: user.createDate,
    tags,
    userName: user.userName,
  });

  const mfaRecommendation = getConsoleMFARecommendation(analysis.consoleUserWithoutMFA);
  const adminAccessRecommendation = getAdminAccessRecommendation(analysis.hasAdminAccess);
  const wildcardRecommendation = getWildcardPermissionRecommendation(analysis);
  const accessKeyAgeRecommendation = getAccessKeyAgeRecommendation(analysis.accessKeyAnalysis);
  const loginActivityRecommendation = getLoginActivityRecommendation(analysis.neverLoggedIn);
  const tagsRecommendation = getTagsRecommendation(analysis.hasNoTags);
  const ageRecommendation = getAgeRecommendation({ isOld: analysis.isOldUser, ageDays: analysis.userAgeDays }, "User");
  const longNameRecommendation = getLongNameRecommendation(analysis.hasLongName, "User");

  const mergedRecommendation = mergeIAMUserRecommendations({
    mfaRecommendation,
    adminAccessRecommendation,
    wildcardRecommendation,
    accessKeyAgeRecommendation,
    loginActivityRecommendation,
    tagsRecommendation,
    ageRecommendation,
    longNameRecommendation,
  });

  await saveRecommendation({
    scanId,
    resourceId: user.userName,
    category: IAM_CATEGORY,
    severity: mergedRecommendation.severity,
    action: mergedRecommendation.action,
    confidence: mergedRecommendation.confidence,
    recommendation: mergedRecommendation.recommendation,
    reason: mergedRecommendation.reason,
    monthlyCost: 0,
    estimatedSavings: 0,
  });

  logUserScanResult(user, { analysis, mergedRecommendation });

  return {
    resource: {
      resourceId: user.userName,
      name: user.userName,
      metadata: {
        arn: user.arn,
        createDate: user.createDate,
        passwordLastUsed: user.passwordLastUsed,
        hasConsoleAccess: consoleAccess,
        mfaEnabled,
        attachedPolicies,
        inlinePolicies: inlinePolicies.map((policy) => policy.policyName),
        customerManagedPolicies: customerManagedPolicies.map((policy) => policy.policyName),
        groups,
        accessKeys: analysis.accessKeyAnalysis.keys.map((key) => ({
          accessKeyId: key.accessKeyId,
          status: key.status,
          createDate: key.createDate,
          lastUsedDate: key.lastUsedDate,
          ageDays: key.ageDays,
          isOld: key.isOld,
          isUnused: key.isUnused,
        })),
        tags,
        userAgeDays: analysis.userAgeDays,
        hasAdminAccess: analysis.hasAdminAccess,
        hasWildcardPermissions: analysis.hasFullWildcardPermissions || analysis.hasExcessivePermissions,
        riskLevel: mergedRecommendation.severity,
      },
    },
  };
};

// Analyzes a single customer-managed IAM role (trust policy, attached/
// inline policies, usage, tags), persists ONE merged recommendation for
// it, and returns the Resource record to be persisted for it. AWS-managed
// service-linked roles never reach this function — see scanIAM's filter.
const processRole = async (scanId, role) => {
  const [attachedPolicies, inlinePolicies, tags] = await Promise.all([
    getAttachedRolePolicies(role.roleName),
    getInlineRolePolicies(role.roleName),
    getRoleTags(role.roleName),
  ]);

  const customerManagedPolicies = await getCustomerManagedPolicyDocuments(attachedPolicies);

  const analysis = analyzeRoleSecurity({
    attachedPolicies,
    inlinePolicies,
    customerManagedPolicies,
    lastUsedDate: role.lastUsedDate,
    createDate: role.createDate,
    tags,
    roleName: role.roleName,
  });

  const adminAccessRecommendation = getAdminAccessRecommendation(analysis.hasAdminAccess);
  const wildcardRecommendation = getWildcardPermissionRecommendation(analysis);
  const roleUsageRecommendation = getRoleUsageRecommendation({
    neverUsed: analysis.neverUsed,
    notUsedRecently: analysis.notUsedRecently,
  });
  const tagsRecommendation = getTagsRecommendation(analysis.hasNoTags);
  const ageRecommendation = getAgeRecommendation({ isOld: analysis.isOldRole, ageDays: analysis.roleAgeDays }, "Role");
  const longNameRecommendation = getLongNameRecommendation(analysis.hasLongName, "Role");

  const mergedRecommendation = mergeIAMRoleRecommendations({
    adminAccessRecommendation,
    wildcardRecommendation,
    roleUsageRecommendation,
    tagsRecommendation,
    ageRecommendation,
    longNameRecommendation,
  });

  await saveRecommendation({
    scanId,
    resourceId: role.roleName,
    category: IAM_CATEGORY,
    severity: mergedRecommendation.severity,
    action: mergedRecommendation.action,
    confidence: mergedRecommendation.confidence,
    recommendation: mergedRecommendation.recommendation,
    reason: mergedRecommendation.reason,
    monthlyCost: 0,
    estimatedSavings: 0,
  });

  logRoleScanResult(role, { analysis, mergedRecommendation });

  return {
    resource: {
      resourceId: role.roleName,
      name: role.roleName,
      metadata: {
        arn: role.arn,
        createDate: role.createDate,
        lastUsedDate: role.lastUsedDate,
        trustedServices: role.trustedServices,
        attachedPolicies,
        inlinePolicies: inlinePolicies.map((policy) => policy.policyName),
        customerManagedPolicies: customerManagedPolicies.map((policy) => policy.policyName),
        tags,
        roleAgeDays: analysis.roleAgeDays,
        hasAdminAccess: analysis.hasAdminAccess,
        hasWildcardPermissions: analysis.hasFullWildcardPermissions || analysis.hasExcessivePermissions,
        neverUsed: analysis.neverUsed,
        notUsedRecently: analysis.notUsedRecently,
        riskLevel: mergedRecommendation.severity,
      },
    },
  };
};

const processRootAccount = async (scanId) => {
  const { mfaEnabled, hasAccessKeys } = await getRootAccountSecuritySummary();

  const mfaRecommendation = getRootAccountMFARecommendation(mfaEnabled);
  const accessKeysRecommendation = getRootAccessKeysRecommendation(hasAccessKeys);
  const mergedRecommendation = mergeRootAccountRecommendations({ mfaRecommendation, accessKeysRecommendation });

  await saveRecommendation({
    scanId,
    resourceId: ROOT_ACCOUNT_RESOURCE_ID,
    category: IAM_CATEGORY,
    severity: mergedRecommendation.severity,
    action: mergedRecommendation.action,
    confidence: mergedRecommendation.confidence,
    recommendation: mergedRecommendation.recommendation,
    reason: mergedRecommendation.reason,
    monthlyCost: 0,
    estimatedSavings: 0,
  });

  return {
    resource: {
      resourceId: ROOT_ACCOUNT_RESOURCE_ID,
      name: "Root Account",
      metadata: {
        mfaEnabled,
        hasAccessKeys,
        riskLevel: mergedRecommendation.severity,
      },
    },
  };
};

const scanIAM = async (scanId) => {
  const [users, roles] = await Promise.all([getUsers(), getRoles()]);

  // AWS-managed service-linked roles (AWSServiceRoleForTrustedAdvisor,
  // AWSServiceRoleForSupport, etc.) are created and fully managed by AWS —
  // they're never analyzed, never recommended on, and never saved as
  // Resources, so they never appear in the dashboard.
  const customerRoles = roles.filter((role) => !isServiceLinkedRole(role));

  const rootAccountResult = await processRootAccount(scanId);

  const userResources = [];
  for (const user of users) {
    const { resource } = await processUser(scanId, user);
    userResources.push(resource);
  }

  const roleResources = [];
  for (const role of customerRoles) {
    const { resource } = await processRole(scanId, role);
    roleResources.push(resource);
  }

  if (userResources.length) await saveResources(scanId, "IAM_USER", userResources);
  if (roleResources.length) await saveResources(scanId, "IAM_ROLE", roleResources);
  await saveResources(scanId, "IAM_ROOT_ACCOUNT", [rootAccountResult.resource]);

  return {
    totalResources: userResources.length + roleResources.length + 1,
    estimatedSavings: 0,
    resources: [...userResources, ...roleResources, rootAccountResult.resource],
  };
};

module.exports = {
  scanIAM,
};
