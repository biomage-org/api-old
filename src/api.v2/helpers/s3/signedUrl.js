const _ = require('lodash');

const { v4: uuidv4 } = require('uuid');
const AWS = require('../../../utils/requireAWS');
const config = require('../../../config');

const bucketNames = require('../../../config/bucketNames');
const SampleFile = require('../../model/SampleFile');
const { NotFoundError } = require('../../../utils/responses');

const { listObjects } = require('./listObjects');

const getSignedUrl = async (operation, params) => {
  if (!params.Bucket) throw new Error('Bucket is required');
  if (!params.Key) throw new Error('Key is required');

  const S3Config = {
    apiVersion: '2006-03-01',
    signatureVersion: 'v4',
    region: config.awsRegion,
  };

  const s3 = new AWS.S3(S3Config);

  return s3.getSignedUrlPromise(operation, params);
};

const getCustomPlotUploadUrl = async (experimentId) => {
  const plotUUID = uuidv4();
  const params = {
    Bucket: bucketNames.CUSTOM_PLOTS,
    Key: `${experimentId}/${plotUUID}`,
    // 1 hour timeout of upload link
    Expires: 3600,
  };

  const signedUrl = await getSignedUrl('putObject', params);

  return signedUrl;
};

const getCustomPlotDownloadUrl = async (experimentId) => {
  const data = await listObjects(bucketNames.CUSTOM_PLOTS, experimentId);
  const keys = data.map((entry) => entry.Key);

  const promises = keys.map((key) => {
    const params = {
      Bucket: bucketNames.CUSTOM_PLOTS,
      Key: key,
      // 1 hour timeout of upload link
      Expires: 3600,
    };

    return getSignedUrl('getObject', params);
  });

  const signedUrls = await Promise.all(promises);

  return { signedUrls, keys };
};

const getSampleFileUploadUrl = async (sampleFileId, metadata) => {
  const params = {
    Bucket: bucketNames.SAMPLE_FILES,
    Key: `${sampleFileId}`,
    // 1 hour timeout of upload link
    Expires: 3600,
  };

  if (metadata.cellrangerVersion) {
    params.Metadata = {
      cellranger_version: metadata.cellrangerVersion,
    };
  }

  const signedUrl = await getSignedUrl('putObject', params);

  return signedUrl;
};

const fileNameToReturn = {
  matrix10x: 'matrix.mtx.gz',
  barcodes10x: 'barcodes.tsv.gz',
  features10x: 'features.tsv.gz',
  rhapsody: 'expression_data.st.gz',
};

const getSampleFileDownloadUrl = async (experimentId, sampleId, fileType) => {
  const allFiles = await new SampleFile().allFilesForSample(sampleId);

  const matchingFile = allFiles.find(({ sampleFileType }) => sampleFileType === fileType);

  if (_.isNil(matchingFile)) {
    throw new NotFoundError(`File ${fileType} from sample ${sampleId} from experiment ${experimentId} not found`);
  }

  const params = {
    Bucket: bucketNames.SAMPLE_FILES,
    Key: matchingFile.s3Path,
    ResponseContentDisposition: `attachment; filename="${fileNameToReturn[fileType]}"`,
  };

  const signedUrl = await getSignedUrl('getObject', params);

  return signedUrl;
};

module.exports = {
  getCustomPlotUploadUrl,
  getCustomPlotDownloadUrl,
  getSampleFileUploadUrl,
  getSampleFileDownloadUrl,
  getSignedUrl,
};
