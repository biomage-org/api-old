const { expressAuthorizationMiddleware } = require('../middlewares/authMiddlewares');
const { getImageUploadUrl, getImageDownloadUrl } = require('../controllers/customPlotsController');

module.exports = {
  'customPlots#getImageUploadUrl': [
    expressAuthorizationMiddleware,
    (req, res, next) => getImageUploadUrl(req, res).catch(next),
  ],
  'customPlots#getImageDownloadUrl': [
    // expressAuthorizationMiddleware,
    (req, res, next) => getImageDownloadUrl(req, res).catch(next),
  ],
};
