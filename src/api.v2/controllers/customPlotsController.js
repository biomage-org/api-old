const { getCustomPlotUploadUrl } = require('../helpers/s3/signedUrl');
const getLogger = require('../../utils/getLogger');

const logger = getLogger('[CustomPlots] - ');

const getImageUploadUrl = async (req, res) => {
  const { experimentId } = req.params;
  logger.log('Getting upload image signed url');
  const signedUrl = await getCustomPlotUploadUrl(experimentId);
  logger.log('Finished getting signed url for image upload');
  res.send(signedUrl);
};

module.exports = { getImageUploadUrl };
