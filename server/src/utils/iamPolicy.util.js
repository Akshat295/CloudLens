const AWS_MANAGED_POLICY_ARN_PREFIX = "arn:aws:iam::aws:policy/";

const toArray = (value) => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

// IAM API responses (inline policy documents, trust policy documents,
// managed policy version documents) come back as URI-encoded JSON strings —
// shared here rather than duplicated across the mapper (trust policy) and
// analyzer (wildcard detection).
const parsePolicyDocument = (document) => {
  if (!document) return null;

  try {
    return JSON.parse(decodeURIComponent(document));
  } catch (error) {
    return null;
  }
};

// AWS-managed policies (arn:aws:iam::aws:policy/...) are vetted by AWS
// itself; only customer-managed policies (any other policy ARN) are worth
// the extra GetPolicy + GetPolicyVersion round trip to inspect their
// content. Used both to decide which attached policies to fetch documents
// for (iam.service.js) and, incidentally, to reason about them afterward.
const isCustomerManagedPolicyArn = (policyArn = "") => !policyArn.startsWith(AWS_MANAGED_POLICY_ARN_PREFIX);

const allowStatementsMatch = (policyDocument, predicate) => {
  if (!policyDocument) return false;

  return toArray(policyDocument.Statement).some(
    (statement) => statement.Effect === "Allow" && predicate(statement)
  );
};

// A wildcard action on its own (e.g. "s3:*" scoped to a specific
// resource, or "*" scoped to a specific resource) — broader than needed,
// but not a full grant. Distinct from hasFullWildcardPermissions below.
const hasWildcardAction = (policyDocument) =>
  allowStatementsMatch(policyDocument, (statement) => toArray(statement.Action).includes("*"));

// True "*:*" — an Allow statement granting every action on every resource,
// the most severe form of overly-broad access (AdministratorAccess-
// equivalent, but via a custom/inline policy rather than the well-known
// managed policy).
const hasFullWildcardPermissions = (policyDocument) =>
  allowStatementsMatch(
    policyDocument,
    (statement) => toArray(statement.Action).includes("*") && toArray(statement.Resource).includes("*")
  );

module.exports = {
  toArray,
  parsePolicyDocument,
  isCustomerManagedPolicyArn,
  hasWildcardAction,
  hasFullWildcardPermissions,
};
