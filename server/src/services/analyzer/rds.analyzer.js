// Turns the raw per-instance AWS/CloudWatch signals into a normalized set
// of findings, mirroring how s3.analyzer.js's analyzeBucketConfiguration
// reduces raw bucket signals down to an issues list for the recommender.
const IDLE_CPU_THRESHOLD = 5;
const HIGH_CPU_THRESHOLD = 80;
const LOW_BACKUP_RETENTION_DAYS = 7;

// Static, illustrative "minimum recommended major.minor version" baseline
// per engine family — not a live AWS EOL/deprecation lookup, just a
// reasonable heuristic for flagging clearly-outdated engine versions (same
// spirit as the "illustrative, clearly-heuristic thresholds" already used
// for S3's bucket-size checks).
const MIN_RECOMMENDED_ENGINE_VERSION = {
  mysql: [8, 0],
  "aurora-mysql": [8, 0],
  postgres: [14, 0],
  "aurora-postgresql": [14, 0],
  mariadb: [10, 6],
  sqlserver: [15, 0],
  oracle: [19, 0],
};

const normalizeEngineFamily = (engine = "") => {
  if (engine.startsWith("aurora-mysql")) return "aurora-mysql";
  if (engine.startsWith("aurora-postgresql")) return "aurora-postgresql";
  if (engine.startsWith("sqlserver")) return "sqlserver";
  if (engine.startsWith("oracle")) return "oracle";
  return engine;
};

const parseVersionTuple = (versionString = "") => {
  const parts = String(versionString)
    .split(".")
    .map((part) => parseInt(part, 10));

  return [Number.isNaN(parts[0]) ? 0 : parts[0], Number.isNaN(parts[1]) ? 0 : parts[1]];
};

const isVersionOlderThan = ([major, minor], [minMajor, minMinor]) => {
  if (major !== minMajor) return major < minMajor;
  return minor < minMinor;
};

// Returns false (not flagged) for engine families without a static
// baseline above, rather than guessing.
const isEngineVersionOld = (engine, engineVersion) => {
  const minVersion = MIN_RECOMMENDED_ENGINE_VERSION[normalizeEngineFamily(engine)];
  if (!minVersion) return false;

  return isVersionOlderThan(parseVersionTuple(engineVersion), minVersion);
};

const analyzeRDSConfiguration = ({
  publiclyAccessible,
  storageEncrypted,
  backupRetentionPeriod,
  multiAZ,
  storageType,
  engine,
  engineVersion,
  averageCPU,
}) => {
  const issues = [];

  if (publiclyAccessible) issues.push("Database is publicly accessible");
  if (!storageEncrypted) issues.push("Storage encryption is disabled");

  const backupDisabled = backupRetentionPeriod === 0;
  const lowBackupRetention = backupRetentionPeriod > 0 && backupRetentionPeriod < LOW_BACKUP_RETENTION_DAYS;
  if (backupDisabled) issues.push("Automated backups are disabled");
  else if (lowBackupRetention) issues.push(`Backup retention is only ${backupRetentionPeriod} day(s)`);

  if (!multiAZ) issues.push("Multi-AZ is not enabled");

  const isGp2 = storageType === "gp2";
  if (isGp2) issues.push("Storage uses gp2 instead of gp3");

  const engineVersionIsOld = isEngineVersionOld(engine, engineVersion);
  if (engineVersionIsOld) issues.push("Engine version is older than the recommended baseline");

  const isIdle = averageCPU < IDLE_CPU_THRESHOLD;
  const isHighCPU = averageCPU > HIGH_CPU_THRESHOLD;
  if (isIdle) issues.push("CPU utilization is very low — instance may be oversized");
  if (isHighCPU) issues.push("CPU utilization is high");

  return {
    issues,
    publiclyAccessible,
    storageEncrypted,
    backupRetentionPeriod,
    backupDisabled,
    lowBackupRetention,
    multiAZ,
    storageType,
    isGp2,
    engineVersionIsOld,
    averageCPU,
    isIdle,
    isHighCPU,
  };
};

module.exports = {
  analyzeRDSConfiguration,
};
