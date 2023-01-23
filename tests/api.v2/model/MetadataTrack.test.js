// @ts-nocheck
const { mockSqlClient, mockTrx } = require('../mocks/getMockSqlClient')();
const fake = require('../../test-utils/constants');


jest.mock('../../../src/sql/sqlClient', () => ({
  get: jest.fn(() => mockSqlClient),
}));

const MetadataTrack = require('../../../src/api.v2/model/MetadataTrack');
const BasicModel = require('../../../src/api.v2/model/BasicModel');

const tableNames = require('../../../src/api.v2/model/tableNames');

describe('model/userAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createNewMetadataTrack works correctly when there are samples', async () => {
    const experimentId = 'mockExperimentId';
    const key = 'mockKey';

    mockSqlClient.where.mockReturnValueOnce([{ id: 'sampleId1' }, { id: 'sampleId2' }, { id: 'sampleId3' }, { id: 'sampleId4' }]);
    mockTrx.into.mockReturnValueOnce([{ id: 'metadataTrackId1' }, { id: 'metadataTrackId2' }]);

    await new MetadataTrack().createNewMetadataTrack(experimentId, key);

    expect(mockSqlClient.transaction).toHaveBeenCalled();

    expect(mockSqlClient.select.mock.calls).toMatchSnapshot('selectParams');
    expect(mockSqlClient.from.mock.calls).toMatchSnapshot('fromParams');
    expect(mockSqlClient.where.mock.calls).toMatchSnapshot('whereParams');

    expect(mockTrx.insert.mock.calls).toMatchSnapshot('insertParams');
    expect(mockTrx.returning.mock.calls).toMatchSnapshot('returningParams');
    expect(mockTrx.into.mock.calls).toMatchSnapshot('intoParams');
    expect(mockTrx.insert.mock.calls).toMatchSnapshot('insertParams');
    expect(mockTrx).toHaveBeenCalledWith(tableNames.SAMPLE_IN_METADATA_TRACK_MAP);
  });

  it('createNewMetadataTrack skips insert into SAMPLE_IN_METADATA_TRACK_MAP when there are no samples', async () => {
    const experimentId = 'mockExperimentId';
    const key = 'mockKey';

    mockTrx.into.mockReturnValueOnce([]);

    await new MetadataTrack().createNewMetadataTrack(experimentId, key);

    expect(mockSqlClient.transaction).toHaveBeenCalled();

    expect(mockSqlClient.select.mock.calls).toMatchSnapshot('selectParams');
    expect(mockSqlClient.from.mock.calls).toMatchSnapshot('fromParams');
    expect(mockSqlClient.where.mock.calls).toMatchSnapshot('whereParams');

    expect(mockTrx.insert.mock.calls).toMatchSnapshot('insertParams');
    expect(mockTrx.returning.mock.calls).toMatchSnapshot('returningParams');
    expect(mockTrx.into.mock.calls).toMatchSnapshot('intoParams');
    expect(mockTrx.insert.mock.calls).toMatchSnapshot('insertParams');
    expect(mockTrx).not.toHaveBeenCalledWith(tableNames.SAMPLE_IN_METADATA_TRACK_MAP);
  });

  it('patchValueForSample works correctly', async () => {
    const experimentId = 'mockExperimentId';
    const key = 'mockKey';
    const sampleId = 'mockSampleId';
    const value = 'mockValue';

    const metadataTrackId = 'mockMetadataTrackId';

    const mockFind = jest.spyOn(BasicModel.prototype, 'find')
      .mockImplementationOnce(() => Promise.resolve([{ id: metadataTrackId }]));



    await new MetadataTrack().patchValueForSample(experimentId, sampleId, key, value);

    expect(mockFind).toHaveBeenCalledWith({ experiment_id: experimentId, key });

    expect(mockSqlClient.update).toHaveBeenCalledWith({ value });
    expect(mockSqlClient.where).toHaveBeenCalledWith(
      { metadata_track_id: metadataTrackId, sample_id: sampleId },
    );
    expect(mockSqlClient.returning).toHaveBeenCalledWith(['metadata_track_id']);
  });

  it('patchValueForSample throws if the track-sample map doesn\'t exist', async () => {
    const experimentId = 'mockExperimentId';
    const key = 'mockKey';
    const sampleId = 'mockSampleId';
    const value = 'mockValue';

    const metadataTrackId = 'mockMetadataTrackId';

    // Find returns an existing experiment
    const mockFind = jest.spyOn(BasicModel.prototype, 'find')
      .mockImplementationOnce(() => Promise.resolve([{ id: metadataTrackId }]));

    // But there are no values to be updated
    mockSqlClient.returning.mockImplementationOnce(() => Promise.resolve([]));

    await expect(
      new MetadataTrack().patchValueForSample(experimentId, sampleId, key, value),
    ).rejects.toMatchSnapshot();

    expect(mockFind).toHaveBeenCalledWith({ experiment_id: experimentId, key });
  });

  it('createNewSamplesValues works correctly when experiment has metadata tracks', async () => {
    const mockExperimentId = 'mockExperimentId';
    const mockSampleIds = ['id1', 'id2'];

    mockSqlClient.where.mockImplementationOnce(() => Promise.resolve([{ id: 'track1Id' }, { id: 'track2Id' }]));

    await new MetadataTrack().createNewSamplesValues(mockExperimentId, mockSampleIds);

    expect(mockSqlClient.insert).toHaveBeenCalledWith([
      { metadata_track_id: 'track1Id', sample_id: 'id1' },
      { metadata_track_id: 'track2Id', sample_id: 'id1' },
      { metadata_track_id: 'track1Id', sample_id: 'id2' },
      { metadata_track_id: 'track2Id', sample_id: 'id2' },
    ]);
  });

  it('createNewSamplesValues doesn\'t do anything when experiment has no metadata tracks', async () => {
    const mockExperimentId = 'mockExperimentId';
    const mockSampleIds = ['id1', 'id2'];

    mockSqlClient.where.mockImplementationOnce(() => Promise.resolve([]));

    await new MetadataTrack().createNewSamplesValues(mockExperimentId, mockSampleIds);

    expect(mockSqlClient.insert).not.toHaveBeenCalled();
  });

  it('bulkUpdateMetadata works correctly', async () => {
    const metadataUpdateObject = [
      { metadataKey: 'metadata_key_1', metadataValue: 'metadata_value_1', sampleId: 'id1' },
      { metadataKey: 'metadata_key_1', metadataValue: 'metadata_value_2', sampleId: 'id2' },
      { metadataKey: 'metadata_key_2', metadataValue: 'metadata_value_4', sampleId: 'id2' }];

    // mockSqlClient.where.mockImplementationOnce((params) => {
    //   const { key } = params;
    //   if (key === 'metadata_key_1') Promise.resolve([{ id: 'metadata_key_1' }]);
    //   Promise.resolve([]);
    // });
    const mockFind = MetadataTrack.find
      .mockImplementationOnce((params) => {
        const { key } = params;
        if (key === 'metadata_key_1') {
          return Promise.resolve([{ id: 'metadata_key_1' }]);
        }
        return Promise.resolve([]);
      });

    mockSqlClient.insert.mockReturnValueOnce(1);
    await new MetadataTrack().bulkUpdateMetadata(fake.EXPERIMENT_ID, metadataUpdateObject);
    // expect(mockSqlClient.select.mock.calls).toMatchSnapshot('selectParams');
    // expect(mockSqlClient.from.mock.calls).toMatchSnapshot('fromParams');
    // expect(mockSqlClient.where.mock.calls).toMatchSnapshot('whereParams');
    // expect(mockSqlClient.insert.mock.calls).toMatchSnapshot('insertParams');
  });
});
