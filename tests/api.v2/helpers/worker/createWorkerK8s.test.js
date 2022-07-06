
const k8s = require('@kubernetes/client-node');
const fake = require('../../../test-utils/constants');

jest.mock('@kubernetes/client-node');

const runningWorker = {
  metadata: {
    name: 'worker-1',
    creationTimestamp: '2022-04-29T07:48:47.000Z',
  },
  status: {
    phase: 'Running',
  },
};
const pendingWorker = {
  metadata: {
    name: 'worker-2',
    creationTimestamp: '2022-04-29T07:48:47.000Z',
  },
  status: {
    phase: 'Pending',
  },
};

const buildWorkerResponse = (workers) => ({
  body: {
    items: workers,
  },
});
const deleteNamespacedPod = jest.fn();
const patchNamespacedPod = jest.fn();
const listNamespacedPod = jest.fn(() => buildWorkerResponse([]));
const mockApi = {
  deleteNamespacedPod,
  patchNamespacedPod,
  listNamespacedPod,
};

k8s.KubeConfig.mockImplementation(() => {
  console.debug('mocking the constructor');
  return {
    loadFromDefault: jest.fn(),
    makeApiClient: (() => mockApi),
  };
});

const createWorkerK8s = require('../../../../src/api.v2/helpers/worker/workSubmit/createWorkerK8s');


describe('tests for the pipeline-assign service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the current worker if already assigned', async () => {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sApi.listNamespacedPod.mockReturnValueOnce(buildWorkerResponse([runningWorker]));
    const req = {
      workRequest: {
        experimentId: fake.EXPERIMENT_ID,
      },
    };

    const { name, creationTimestamp, phase } = await createWorkerK8s(req);

    const worker = runningWorker;
    expect(name).toEqual(worker.metadata.name);
    expect(creationTimestamp).toEqual(worker.metadata.creationTimestamp);
    expect(phase).toEqual(worker.status.phase);
    expect(listNamespacedPod).toHaveBeenCalledTimes(1);
  });

  it('returns running worker if available', async () => {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sApi.listNamespacedPod.mockReturnValueOnce(buildWorkerResponse([]));
    k8sApi.listNamespacedPod.mockReturnValueOnce(buildWorkerResponse([runningWorker, runningWorker]));
    const req = {
      workRequest: {
        experimentId: fake.EXPERIMENT_ID,
      },
    };

    const { name, creationTimestamp, phase } = await createWorkerK8s(req);

    const worker = runningWorker;
    expect(name).toEqual(worker.metadata.name);
    expect(creationTimestamp).toEqual(worker.metadata.creationTimestamp);
    expect(phase).toEqual(worker.status.phase);
  });

  it('returns pending worker if no running is available', async () => {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sApi.listNamespacedPod.mockReturnValueOnce(buildWorkerResponse([]));
    k8sApi.listNamespacedPod.mockReturnValueOnce(buildWorkerResponse([]));
    k8sApi.listNamespacedPod.mockReturnValueOnce(buildWorkerResponse([]));
    k8sApi.listNamespacedPod.mockReturnValueOnce(buildWorkerResponse([pendingWorker]));
    const req = {
      workRequest: {
        experimentId: fake.EXPERIMENT_ID,
      },
    };

    const { name, creationTimestamp, phase } = await createWorkerK8s(req);

    const worker = pendingWorker;
    expect(name).toEqual(worker.metadata.name);
    expect(creationTimestamp).toEqual(worker.metadata.creationTimestamp);
    expect(phase).toEqual(worker.status.phase);
  });

  it('returns a worker if two workers are assigned', async () => {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sApi.listNamespacedPod.mockReturnValue(buildWorkerResponse([runningWorker, runningWorker]));
    const req = {
      workRequest: {
        experimentId: fake.EXPERIMENT_ID,
      },
    };

    const { name, creationTimestamp, phase } = await createWorkerK8s(req);

    const worker = runningWorker;
    expect(name).toEqual(worker.metadata.name);
    expect(creationTimestamp).toEqual(worker.metadata.creationTimestamp);
    expect(phase).toEqual(worker.status.phase);
  });

  it('throws exception if no workers are available', async () => {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    k8sApi.listNamespacedPod.mockReturnValue(buildWorkerResponse([]));
    const req = {
      workRequest: {
        experimentId: fake.EXPERIMENT_ID,
      },
    };

    await expect(createWorkerK8s(req)).rejects.toThrow();
  });

  it('throws exception on invalid message', async () => {
    const req = {};

    await expect(createWorkerK8s(req)).rejects.toThrow();
  });
});
