const mapS3Buckets = (response) => {
  const buckets = [];

  for (const bucket of response.Buckets || []) {
    buckets.push({
      bucketName: bucket.Name,
      creationDate: bucket.CreationDate,
    });
  }

  return buckets;
};

module.exports = {
  mapS3Buckets,
};
