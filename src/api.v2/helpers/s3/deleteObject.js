const NotFoundError = require('../../../utils/responses/NotFoundError');
const getS3Client = require('./getS3Client');

const deleteObject = async (bucketName, key) => {
  const params = { Bucket: bucketName, Key: key };
  const s3 = getS3Client();

  try {
    await s3.deleteObject(params).promise();
  } catch (e) {
    if (e.code === 'NoSuchBucket') {
      throw new NotFoundError(`Couldn't find bucket with key: ${params.Bucket}`);
    }
    throw e;
  }
};

module.exports = deleteObject;
