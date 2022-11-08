const config = require('../../../config');
const getAwsPoolId = require('./getAwsPoolId');


async function getAwsProgrammaticClientInfo() {
  const k8sEnv = process.env.K8S_ENV || 'staging';

  const poolId = await getAwsPoolId();
  const params = {
    UserPoolId: poolId,
  };

  const { UserPoolClients } = await config.cognitoISP.listUserPoolClients(params).promise();
  // const appClientName = 'biomage-cellscope-cluster-default';
  const appClientName = `biomage-programmatic-client-${k8sEnv}`;

  console.log('client', UserPoolClients);
  const clientId = UserPoolClients.find((client) => client.ClientName === appClientName).ClientId;
  console.log(clientId);
  return clientId;
}

module.exports = getAwsProgrammaticClientInfo;
