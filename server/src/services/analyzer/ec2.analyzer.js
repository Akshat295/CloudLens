const { calculateAverageCPU } = require("./cpu.analyzer");

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SECURITY_GROUP_NAME = "default";
const GP2_VOLUME_TYPE = "gp2";

const calculateInstanceAgeDays = (launchTime) => {
  if (!launchTime) return 0;

  const ageMs = Date.now() - new Date(launchTime).getTime();
  return Math.max(0, Math.floor(ageMs / DAY_MS));
};

// calculateAverageCPU is just a generic "mean of a numeric array" helper
// despite its name — reused here instead of duplicating the same reduce.
const analyzeNetworkUtilization = ({ networkInValues, networkOutValues }) => ({
  avgNetworkIn: calculateAverageCPU(networkInValues),
  avgNetworkOut: calculateAverageCPU(networkOutValues),
});

const analyzeDiskIO = ({ diskReadBytesValues, diskWriteBytesValues, diskReadOpsValues, diskWriteOpsValues }) => ({
  avgDiskReadBytes: calculateAverageCPU(diskReadBytesValues),
  avgDiskWriteBytes: calculateAverageCPU(diskWriteBytesValues),
  avgDiskReadOps: calculateAverageCPU(diskReadOpsValues),
  avgDiskWriteOps: calculateAverageCPU(diskWriteOpsValues),
});

const analyzeSecurityGroups = (securityGroups = []) => {
  const groupNames = securityGroups.map((group) => group.groupName).filter(Boolean);
  const groupIds = securityGroups.map((group) => group.groupId).filter(Boolean);

  return {
    count: securityGroups.length,
    hasDefault: groupNames.includes(DEFAULT_SECURITY_GROUP_NAME),
    groups: securityGroups,
    groupNames,
    groupIds,
  };
};

// `volumes` are raw DescribeVolumes results (already filtered to the ones
// attached to this instance) — Encrypted/VolumeType/VolumeId come straight
// off the AWS response shape.
const analyzeEBSVolumes = (volumes = []) => {
  const volumeIds = volumes.map((volume) => volume.VolumeId);
  const volumeTypes = volumes.map((volume) => volume.VolumeType);
  const encrypted = volumes.map((volume) => Boolean(volume.Encrypted));

  return {
    volumeCount: volumes.length,
    volumeIds,
    volumeTypes,
    encrypted,
    hasUnencrypted: encrypted.some((isEncrypted) => !isEncrypted),
    hasGp2: volumeTypes.includes(GP2_VOLUME_TYPE),
  };
};

// `isAssociated` = the instance's public IP shows up in the account's
// allocated Elastic IP addresses (DescribeAddresses) — anything else with a
// public IP is an ephemeral, auto-assigned one.
const analyzeElasticIP = ({ publicIp, isAssociated }) => {
  if (!publicIp) return "NONE";
  return isAssociated ? "ELASTIC" : "TEMPORARY";
};

// Feature 7: composite confidence score (0-100) replacing the previous
// fixed 95/90/99 constants. Each signal is scored 0-100 by how decisively
// it supports the CPU-based verdict (clearly idle or clearly saturated,
// rather than sitting in an ambiguous middle), then combined with the
// requested weights: CPU 40%, Network 20%, Disk 20%, Age 20%.
const CONFIDENCE_WEIGHTS = { cpu: 0.4, network: 0.2, disk: 0.2, age: 0.2 };
const NETWORK_SIGNAL_REFERENCE_BYTES = 50_000_000;
const DISK_SIGNAL_REFERENCE_BYTES = 50_000_000;
const AGE_SIGNAL_REFERENCE_DAYS = 730;

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const calculateEC2ConfidenceScore = ({ averageCPU, avgNetworkTotal, avgDiskTotal, instanceAgeDays }) => {
  const cpuSignal = clamp(Math.abs(averageCPU - 50) * 2);

  const networkRatio = clamp((avgNetworkTotal / NETWORK_SIGNAL_REFERENCE_BYTES) * 100);
  const networkSignal = averageCPU < 50 ? 100 - networkRatio : networkRatio;

  const diskRatio = clamp((avgDiskTotal / DISK_SIGNAL_REFERENCE_BYTES) * 100);
  const diskSignal = averageCPU < 50 ? 100 - diskRatio : diskRatio;

  const ageSignal = clamp((instanceAgeDays / AGE_SIGNAL_REFERENCE_DAYS) * 100);

  const weighted =
    cpuSignal * CONFIDENCE_WEIGHTS.cpu +
    networkSignal * CONFIDENCE_WEIGHTS.network +
    diskSignal * CONFIDENCE_WEIGHTS.disk +
    ageSignal * CONFIDENCE_WEIGHTS.age;

  return Math.round(clamp(weighted));
};

module.exports = {
  calculateInstanceAgeDays,
  analyzeNetworkUtilization,
  analyzeDiskIO,
  analyzeSecurityGroups,
  analyzeEBSVolumes,
  analyzeElasticIP,
  calculateEC2ConfidenceScore,
};
