const { hasWildcardAction, hasFullWildcardPermissions } = require("../../utils/iamPolicy.util");

const OLD_ACCESS_KEY_DAYS = 90;
const UNUSED_KEY_GRACE_DAYS = 14;
const ROLE_INACTIVITY_DAYS = 90;
const OLD_RESOURCE_AGE_DAYS = 365;
const LONG_NAME_THRESHOLD = 40;
const ADMIN_POLICY_NAME = "AdministratorAccess";
const SERVICE_LINKED_ROLE_PATH_PREFIX = "/aws-service-role/";
const SERVICE_LINKED_ROLE_NAME_PREFIX = "AWSServiceRoleFor";
const DAY_MS = 24 * 60 * 60 * 1000;

const calculateDaysSince = (date) => {
  if (!date) return null;

  const diffMs = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diffMs / DAY_MS));
};

// AWS creates and fully manages service-linked roles for its own features
// (Trusted Advisor, Support, Resource Explorer, etc.) — the customer can't
// edit or delete them, so they shouldn't be scanned or recommended on at
// all. Detected the same way AWS's own console does: either the role's
// Path is under /aws-service-role/, or its name follows the
// AWSServiceRoleFor* convention (belt-and-braces, since a handful of
// legacy service-linked roles don't use the /aws-service-role/ path).
const isServiceLinkedRole = (role) =>
  Boolean(role.path?.startsWith(SERVICE_LINKED_ROLE_PATH_PREFIX)) ||
  Boolean(role.roleName?.startsWith(SERVICE_LINKED_ROLE_NAME_PREFIX));

const hasAdminPolicyAttached = (attachedPolicies = []) =>
  attachedPolicies.some((policy) => policy.policyName === ADMIN_POLICY_NAME);

// `documents` is the combined set of policy content this principal
// actually grants — its own inline policies plus any customer-managed
// (not AWS-managed) attached policies. AWS-managed policy content is
// vetted by AWS itself and is intentionally excluded by the caller before
// this ever runs (see iam.service.js's getCustomerManagedPolicyDocuments).
const hasFullWildcard = (documents = []) => documents.some((policy) => hasFullWildcardPermissions(policy.document));

const hasExcessivePermissions = (documents = []) =>
  documents.some((policy) => hasWildcardAction(policy.document) && !hasFullWildcardPermissions(policy.document));

const analyzeAccessKeys = (accessKeys = []) => {
  const keys = accessKeys.map((key) => {
    const ageDays = calculateDaysSince(key.createDate);
    const isActive = key.status === "Active";

    return {
      ...key,
      ageDays,
      isOld: isActive && ageDays !== null && ageDays > OLD_ACCESS_KEY_DAYS,
      isUnused: isActive && !key.lastUsedDate && ageDays !== null && ageDays > UNUSED_KEY_GRACE_DAYS,
    };
  });

  const activeKeys = keys.filter((key) => key.status === "Active");

  return {
    keys,
    activeKeyCount: activeKeys.length,
    hasOldActiveKey: keys.some((key) => key.isOld),
    hasUnusedActiveKey: keys.some((key) => key.isUnused),
  };
};

const analyzeUserSecurity = ({
  hasConsoleAccess,
  mfaEnabled,
  attachedPolicies,
  inlinePolicies,
  customerManagedPolicies,
  accessKeys,
  passwordLastUsed,
  createDate,
  tags,
  userName,
}) => {
  const accessKeyAnalysis = analyzeAccessKeys(accessKeys);
  const userAgeDays = calculateDaysSince(createDate);
  const inspectablePolicies = [...inlinePolicies, ...customerManagedPolicies];

  return {
    hasConsoleAccess,
    mfaEnabled,
    // A "console user without MFA" specifically means a user who CAN log
    // into the console (a login profile exists) and has no MFA device —
    // an API-only user with no console access isn't this risk.
    consoleUserWithoutMFA: hasConsoleAccess && !mfaEnabled,
    hasAdminAccess: hasAdminPolicyAttached(attachedPolicies),
    hasFullWildcardPermissions: hasFullWildcard(inspectablePolicies),
    hasExcessivePermissions: hasExcessivePermissions(inspectablePolicies),
    accessKeyAnalysis,
    neverLoggedIn: hasConsoleAccess && !passwordLastUsed,
    userAgeDays,
    isOldUser: userAgeDays !== null && userAgeDays > OLD_RESOURCE_AGE_DAYS,
    hasNoTags: !tags || tags.length === 0,
    hasLongName: Boolean(userName) && userName.length > LONG_NAME_THRESHOLD,
  };
};

const analyzeRoleSecurity = ({
  attachedPolicies,
  inlinePolicies,
  customerManagedPolicies,
  lastUsedDate,
  createDate,
  tags,
  roleName,
}) => {
  const roleAgeDays = calculateDaysSince(createDate);
  const inspectablePolicies = [...inlinePolicies, ...customerManagedPolicies];
  const lastUsedDays = calculateDaysSince(lastUsedDate);

  return {
    hasAdminAccess: hasAdminPolicyAttached(attachedPolicies),
    hasFullWildcardPermissions: hasFullWildcard(inspectablePolicies),
    hasExcessivePermissions: hasExcessivePermissions(inspectablePolicies),
    neverUsed: !lastUsedDate,
    notUsedRecently: Boolean(lastUsedDate) && lastUsedDays !== null && lastUsedDays > ROLE_INACTIVITY_DAYS,
    roleAgeDays,
    isOldRole: roleAgeDays !== null && roleAgeDays > OLD_RESOURCE_AGE_DAYS,
    hasNoTags: !tags || tags.length === 0,
    hasLongName: Boolean(roleName) && roleName.length > LONG_NAME_THRESHOLD,
  };
};

module.exports = {
  calculateDaysSince,
  isServiceLinkedRole,
  analyzeAccessKeys,
  analyzeUserSecurity,
  analyzeRoleSecurity,
};
