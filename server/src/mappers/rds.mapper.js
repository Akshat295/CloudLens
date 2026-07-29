const mapRDSInstances = (response) => {
  return (response.DBInstances || []).map((instance) => ({
    dbInstanceIdentifier: instance.DBInstanceIdentifier,
    dbInstanceArn: instance.DBInstanceArn,

    engine: instance.Engine,
    engineVersion: instance.EngineVersion,

    instanceClass: instance.DBInstanceClass,

    storageType: instance.StorageType,
    allocatedStorage: instance.AllocatedStorage || 0,

    multiAZ: Boolean(instance.MultiAZ),
    publiclyAccessible: Boolean(instance.PubliclyAccessible),

    // AWS omits BackupRetentionPeriod entirely when backups are disabled on
    // some engine/version combinations, rather than always returning 0.
    backupRetentionPeriod: instance.BackupRetentionPeriod ?? 0,

    storageEncrypted: Boolean(instance.StorageEncrypted),

    status: instance.DBInstanceStatus,

    endpoint: instance.Endpoint
      ? { address: instance.Endpoint.Address, port: instance.Endpoint.Port }
      : null,

    availabilityZone: instance.AvailabilityZone,
  }));
};

module.exports = {
  mapRDSInstances,
};
