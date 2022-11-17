const config = require('../../../config');
const AWS = require('../../../utils/requireAWS');

const listObjects = async (bucket, key) => {
  const params = {
    Bucket: bucket,
    Prefix: key,
  };

  const S3Config = {
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    region: config.awsRegion,
  };

  const s3 = new AWS.S3(S3Config)

  const data = (await s3.listObjects(params).promise()).Contents;
  return data
};

module.exports = { listObjects };