const mlManager = require('./mlManager');

const initializeMLService = () => mlManager.initialize();

const trainModel = () => mlManager.trainModel();
const predict = (explainPlan, log) => mlManager.predict(explainPlan, log);
const getStats = () => mlManager.getStats();
const extractFeatures = (explainPlan, log) => mlManager.extractFeatures(explainPlan, log);

module.exports = {
  extractFeatures,
  trainModel,
  predict,
  getStats,
  initializeMLService,
};
