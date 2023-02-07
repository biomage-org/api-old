const hash = require('object-hash');
const validateAndSubmitWork = require('../../../events/validateAndSubmitWork');
const getExperimentBackendStatus = require('../../backendStatus/getExperimentBackendStatus');
const getExtraDependencies = require('./getExtraDependencies');

const createObjectHash = (object) => hash.MD5(object);


const submitMarkerHeatmapWork = async (message) => {
  console.log('payload ', message);

  const { experimentId, input: { authJWT } } = message;

  // const { resolution } = methodSettings[method];
  // consider replacing with getPipelineStatus
  const backendStatus = await getExperimentBackendStatus(experimentId);
  // console.log('backendStatus: ', backendStatus);
  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;
  const numGenes = 5;
  const selectedCellSet = 'louvain';

  const body = {
    name: 'MarkerHeatmap',
    nGenes: numGenes,
    cellSetKey: selectedCellSet,
  };

  const cacheUniquenessKey = null;

  const extras = undefined;
  const extraDependencies = await getExtraDependencies(experimentId, body.name);
  const workerVersion = 3;
  const ETagBody = {
    experimentId,
    body,
    qcPipelineStartDate: qcPipelineStartDate.toISOString(),
    extras,
    cacheUniquenessKey,
    workerVersion,
    extraDependencies,
  };

  console.log('marker heatmap ETagBody: ', ETagBody);
  const ETag = createObjectHash(ETagBody);
  console.log('submitEmbeddingWork: marker heatmap Etag ', ETag);

  const now = new Date();
  const timeout = 15 * 60 * 1000; // 15min in ms
  const timeoutDate = new Date(now.getTime() + timeout);
  const request = {
    ETag,
    socketId: 'randomID',
    experimentId,
    authJWT,
    timeout: timeoutDate.toISOString(),
    body,
  };

  await validateAndSubmitWork(request);
};

module.exports = submitMarkerHeatmapWork;
