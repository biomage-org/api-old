const Plot = require('../../api.v2/model/Plot');
const getLogger = require('../getLogger');
const events = require('./events');

const logger = getLogger('[invalidatePlotsForEvent] - ');

const plots = {
  CATEGORICAL_EMBEDDING: {
    plotId: 'embeddingCategoricalMain',
    keys: ['selectedSample', 'selectedCellSet'],
  },
  FREQUENCY_PLOT: {
    plotId: 'frequencyPlotMain',
    keys: ['xAxisGrouping', 'proportionGrouping'],
  },
  TRAJECTORY_ANALYSIS: {
    plotId: 'trajectoryAnalysisMain',
    keys: ['selectedNodes'],
  },
  CONTINUOUS_EMBEDDING: {
    plotId: 'embeddingContinuousMain',
    keys: ['selectedSample'],
  },
  MARKER_HEATMAP: {
    plotId: 'markerHeatmapPlotMain',
    keys: ['selectedPoints', 'selectedCellSet', 'selectedTracks', 'groupedTracks'],
  },
  CUSTOM_HEATMAP: {
    plotId: 'heatmapPlotMain',
    keys: ['selectedPoints', 'selectedCellSet', 'selectedTracks', 'groupedTracks'],
  },
  VIOLIN_PLOT: {
    plotIdMatcher: 'ViolinMain%',
    keys: ['selectedPoints', 'selectedCellSet'],
  },
  // '// ViolinMain-0:',
  DOT_PLOT: {
    plotId: 'dotPlotMain',
    keys: ['selectedPoints', 'selectedCellSet'],
  },
  NORMALIZED_MATRIX: {
    plotId: 'normalized-matrix',
    keys: ['sample', 'louvain', 'metadata', 'scratchpad'],
  },
  VOLCANO_PLOT: {
    plotId: 'volcanoPlotMain',
    keys: ['cellSet', 'compareWith', 'basis'],
  },
};

const invalidateMatchingPlots = async (experimentId, { plotIdMatcher, keys }) => (
  await new Plot().invalidateAttributesForMatches(experimentId, plotIdMatcher, keys)
);

const invalidatePlot = async (experimentId, { plotId, keys }) => {
  const updatedConfig = await new Plot().invalidateAttributes(experimentId, plotId, keys);

  return { plotId, updatedConfig };
};

const invalidateCategoricalEmbedding = async (experimentId) => (
  await invalidatePlot(experimentId, plots.CATEGORICAL_EMBEDDING)
);

const invalidateFrequencyPlot = async (experimentId) => (
  await invalidatePlot(experimentId, plots.FREQUENCY_PLOT)
);

const invalidateTrajectoryAnalysis = async (experimentId) => (
  await invalidatePlot(experimentId, plots.TRAJECTORY_ANALYSIS)
);

const invalidateContinuousEmbedding = async (experimentId) => (
  await invalidatePlot(experimentId, plots.CONTINUOUS_EMBEDDING)
);

const invalidateMarkerHeatmapPlot = async (experimentId) => (
  await invalidatePlot(experimentId, plots.MARKER_HEATMAP)
);

const invalidateCustomHeatmapPlot = async (experimentId) => (
  await invalidatePlot(experimentId, plots.CUSTOM_HEATMAP)
);

const invalidateViolinPlot = async (experimentId) => (
  await invalidateMatchingPlots(experimentId, plots.VIOLIN_PLOT)
);

const invalidateDotPlot = async (experimentId) => (
  await invalidatePlot(experimentId, plots.DOT_PLOT)
);

const invalidateNormalizedMatrix = async (experimentId) => (
  await invalidatePlot(experimentId, plots.NORMALIZED_MATRIX)
);

const invalidateVolcanoPlot = async (experimentId) => (
  await invalidatePlot(experimentId, plots.VOLCANO_PLOT)
);

const cellSetsChangingActions = [
  invalidateCategoricalEmbedding,
  invalidateFrequencyPlot,
  invalidateContinuousEmbedding,
  invalidateMarkerHeatmapPlot,
  invalidateCustomHeatmapPlot,
  invalidateViolinPlot,
  invalidateDotPlot,
  invalidateNormalizedMatrix,
  invalidateVolcanoPlot,
];

const configInvalidatorsByEvent = {
  [events.CELL_SETS_MODIFIED]: async (experimentId) => (
    // return result flattened because violin returns an array with configs
    // so we want each config to be together
    await Promise.all(
      cellSetsChangingActions.map((func) => func(experimentId)),
    )).flat(),
  [events.EMBEDDING_MODIFIED]: async (experimentId) => (
    await Promise.all([invalidateTrajectoryAnalysis(experimentId)])
  ),
};

const invalidatePlotsForEvent = async (experimentId, event, sockets) => {
  logger.log(`Invalidating for event ${event}`);
  const updatedConfigs = await configInvalidatorsByEvent[event](experimentId);

  const update = {
    type: 'PlotConfigRefresh',
    updatedConfigs,
  };

  sockets.emit(`ExperimentUpdates-${experimentId}`, update);
  logger.log(`Finished invalidating for event ${event}`);
};

module.exports = invalidatePlotsForEvent;