const { expressAuthorizationMiddleware } = require('../middlewares/authMiddlewares');
const { getImageUploadUrl, getImageDownloadUrl, deleteImage } = require('../controllers/customPlotsController');

module.exports = {
  'customPlots#getImageUploadUrl': [
    expressAuthorizationMiddleware,
    (req, res, next) => getImageUploadUrl(req, res).catch(next),
  ],
  'customPlots#getImageDownloadUrl': [
    expressAuthorizationMiddleware,
    (req, res, next) => getImageDownloadUrl(req, res).catch(next),
  ],
  'customPlots#deleteImage': [
    expressAuthorizationMiddleware,
    (req, res, next) => deleteImage(req, res).catch(next),
  ],
};
