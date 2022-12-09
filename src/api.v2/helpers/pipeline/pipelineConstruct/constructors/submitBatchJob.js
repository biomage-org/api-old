const config = require('../../../../../config');

const submitBatchJob = (context, step) => {
  const {
    activityArn, podCpus, podMemory, processName, environment, experimentId,
  } = context;

  const DATADOG_VCPU = 0.1;
  const DATADOG_MEMORY = 250;

  const DEFAULT_CPUS = 2;
  const DEFAULT_MEM = 8192; // MiB
  const cpus = podCpus || DEFAULT_CPUS;
  const mem = podMemory || DEFAULT_MEM;

  return {
    ...step,
    Type: 'Task',
    Resource: 'arn:aws:states:::batch:submitJob',
    Parameters: {
      JobDefinition: `job-pipeline-${environment}`,
      JobName: `${environment}-${experimentId}-${processName}`, // changing the name will break job termination when a new one is submitted
      JobQueue: `queue-pipeline-${environment}`,
      ContainerOverrides: {
        Environment: [
          {
            Name: 'ACTIVITY_ARN',
            Value: `${activityArn}`,
          },
          {
            Name: 'CLUSTER_ENV',
            Value: `${config.clusterEnv}`,
          },
          {
            Name: 'AWS_DEFAULT_REGION',
            Value: `${config.awsRegion}`,
          },
          {
            Name: 'AWS_ACCOUNT_ID',
            Value: `${config.awsAccountId}`,
          },
          {
            Name: 'SANDBOX_ID',
            Value: `${config.sandboxId}`,
          },
          {
            Name: 'BATCH',
            Value: 'true',
          },
          {
            Name: 'DOMAIN_NAME',
            Value: `${config.domainName}`,
          },
        ],
        ResourceRequirements: [
          {
            Type: 'VCPU',
            Value: `${parseFloat(cpus) - DATADOG_VCPU}`,
          },
          {
            Type: 'MEMORY',
            Value: `${parseFloat(mem) - DATADOG_MEMORY}`,
          },
        ],
      },
    },
    Catch: [
      {
        ErrorEquals: ['States.ALL'],
        ResultPath: '$.error-info',
        Next: step.XNextOnCatch || step.Next,
      },
    ],
  };
};

module.exports = submitBatchJob;
