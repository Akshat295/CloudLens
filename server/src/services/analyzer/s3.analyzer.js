// Turns the raw per-bucket AWS signals into a normalized list of
// configuration issues, mirroring how cpu.analyzer.js reduces raw
// CloudWatch values down to a single metric for the recommender.
const analyzeBucketConfiguration = ({ isPublic, versioningEnabled, hasLifecycleRules }) => {
  const issues = [];

  if (isPublic) issues.push("Bucket is publicly accessible");
  if (!versioningEnabled) issues.push("Versioning is disabled");
  if (!hasLifecycleRules) issues.push("Lifecycle policy is missing");

  return {
    issues,
    isPublic,
    versioningEnabled,
    hasLifecycleRules,
  };
};

const toArray = (value) => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

const IA_STORAGE_CLASSES = ["STANDARD_IA", "ONEZONE_IA"];
const GLACIER_STORAGE_CLASSES = ["GLACIER", "DEEP_ARCHIVE", "GLACIER_IR"];

// Inspects every lifecycle rule (already fetched/parsed by s3.service.js's
// getLifecycleRules) instead of just checking whether a configuration
// exists — mirroring how analyzeBucketPolicy inspects statement content
// rather than just "is there a policy". `rules === null` means the fetch
// itself was undeterminable (permission error, etc.); mirroring every other
// undeterminable-signal default in this codebase, that's treated as "assume
// properly configured" rather than raising a false alarm. `rules === []`
// (a definitive "no lifecycle configuration") is a real finding.
const analyzeLifecycleRules = (rules) => {
  if (rules === null) {
    return {
      configured: true,
      ruleCount: 0,
      hasTransitionToIA: true,
      hasTransitionToGlacier: true,
      hasIntelligentTiering: true,
      hasExpirationRule: true,
      hasAbortIncompleteMultipartUpload: true,
      onlyExpirationConfigured: false,
    };
  }

  const configured = rules.length > 0;

  const transitionStorageClasses = new Set(
    rules.flatMap((rule) => toArray(rule.Transitions)).map((transition) => transition.StorageClass)
  );

  const hasTransitionToIA = IA_STORAGE_CLASSES.some((storageClass) => transitionStorageClasses.has(storageClass));
  const hasTransitionToGlacier = GLACIER_STORAGE_CLASSES.some((storageClass) =>
    transitionStorageClasses.has(storageClass)
  );
  const hasIntelligentTiering = transitionStorageClasses.has("INTELLIGENT_TIERING");

  const hasExpirationRule = rules.some(
    (rule) => Boolean(rule.Expiration) || Boolean(rule.NoncurrentVersionExpiration)
  );
  const hasAbortIncompleteMultipartUpload = rules.some((rule) => Boolean(rule.AbortIncompleteMultipartUpload));

  const hasAnyTransition = hasTransitionToIA || hasTransitionToGlacier || hasIntelligentTiering;

  // The bucket has lifecycle rules, but the only thing any of them actually
  // does is expire objects — no storage-class transitions, no multipart
  // cleanup. A weaker configuration than a "properly configured" bucket.
  const onlyExpirationConfigured =
    configured && hasExpirationRule && !hasAnyTransition && !hasAbortIncompleteMultipartUpload;

  return {
    configured,
    ruleCount: rules.length,
    hasTransitionToIA,
    hasTransitionToGlacier,
    hasIntelligentTiering,
    hasExpirationRule,
    hasAbortIncompleteMultipartUpload,
    onlyExpirationConfigured,
  };
};

// A Principal is "wildcard" (i.e. anyone, including unauthenticated
// requests) when it's the bare string "*" or an {"AWS": "*"} / {"AWS":
// ["*", ...]} block. Service principals ({"Service": "..."}) and specific
// account/user ARNs are intentionally not flagged — those aren't "the
// public". Note: this does not evaluate the statement's `Condition` block
// (e.g. a source-IP or VPC-endpoint restriction narrowing a "*" principal)
// — a wildcard principal is flagged regardless, which is the conservative,
// safer default for a security scanner.
const isWildcardPrincipal = (principal) => {
  if (principal === "*") return true;
  if (!principal || typeof principal !== "object") return false;

  return toArray(principal.AWS).includes("*");
};

const isFullAccessAction = (action) => action === "*" || action === "s3:*";
const isGetObjectAction = (action) => isFullAccessAction(action) || action === "s3:getobject";
const isPutObjectAction = (action) => isFullAccessAction(action) || action === "s3:putobject";
const isWildcardAction = (action) => action.includes("*");

// Inspects a bucket's policy document (already fetched/parsed by
// s3.service.js's getBucketPolicy) for public/overly-broad grants: a
// wildcard Principal, public GetObject/PutObject, unrestricted ("*"/"s3:*")
// actions, and wildcard permissions generally. Only `Effect: "Allow"`
// statements are considered — a "Deny" statement targeting "*" is a
// control, not a risk.
//
// Wildcard-permission actions (e.g. "s3:*") are flagged regardless of who
// the Principal is — granting unrestricted actions to even one specific,
// named account/role is still a least-privilege violation worth surfacing.
// Public read/write/full-access, by definition, additionally require the
// Principal itself to be wildcard ("everyone").
const analyzeBucketPolicy = (policy) => {
  if (!policy) {
    return {
      policyExists: false,
      hasWildcardPrincipal: false,
      publicRead: false,
      publicWrite: false,
      fullAccess: false,
      wildcardPermissions: false,
      issues: [],
    };
  }

  let hasWildcardPrincipal = false;
  let publicRead = false;
  let publicWrite = false;
  let fullAccess = false;
  let wildcardPermissions = false;

  for (const statement of toArray(policy.Statement)) {
    if (statement.Effect !== "Allow") continue;

    const actions = toArray(statement.Action).map((action) => String(action).toLowerCase());
    const principalIsWildcard = isWildcardPrincipal(statement.Principal);

    if (actions.some(isWildcardAction)) wildcardPermissions = true;

    if (!principalIsWildcard) continue;

    hasWildcardPrincipal = true;

    if (actions.some(isFullAccessAction)) fullAccess = true;
    if (actions.some(isGetObjectAction)) publicRead = true;
    if (actions.some(isPutObjectAction)) publicWrite = true;
  }

  const issues = [];
  if (publicRead) issues.push("Bucket policy allows public read access (s3:GetObject to everyone)");
  if (publicWrite) issues.push("Bucket policy allows public write access (s3:PutObject to everyone)");
  if (fullAccess) issues.push("Bucket policy grants full access to everyone");
  if (hasWildcardPrincipal && !publicRead && !publicWrite && !fullAccess) {
    issues.push("Bucket policy grants access to a wildcard (*) principal");
  }
  if (wildcardPermissions && !fullAccess) {
    issues.push("Bucket policy contains wildcard (*) permissions");
  }

  return {
    policyExists: true,
    hasWildcardPrincipal,
    publicRead,
    publicWrite,
    fullAccess,
    wildcardPermissions,
    issues,
  };
};

// Turns the per-storage-class byte counts (already fetched by
// cloudwatch.service.js's getS3StorageMetrics) into a percentage
// breakdown across the five tracked classes. Percentages are relative to
// the sum of just those five — CloudWatch also reports a few classes this
// analysis doesn't track (Reduced Redundancy, Intelligent-Tiering's own
// access-tier breakdown), so this is deliberately an approximation of the
// bucket's overall makeup, not a byte-exact accounting of 100% of it.
const analyzeStorageClassDistribution = (storageClassBytes) => {
  const totalBytes = Object.values(storageClassBytes).reduce((sum, bytes) => sum + bytes, 0);

  const percentages = {};
  for (const [storageClass, bytes] of Object.entries(storageClassBytes)) {
    percentages[storageClass] = totalBytes > 0 ? Number(((bytes / totalBytes) * 100).toFixed(2)) : 0;
  }

  return {
    totalBytes,
    bytes: storageClassBytes,
    percentages,
  };
};

module.exports = {
  analyzeBucketConfiguration,
  analyzeBucketPolicy,
  analyzeLifecycleRules,
  analyzeStorageClassDistribution,
};
