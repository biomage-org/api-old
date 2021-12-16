const express = require('express');
const request = require('supertest');
const expressLoader = require('../../../src/loaders/express');


const removeRequest = {
  metadata: {
    name: 'pipeline-6f87dbcb55-wzvnk.16b31901b952f1ec',
    namespace: 'pipeline-default',
    uid: 'cf831e5f-29bf-4750-ae9a-8bbe4d1f93fd',
    resourceVersion: '226149137',
    creationTimestamp: '2021-10-31T11:09:44Z',
    managedFields: [[Object]],
  },
  reason: 'BackOff',
  message: 'Back-off restarting failed container',
  source: {
    component: 'kubelet',
    host: 'fargate-ip-192-168-180-35.eu-west-1.compute.internal',
  },
  firstTimestamp: '2021-10-31T11:09:44Z',
  lastTimestamp: '2021-10-31T11:13:28Z',
  count: 16,
  type: 'Warning',
  eventTime: null,
  reportingComponent: '',
  reportingInstance: '',
  involvedObject: {
    kind: 'Pod',
    namespace: 'pipeline-default',
    name: 'pipeline-6f87dbcb55-wzvnk',
    uid: 'd204be1b-6626-4320-8bae-3b203aff9562',
    apiVersion: 'v1',
    resourceVersion: '226145375',
    fieldPath: 'spec.containers{pipeline}',
    labels: {
      activityId: 'wrong',
      'eks.amazonaws.com/fargate-profile': 'pipeline-default',
      'pod-template-hash': '6f87dbcb55',
      sandboxId: 'default',
      type: 'pipeline',
    },
    annotations: {
      CapacityProvisioned: '1vCPU 5GB',
      Logging: 'LoggingDisabled: LOGGING_CONFIGMAP_NOT_FOUND',
    },
  },
};

describe('tests for experiment route', () => {
  let app = null;

  beforeEach(async () => {
    const mockApp = await expressLoader(express());
    app = mockApp.app;
  });

  afterEach(() => {
    /**
     * Most important since b'coz of caching, the mocked implementations sometimes does not reset
     */
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('sending a remove request works', async (done) => {
    request(app)
      .post('/v1/kubernetesEvents')
      .send(removeRequest)
      .expect(200)
      .end((err) => {
        if (err) {
          return done(err);
        }

        return done();
      });
  });
});