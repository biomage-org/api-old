const { getCustomPlotUploadUrl, getCustomPlotDownloadUrl } = require('../helpers/s3/signedUrl');
const getLogger = require('../../utils/getLogger');
const deleteObject = require('../helpers/s3/deleteObject');
const bucketNames = require('../../config/bucketNames');
const { OK } = require('../../utils/responses');

const logger = getLogger('[CustomPlots] - ');

const getImageUploadUrl = async (req, res) => {
  const { experimentId } = req.params;
  logger.log('Getting upload image signed url for experiment ', experimentId);
  const signedUrl = await getCustomPlotUploadUrl(experimentId);
  logger.log('Finished getting signed url for image upload');
  res.send(signedUrl);
};

const getImageDownloadUrl = async (req, res) => {
  const { experimentId } = req.params;
  logger.log('Getting upload image signed url for experiment ', experimentId);
  const signedUrl = await getCustomPlotDownloadUrl(experimentId);
  logger.log('Finished getting signed url for image upload');
  res.send(signedUrl);
};

const deleteImage = async (req, res) => {
  const { imageId } = req.body;
  logger.log('Deleting custom image plot ', imageId);
  await deleteObject(bucketNames.CUSTOM_PLOTS, imageId);
  logger.log('Custom image deleted');
  res.json(OK());
};

module.exports = { getImageUploadUrl, getImageDownloadUrl, deleteImage };
