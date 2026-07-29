const ROLE_INACTIVITY_DAYS = 90;

// Every check below returns { severity, action, confidence, recommendation,
// reason, flagged } — `flagged` (rather than `action !== "NONE"`) is what
// the merge functions use to decide whether a check found something worth
// surfacing, since several LOW/informational findings intentionally still
// use action "NONE" (no dedicated remediation action exists for them in
// the fixed action vocabulary below).

// --- HIGH: console user without MFA, AdministratorAccess, wildcard *:*,
// root account usage -------------------------------------------------------
const getConsoleMFARecommendation = (consoleUserWithoutMFA) => {
  if (consoleUserWithoutMFA) {
    return {
      severity: "HIGH",
      action: "ENABLE_MFA",
      confidence: 95,
      recommendation: "Console login enabled but MFA is disabled. Enable MFA for this IAM user.",
      reason: "This user has console access and no MFA device registered.",
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 90,
    recommendation: "MFA is configured appropriately for this user's console access.",
    reason: "No console-access-without-MFA risk detected.",
    flagged: false,
  };
};

const getRootAccountMFARecommendation = (rootMFAEnabled) => {
  if (!rootMFAEnabled) {
    return {
      severity: "HIGH",
      action: "ENABLE_MFA",
      confidence: 99,
      recommendation: "Enable MFA on the root account immediately.",
      reason: "The root account does not have MFA enabled.",
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 99,
    recommendation: "Root account MFA is enabled.",
    reason: "The root account has MFA enabled.",
    flagged: false,
  };
};

// Root account "usage" is approximated via whether it has access keys
// present — detecting actual recent root login activity requires
// generating a full IAM credential report (a separate async generate/poll
// flow); root having access keys at all is itself a well-established
// HIGH-severity anti-pattern (the root user should never use access keys).
const getRootAccessKeysRecommendation = (rootHasAccessKeys) => {
  if (rootHasAccessKeys) {
    return {
      severity: "HIGH",
      action: "DELETE_UNUSED_KEY",
      confidence: 90,
      recommendation: "The root account has active access keys — delete them; the root user should never use access keys.",
      reason: "The root account has at least one access key present.",
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "The root account has no access keys.",
    reason: "No access keys are present on the root account.",
    flagged: false,
  };
};

const getAdminAccessRecommendation = (hasAdminAccess) => {
  if (hasAdminAccess) {
    return {
      severity: "HIGH",
      action: "REMOVE_ADMIN_ACCESS",
      confidence: 90,
      recommendation: "AdministratorAccess is attached — remove it and attach a least-privilege policy instead.",
      reason: "The AdministratorAccess managed policy is attached.",
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "No administrator-level managed policy is attached.",
    reason: "AdministratorAccess is not attached.",
    flagged: false,
  };
};

const getWildcardPermissionRecommendation = ({ hasFullWildcardPermissions, hasExcessivePermissions }) => {
  if (hasFullWildcardPermissions) {
    return {
      severity: "HIGH",
      action: "REVIEW_PERMISSIONS",
      confidence: 90,
      recommendation:
        "A policy grants wildcard (*:*) permissions — restrict it to the specific actions and resources actually needed.",
      reason: "An Allow statement grants both Action:* and Resource:*.",
      flagged: true,
    };
  }

  if (hasExcessivePermissions) {
    return {
      severity: "MEDIUM",
      action: "REVIEW_PERMISSIONS",
      confidence: 80,
      recommendation: "A customer-managed or inline policy grants a wildcard action — scope it down to specific actions.",
      reason: "An Allow statement grants a wildcard (*) action without also granting Resource:*.",
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 90,
    recommendation: "No wildcard or excessive permissions found.",
    reason: "Inspected policies do not grant wildcard actions.",
    flagged: false,
  };
};

// --- MEDIUM: access key older than 90 days, unused role, role not used
// recently, customer-managed policy with excessive permissions ------------
const getAccessKeyAgeRecommendation = ({ hasOldActiveKey, hasUnusedActiveKey }) => {
  if (hasUnusedActiveKey) {
    return {
      severity: "MEDIUM",
      action: "DELETE_UNUSED_KEY",
      confidence: 85,
      recommendation: "An active access key has never been used — delete it if it's no longer needed.",
      reason: "At least one active access key has no recorded last-used activity.",
      flagged: true,
    };
  }

  if (hasOldActiveKey) {
    return {
      severity: "MEDIUM",
      action: "ROTATE_ACCESS_KEY",
      confidence: 90,
      recommendation: "Rotate access keys older than 90 days.",
      reason: "At least one active access key is older than 90 days.",
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "Access keys are within a healthy rotation age.",
    reason: "No active access key is old or unused.",
    flagged: false,
  };
};

// The action vocabulary has DELETE_UNUSED_ROLE but no separate "delete
// unused user" action — reused here deliberately since the remediation
// intent (delete an unused IAM principal) is identical for both.
const getLoginActivityRecommendation = (neverLoggedIn) => {
  if (neverLoggedIn) {
    return {
      severity: "MEDIUM",
      action: "DELETE_UNUSED_ROLE",
      confidence: 75,
      recommendation: "This user has console access but has never logged in — remove it if it's no longer needed.",
      reason: "No password-based console login has ever been recorded for this user.",
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 90,
    recommendation: "User has console login history.",
    reason: "A password last-used date is recorded for this user.",
    flagged: false,
  };
};

const getRoleUsageRecommendation = ({ neverUsed, notUsedRecently }) => {
  if (neverUsed) {
    return {
      severity: "MEDIUM",
      action: "DELETE_UNUSED_ROLE",
      confidence: 80,
      recommendation: "This role has never been used — delete it if it's no longer needed.",
      reason: "No last-used activity is recorded for this role.",
      flagged: true,
    };
  }

  if (notUsedRecently) {
    return {
      severity: "MEDIUM",
      action: "DELETE_UNUSED_ROLE",
      confidence: 70,
      recommendation: "This role has not been used recently — review whether it's still needed.",
      reason: `Role was last used more than ${ROLE_INACTIVITY_DAYS} days ago.`,
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 90,
    recommendation: "Role has recent usage.",
    reason: "A recent last-used date is recorded for this role.",
    flagged: false,
  };
};

// --- LOW: missing tags, long name, other informational findings -----------
const getTagsRecommendation = (hasNoTags) => {
  if (hasNoTags) {
    return {
      severity: "LOW",
      action: "TAG_RESOURCE",
      confidence: 70,
      recommendation: "Add tags for ownership and cost tracking.",
      reason: "No tags are attached to this resource.",
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 90,
    recommendation: "Tags are configured.",
    reason: "At least one tag is attached to this resource.",
    flagged: false,
  };
};

const getLongNameRecommendation = (hasLongName, resourceLabel) => {
  if (hasLongName) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 60,
      recommendation: `${resourceLabel} name is unusually long — consider a shorter, more standardized naming convention.`,
      reason: `${resourceLabel} name exceeds the standard length threshold.`,
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 90,
    recommendation: `${resourceLabel} name length is reasonable.`,
    reason: `${resourceLabel} name is within a standard length.`,
    flagged: false,
  };
};

const getAgeRecommendation = ({ isOld, ageDays }, resourceLabel) => {
  if (isOld) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 70,
      recommendation: `Review this ${resourceLabel} — it is over a year old.`,
      reason: `${resourceLabel} age is ${ageDays} days.`,
      flagged: true,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 90,
    recommendation: `${resourceLabel} age is within a healthy range.`,
    reason: `${resourceLabel} age is ${ageDays ?? 0} days.`,
    flagged: false,
  };
};

// --- Merge: exactly one Recommendation document per user/role/root
// account, matching the same 1-per-resource cardinality already
// established for EC2/S3/RDS. Unlike those, the merged `action` is the
// SINGLE worst flagged finding's own action (not a generic REVIEW/STOP) —
// each IAM check now carries its own meaningful remediation action, so the
// most urgent one should drive what's shown as *the* action to take. All
// flagged findings' text is still preserved via a "+N other finding(s)"
// suffix rather than silently dropped. -------------------------------------
const SEVERITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3 };

const mergeFindings = (parts, healthyMessage) => {
  const flagged = parts.filter((part) => part.flagged);

  if (!flagged.length) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 90,
      recommendation: healthyMessage,
      reason: healthyMessage,
      monthlyCost: 0,
      estimatedSavings: 0,
    };
  }

  const worst = flagged.reduce((worstSoFar, part) =>
    SEVERITY_RANK[part.severity] > SEVERITY_RANK[worstSoFar.severity] ? part : worstSoFar
  );

  const otherCount = flagged.length - 1;
  const suffix = otherCount > 0 ? ` (+${otherCount} other finding${otherCount > 1 ? "s" : ""})` : "";

  return {
    severity: worst.severity,
    action: worst.action,
    confidence: worst.confidence,
    recommendation: `${worst.recommendation}${suffix}`,
    reason: `${worst.reason}${suffix}`,
    // IAM findings aren't directly dollar-quantifiable the way idle
    // compute/storage is — always 0, never a notional/invented cost.
    monthlyCost: 0,
    estimatedSavings: 0,
  };
};

const mergeIAMUserRecommendations = ({
  mfaRecommendation,
  adminAccessRecommendation,
  wildcardRecommendation,
  accessKeyAgeRecommendation,
  loginActivityRecommendation,
  tagsRecommendation,
  ageRecommendation,
  longNameRecommendation,
}) =>
  mergeFindings(
    [
      mfaRecommendation,
      adminAccessRecommendation,
      wildcardRecommendation,
      accessKeyAgeRecommendation,
      loginActivityRecommendation,
      tagsRecommendation,
      ageRecommendation,
      longNameRecommendation,
    ],
    "MFA, permissions, access keys, login activity, tags, and account age are all healthy."
  );

const mergeIAMRoleRecommendations = ({
  adminAccessRecommendation,
  wildcardRecommendation,
  roleUsageRecommendation,
  tagsRecommendation,
  ageRecommendation,
  longNameRecommendation,
}) =>
  mergeFindings(
    [
      adminAccessRecommendation,
      wildcardRecommendation,
      roleUsageRecommendation,
      tagsRecommendation,
      ageRecommendation,
      longNameRecommendation,
    ],
    "Permissions, usage, tags, and account age are all healthy."
  );

const mergeRootAccountRecommendations = ({ mfaRecommendation, accessKeysRecommendation }) =>
  mergeFindings([mfaRecommendation, accessKeysRecommendation], "Root account MFA and access-key posture are healthy.");

module.exports = {
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
};
