jest.mock('../../../src/api.v2/helpers/cognito/getAwsPoolId');
const k8s = require('@kubernetes/client-node');



jest.mock('@kubernetes/client-node');


const deleteNamespacedPod = jest.fn();
const patchNamespacedPod = jest.fn();
const listNamespacedPod = jest.fn();
const mockApi = {
  deleteNamespacedPod,
  patchNamespacedPod,
  listNamespacedPod,
};

k8s.KubeConfig.mockImplementation(() => ({
  loadFromDefault: jest.fn(),
  makeApiClient: (() => mockApi),
}));


const removeRequest = {
  reason: 'BackOff',
  message: 'Back-off restarting failed container',
  firstTimestamp: '2021-10-31T11:09:44Z',
  lastTimestamp: '2021-10-31T11:13:28Z',
  type: 'Warning',
  kind: 'Pod',
  namespace: 'pipeline-default',
  name: 'pipeline-6f87dbcb55-wzvnk',
  labels: JSON.stringify({
    activityId: 'wrong',
    'eks.amazonaws.com/fargate-profile': 'pipeline-default',
    'pod-template-hash': '6f87dbcb55',
    sandboxId: 'default',
    type: 'pipeline',
  }),
  annotations: JSON.stringify({
    CapacityProvisioned: '1vCPU 5GB',
    Logging: 'LoggingDisabled: LOGGING_CONFIGMAP_NOT_FOUND',
  }),
};

const express = require('express');
const request = require('supertest');
const expressLoader = require('../../../src/loaders/express');

describe('tests for kubernetes route', () => {
  let app = null;

  beforeEach(async () => {
    const mockApp = await expressLoader(express());
    app = mockApp.app;
  });

  it('sending a remove request works', async (done) => {
    request(app)
      .post('/v2/kubernetesEvents')
      .send(removeRequest)
      .expect(200)
      .end((err) => {
        if (err) {
          return done(err);
        }

        return done();
      });
  });

  it('sending an empty request works', async (done) => {
    request(app)
      .post('/v2/kubernetesEvents')
      .send(undefined)
      .expect(500)
      .end((err) => done(err));
  });
});
