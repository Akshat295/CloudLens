const {
  ListUsersCommand,
  ListRolesCommand,
  ListMFADevicesCommand,
  GetLoginProfileCommand,
  ListAttachedUserPoliciesCommand,
  ListUserPoliciesCommand,
  GetUserPolicyCommand,
  ListGroupsForUserCommand,
  ListAccessKeysCommand,
  GetAccessKeyLastUsedCommand,
  ListUserTagsCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
  ListRoleTagsCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  GetAccountSummaryCommand,
} = require("@aws-sdk/client-iam");

const { iamClient } = require("../../config/aws");
const { mapIAMUsers, mapIAMRoles } = require("../../mappers/iam.mapper");
const { parsePolicyDocument, isCustomerManagedPolicyArn } = require("../../utils/iamPolicy.util");

const getUsers = async () => {
  const response = await iamClient.send(new ListUsersCommand({}));

  return mapIAMUsers(response);
};

const getRoles = async () => {
  const response = await iamClient.send(new ListRolesCommand({}));

  return mapIAMRoles(response);
};

// GetAccountSummary's SummaryMap values are 1/0, not booleans.
// AccountAccessKeysPresent is the "root account usage" proxy — detecting
// actual recent root login activity requires generating a full IAM
// credential report (an async generate-then-poll flow); root having
// access keys at all is itself a well-established HIGH-severity anti-
// pattern and is available from this same lightweight call. On a
// permission gap we default to "fine" (MFA enabled, no access keys)
// rather than raise a false root-account alarm — same graceful-
// degradation convention used throughout s3.service.js.
const getRootAccountSecuritySummary = async () => {
  try {
    const response = await iamClient.send(new GetAccountSummaryCommand({}));
    const summary = response.SummaryMap || {};

    return {
      mfaEnabled: summary.AccountMFAEnabled === 1,
      hasAccessKeys: summary.AccountAccessKeysPresent === 1,
    };
  } catch (error) {
    console.warn("Could not determine root account security summary:", error.message);
    return { mfaEnabled: true, hasAccessKeys: false };
  }
};

// A NoSuchEntity error means the user has never had a console password set
// (API-only user) — a definitive, non-error answer. Any other failure
// means we can't tell, so we default to `false` (no console access) rather
// than raise a false "console user without MFA" alarm.
const hasConsoleAccess = async (userName) => {
  try {
    await iamClient.send(new GetLoginProfileCommand({ UserName: userName }));
    return true;
  } catch (error) {
    if (error.name === "NoSuchEntityException") return false;

    console.warn(`Could not determine console access for user ${userName}:`, error.message);
    return false;
  }
};

const hasUserMFA = async (userName) => {
  try {
    const response = await iamClient.send(new ListMFADevicesCommand({ UserName: userName }));

    return Boolean(response.MFADevices?.length);
  } catch (error) {
    console.warn(`Could not determine MFA status for user ${userName}:`, error.message);
    return true;
  }
};

const getAttachedUserPolicies = async (userName) => {
  try {
    const response = await iamClient.send(new ListAttachedUserPoliciesCommand({ UserName: userName }));

    return (response.AttachedPolicies || []).map((policy) => ({
      policyName: policy.PolicyName,
      policyArn: policy.PolicyArn,
    }));
  } catch (error) {
    console.warn(`Could not list attached policies for user ${userName}:`, error.message);
    return [];
  }
};

// Inline policies are user/role-owned (not shared managed policies), so
// their document is fetched directly per policy name — unlike attached
// managed policies, which would need a GetPolicy + GetPolicyVersion round
// trip per policy just to resolve the current default version's document.
const getInlineUserPolicies = async (userName) => {
  try {
    const response = await iamClient.send(new ListUserPoliciesCommand({ UserName: userName }));
    const policyNames = response.PolicyNames || [];

    return await Promise.all(
      policyNames.map(async (policyName) => {
        try {
          const policyResponse = await iamClient.send(
            new GetUserPolicyCommand({ UserName: userName, PolicyName: policyName })
          );

          return { policyName, document: parsePolicyDocument(policyResponse.PolicyDocument) };
        } catch (error) {
          console.warn(`Could not read inline policy ${policyName} for user ${userName}:`, error.message);
          return { policyName, document: null };
        }
      })
    );
  } catch (error) {
    console.warn(`Could not list inline policies for user ${userName}:`, error.message);
    return [];
  }
};

const getUserGroups = async (userName) => {
  try {
    const response = await iamClient.send(new ListGroupsForUserCommand({ UserName: userName }));

    return (response.Groups || []).map((group) => group.GroupName);
  } catch (error) {
    console.warn(`Could not list groups for user ${userName}:`, error.message);
    return [];
  }
};

const getUserAccessKeys = async (userName) => {
  try {
    const response = await iamClient.send(new ListAccessKeysCommand({ UserName: userName }));
    const keys = response.AccessKeyMetadata || [];

    return await Promise.all(
      keys.map(async (key) => {
        let lastUsedDate = null;

        try {
          const lastUsedResponse = await iamClient.send(
            new GetAccessKeyLastUsedCommand({ AccessKeyId: key.AccessKeyId })
          );
          lastUsedDate = lastUsedResponse.AccessKeyLastUsed?.LastUsedDate || null;
        } catch (error) {
          console.warn(`Could not determine last-used date for access key ${key.AccessKeyId}:`, error.message);
        }

        return {
          accessKeyId: key.AccessKeyId,
          status: key.Status,
          createDate: key.CreateDate,
          lastUsedDate,
        };
      })
    );
  } catch (error) {
    console.warn(`Could not list access keys for user ${userName}:`, error.message);
    return [];
  }
};

const getUserTags = async (userName) => {
  try {
    const response = await iamClient.send(new ListUserTagsCommand({ UserName: userName }));

    return response.Tags || [];
  } catch (error) {
    console.warn(`Could not list tags for user ${userName}:`, error.message);
    return [];
  }
};

const getAttachedRolePolicies = async (roleName) => {
  try {
    const response = await iamClient.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));

    return (response.AttachedPolicies || []).map((policy) => ({
      policyName: policy.PolicyName,
      policyArn: policy.PolicyArn,
    }));
  } catch (error) {
    console.warn(`Could not list attached policies for role ${roleName}:`, error.message);
    return [];
  }
};

const getInlineRolePolicies = async (roleName) => {
  try {
    const response = await iamClient.send(new ListRolePoliciesCommand({ RoleName: roleName }));
    const policyNames = response.PolicyNames || [];

    return await Promise.all(
      policyNames.map(async (policyName) => {
        try {
          const policyResponse = await iamClient.send(
            new GetRolePolicyCommand({ RoleName: roleName, PolicyName: policyName })
          );

          return { policyName, document: parsePolicyDocument(policyResponse.PolicyDocument) };
        } catch (error) {
          console.warn(`Could not read inline policy ${policyName} for role ${roleName}:`, error.message);
          return { policyName, document: null };
        }
      })
    );
  } catch (error) {
    console.warn(`Could not list inline policies for role ${roleName}:`, error.message);
    return [];
  }
};

const getRoleTags = async (roleName) => {
  try {
    const response = await iamClient.send(new ListRoleTagsCommand({ RoleName: roleName }));

    return response.Tags || [];
  } catch (error) {
    console.warn(`Could not list tags for role ${roleName}:`, error.message);
    return [];
  }
};

// A customer-managed policy's document lives behind its current default
// version — GetPolicy resolves that version ID, then GetPolicyVersion
// fetches the actual document. AWS-managed policies are filtered out
// before this is ever called (see isCustomerManagedPolicyArn) since their
// content is vetted by AWS itself and not worth a 2-call round trip per
// policy.
const getPolicyDocument = async (policyArn) => {
  try {
    const policyResponse = await iamClient.send(new GetPolicyCommand({ PolicyArn: policyArn }));
    const versionId = policyResponse.Policy?.DefaultVersionId;
    if (!versionId) return null;

    const versionResponse = await iamClient.send(
      new GetPolicyVersionCommand({ PolicyArn: policyArn, VersionId: versionId })
    );

    return parsePolicyDocument(versionResponse.PolicyVersion?.Document);
  } catch (error) {
    console.warn(`Could not read policy document for ${policyArn}:`, error.message);
    return null;
  }
};

// Shared by both users and roles — takes either's `attachedPolicies`
// ({ policyName, policyArn }[]) and returns documents for just the
// customer-managed ones, in the same { policyName, document } shape as
// getInlineUserPolicies/getInlineRolePolicies so the analyzer can inspect
// both sets identically.
const getCustomerManagedPolicyDocuments = async (attachedPolicies = []) => {
  const customerManaged = attachedPolicies.filter((policy) => isCustomerManagedPolicyArn(policy.policyArn));

  return await Promise.all(
    customerManaged.map(async (policy) => ({
      policyName: policy.policyName,
      document: await getPolicyDocument(policy.policyArn),
    }))
  );
};

module.exports = {
  getUsers,
  getRoles,
  getRootAccountSecuritySummary,
  hasUserMFA,
  hasConsoleAccess,
  getAttachedUserPolicies,
  getInlineUserPolicies,
  getUserGroups,
  getUserAccessKeys,
  getUserTags,
  getAttachedRolePolicies,
  getInlineRolePolicies,
  getRoleTags,
  getCustomerManagedPolicyDocuments,
};
