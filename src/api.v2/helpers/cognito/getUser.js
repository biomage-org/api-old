const config = require('../../../config');
const getAwsPoolId = require('./getAwsPoolId');


async function getUser(email) {
  const pId = await getAwsPoolId();
  const user = await config.cognitoISP.adminGetUser({ UserPoolId: pId, Username: email }).promise();
  return user.UserAttributes;
}
module.exports = getUser;
