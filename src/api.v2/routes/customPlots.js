
const { expressAuthorizationMiddleware } = require('../middlewares/authMiddlewares');
const { getImageUploadUrl } = require('../controllers/customPlotsController');

module.exports = {
  'customPlots#getImageUploadUrl': [
    expressAuthorizationMiddleware,
    (req, res, next) => getImageUploadUrl(req, res).catch(next),
  ],
};
