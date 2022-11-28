const AWSMock = require('aws-sdk-mock');
const _ = require('lodash');
const AWS = require('../../../../src/utils/requireAWS');
const { getQcPipelineStepNames } = require('../../../../src/api.v2/helpers/pipeline/pipelineConstruct/skeletons');

const Experiment = require('../../../../src/api.v2/model/Experiment');
const ExperimentExecution = require('../../../../src/api.v2/model/ExperimentExecution');

const experimentInstance = new Experiment();
const experimentExecutionInstance = new ExperimentExecution();

const mockStepNames = getQcPipelineStepNames();

jest.mock('../../../../src/api.v2/helpers/pipeline/batch/terminateJobs');
jest.mock('../../../../src/api.v2/helpers/pipeline/batch/listActiveJobs');
jest.mock('../../../../src/api.v2/helpers/pipeline/hooks/podCleanup');

const { createQCPipeline, createGem2SPipeline } = jest.requireActual('../../../../src/api.v2/helpers/pipeline/pipelineConstruct');

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: () => Buffer.from('asdfg'),
}));

jest.mock('../../../../src/api.v2/helpers/pipeline/pipelineConstruct/qcHelpers', () => ({
  getQcStepsToRun: jest.fn(() => mockStepNames),
}));

jest.mock('../../../../src/utils/asyncTimer');

jest.mock('../../../../src/api.v2/model/Experiment');
jest.mock('../../../../src/api.v2/model/ExperimentExecution');

const mockExperimentRow = {
  samplesOrder: ['oneSample', 'otherSample'],
  processingConfig: {
    doubletScores: {
      oneSample: {
        enabled: true,
        filterSettings: {
          oneSetting: 1,
        },
        defaultFilterSettings: {
          oneSetting: 1,
        },
      },
    },
  },
};

describe('test for pipeline services', () => {
  afterEach(() => {
    AWSMock.restore('EKS');
    AWSMock.restore('StepFunctions');
  });

  const mockCluster = {
    cluster: {
      name: 'biomage-test',
      endpoint: 'https://test-endpoint.me/fgh',
      certificateAuthority: {
        data: 'AAAAAAAAAAA',
      },
    },
  };

  const processingConfigUpdate = [
    {
      name: 'doubletScores',
      body: {
        oneSample: {
          defaultFilterSettings: {
            oneSetting: 1,
          },
          filterSettings: {
            oneSetting: 7,
          },
        },
        otherSample: {
          filterSettings: {
            oneSetting: 15,
          },
        },
      },
    },
  ];

  const taskParams = {
    projectId: 'test-project',
    experimentName: 'valerio-massala',
    organism: null,
    input: { type: '10x' },
    sampleIds: ['3af6b6bb-a1aa-4375-9c2c-c112bada56ca'],
    sampleNames: ['sample-1'],
  };

  it('Create QC pipeline works', async () => {
    const describeClusterSpy = jest.fn((x) => x);
    AWSMock.mock('EKS', 'describeCluster', (params, callback) => {
      describeClusterSpy(params);
      callback(null, mockCluster);
    });

    const createStateMachineSpy = jest.fn(
      (stateMachineObject) => _.omit(stateMachineObject, ['definition', 'image']),
    );

    AWSMock.mock('StepFunctions', 'createStateMachine', (params, callback) => {
      createStateMachineSpy(params);
      callback(null, { stateMachineArn: 'test-machine' });
    });

    const createActivitySpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'createActivity', (params, callback) => {
      createActivitySpy(params);
      callback(null, { activityArn: 'test-actvitiy' });
    });

    const startExecutionSpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'startExecution', (params, callback) => {
      startExecutionSpy(params);
      callback(null, { executionArn: 'test-machine' });
    });

    experimentInstance.findById.mockReturnValueOnce(
      { first: () => Promise.resolve(mockExperimentRow) },
    );

    await createQCPipeline('testExperimentId', processingConfigUpdate);
    expect(describeClusterSpy).toMatchSnapshot();

    expect(createStateMachineSpy.mock.results).toMatchSnapshot();

    expect(experimentInstance.findById).toHaveBeenCalledWith('testExperimentId');
    expect(experimentExecutionInstance.upsert.mock.calls).toMatchSnapshot();

    expect(createActivitySpy).toHaveBeenCalled();
    expect(startExecutionSpy).toHaveBeenCalled();
    expect(startExecutionSpy.mock.results).toMatchSnapshot();
  });

  it('Parses QC processingConfig correctly', async () => {
    AWSMock.setSDKInstance(AWS);

    AWSMock.mock('EKS', 'describeCluster', (params, callback) => {
      callback(null, mockCluster);
    });

    const createStateMachineSpy = jest.fn(
      // eslint-disable-next-line consistent-return
      (stateMachineObject) => (_.cloneDeepWith(JSON.parse(stateMachineObject.definition), (o) => {
        if (_.isObject(o) && o.image) {
          return {
            ...o,
            image: 'MOCK_IMAGE_PATH',
          };
        }

        if (_.isObject(o) && o.ref) {
          return {
            ...o,
            ref: 'MOCK_REF_PATH',
          };
        }
      })),
    );

    AWSMock.mock('StepFunctions', 'createStateMachine', (params, callback) => {
      createStateMachineSpy(params);
      callback(null, { stateMachineArn: 'test-machine' });
    });

    const createActivitySpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'createActivity', (params, callback) => {
      createActivitySpy(params);
      callback(null, { activityArn: 'test-actvitiy' });
    });

    AWSMock.mock('StepFunctions', 'startExecution', (params, callback) => {
      callback(null, { executionArn: 'test-machine' });
    });

    experimentInstance.findById.mockReturnValueOnce(
      { first: () => Promise.resolve(mockExperimentRow) },
    );

    await createQCPipeline('testExperimentId', processingConfigUpdate);
    expect(createStateMachineSpy.mock.results).toMatchSnapshot();
  });

  it('QC Pipeline is updated instead of created if an error is thrown.', async () => {
    AWSMock.setSDKInstance(AWS);

    const describeClusterSpy = jest.fn((x) => x);
    AWSMock.mock('EKS', 'describeCluster', (params, callback) => {
      describeClusterSpy(params);
      callback(null, mockCluster);
    });

    const createStateMachineSpy = jest.fn((stateMachineObject) => _.omit(stateMachineObject, 'definition'));
    AWSMock.mock('StepFunctions', 'createStateMachine', (params, callback) => {
      createStateMachineSpy(params);
      callback({ code: 'StateMachineAlreadyExists' }, null);
    });

    const updateStateMachineSpy = jest.fn((stateMachineObject) => _.omit(stateMachineObject, 'definition'));
    AWSMock.mock('StepFunctions', 'updateStateMachine', (params, callback) => {
      updateStateMachineSpy(params);
      callback(null, { stateMachineArn: 'test-machine' });
    });

    const createActivitySpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'createActivity', (params, callback) => {
      createActivitySpy(params);
      callback(null, { activityArn: 'test-actvitiy' });
    });

    const startExecutionSpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'startExecution', (params, callback) => {
      startExecutionSpy(params);
      callback(null, { executionArn: 'test-execution' });
    });

    experimentInstance.findById.mockReturnValueOnce(
      { first: () => Promise.resolve(mockExperimentRow) },
    );

    createQCPipeline.waitForDefinitionToPropagate = () => true;

    await createQCPipeline('testExperimentId', processingConfigUpdate);

    expect(describeClusterSpy).toMatchSnapshot();
    expect(createStateMachineSpy.mock.results).toMatchSnapshot();

    expect(updateStateMachineSpy).toHaveBeenCalled();
    expect(updateStateMachineSpy.mock.results).toMatchSnapshot();

    expect(createActivitySpy).toHaveBeenCalled();
    expect(startExecutionSpy).toHaveBeenCalled();
    expect(startExecutionSpy.mock.results).toMatchSnapshot();
  });

  it('Create Gem2s pipeline works', async () => {
    AWSMock.setSDKInstance(AWS);

    const describeClusterSpy = jest.fn((x) => x);
    AWSMock.mock('EKS', 'describeCluster', (params, callback) => {
      describeClusterSpy(params);
      callback(null, mockCluster);
    });

    const createStateMachineSpy = jest.fn(
      (stateMachineObject) => _.omit(stateMachineObject, ['definition', 'image']),
    );

    AWSMock.mock('StepFunctions', 'createStateMachine', (params, callback) => {
      createStateMachineSpy(params);
      callback(null, { stateMachineArn: 'test-machine' });
    });

    const createActivitySpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'createActivity', (params, callback) => {
      createActivitySpy(params);
      callback(null, { activityArn: 'test-actvitiy' });
    });

    const startExecutionSpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'startExecution', (params, callback) => {
      startExecutionSpy(params);
      callback(null, { executionArn: 'test-machine' });
    });

    experimentInstance.findById.mockReturnValueOnce(
      { first: () => Promise.resolve(mockExperimentRow) },
    );

    await createGem2SPipeline('testExperimentId', taskParams);
    expect(describeClusterSpy).toMatchSnapshot();

    expect(createStateMachineSpy.mock.results).toMatchSnapshot();

    expect(createActivitySpy).toHaveBeenCalled();
    expect(startExecutionSpy).toHaveBeenCalled();
    expect(startExecutionSpy.mock.results).toMatchSnapshot();
  });


  it('Gem2s Pipeline is updated instead of created if an error is thrown.', async () => {
    AWSMock.setSDKInstance(AWS);

    const describeClusterSpy = jest.fn((x) => x);
    AWSMock.mock('EKS', 'describeCluster', (params, callback) => {
      describeClusterSpy(params);
      callback(null, mockCluster);
    });

    const createStateMachineSpy = jest.fn((stateMachineObject) => _.omit(stateMachineObject, 'definition'));
    AWSMock.mock('StepFunctions', 'createStateMachine', (params, callback) => {
      createStateMachineSpy(params);
      callback({ code: 'StateMachineAlreadyExists' }, null);
    });

    const updateStateMachineSpy = jest.fn((stateMachineObject) => _.omit(stateMachineObject, 'definition'));
    AWSMock.mock('StepFunctions', 'updateStateMachine', (params, callback) => {
      updateStateMachineSpy(params);
      callback(null, { stateMachineArn: 'test-machine' });
    });

    const createActivitySpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'createActivity', (params, callback) => {
      createActivitySpy(params);
      callback(null, { activityArn: 'test-actvitiy' });
    });

    const startExecutionSpy = jest.fn((x) => x);
    AWSMock.mock('StepFunctions', 'startExecution', (params, callback) => {
      startExecutionSpy(params);
      callback(null, { executionArn: 'test-execution' });
    });

    experimentInstance.findById.mockReturnValueOnce(
      { first: () => Promise.resolve(mockExperimentRow) },
    );

    createGem2SPipeline.waitForDefinitionToPropagate = () => true;

    await createGem2SPipeline('testExperimentId', taskParams);

    expect(describeClusterSpy).toMatchSnapshot();
    expect(createStateMachineSpy.mock.results).toMatchSnapshot();

    expect(updateStateMachineSpy).toHaveBeenCalled();
    expect(updateStateMachineSpy.mock.results).toMatchSnapshot();

    expect(createActivitySpy).toHaveBeenCalled();
    expect(startExecutionSpy).toHaveBeenCalled();
    expect(startExecutionSpy.mock.results).toMatchSnapshot();
  });
});
