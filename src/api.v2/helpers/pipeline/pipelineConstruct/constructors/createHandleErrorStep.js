const config = require('../../../../../config');
const { PIPELINE_ERROR, END_OF_PIPELINE } = require('../../../../constants');
const utils = require('../utils');

const buildErrorMessage = (
  sandboxId,
  experimentId,
  taskName,
  processName,
  activityId,
  authJWT,
) => ({
  taskName,
  experimentId,
  apiUrl: config.publicApiUrl,
  input: {
    authJWT,
    experimentId,
    sandboxId,
    activityId,
    processName,
  },
});

const createHandleErrorStep = (context, step) => {
  const {
    environment, accountId, sandboxId, activityArn, experimentId, processName, authJWT,
  } = context;

  const activityId = utils.getActivityId(activityArn);

  const errorMessage = buildErrorMessage(sandboxId,
    experimentId,
    PIPELINE_ERROR,
    processName,
    activityId,
    authJWT);

  return {
    ...step,
    Type: 'Task',
    Resource: 'arn:aws:states:::sns:publish',
    Parameters: {
      TopicArn: `arn:aws:sns:${config.awsRegion}:${accountId}:work-results-${environment}-${sandboxId}-v2`,
      Message: JSON.stringify(errorMessage),
      MessageAttributes: {
        type: {
          DataType: 'String',
          StringValue: 'PipelineError',
        },
      },
    },
    Next: END_OF_PIPELINE,
  };
};

module.exports = createHandleErrorStep;
