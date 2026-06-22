const { PrismaClient } = require('@prisma/client');
const { RandomForestClassifier } = require('ml-random-forest');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, '../../data');
const MODEL_PATHS = [
  path.join(DATA_DIR, 'model.json'),
  path.join(DATA_DIR, 'ml-model.json'),
];

const MIN_QUERY_LOGS_FOR_AUTO_TRAIN = 50;

class MLManager {
  constructor() {
    this.model = null;
    this.stats = {
      success: false,
      recordCount: 0,
      accuracy: null,
      performanceRecords: 0,
      syntaxRecords: 0,
      logicRecords: 0,
      unknownRecords: 0,
      confusionMatrix: null,
    };
    this.initialized = false;
    this.initializing = null;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = this._boot();
    await this.initializing;
    this.initializing = null;
    this.initialized = true;
  }

  async _boot() {
    await this.loadStatsFromDB();
    const loaded = this.loadModelFromDisk();

    if (loaded) return;

    const totalRecords = await prisma.queryLog.count();
    logger.info(`No ML model on disk. QueryLog count: ${totalRecords}`);

    if (totalRecords > MIN_QUERY_LOGS_FOR_AUTO_TRAIN) {
      logger.info('Auto-training ML model from database (cloud recovery)...');
      await this.trainModel();
      return;
    }

    if (this.stats.performanceRecords >= 2) {
      logger.info('Auto-training ML model from Performance records...');
      await this.trainModel();
      return;
    }

    logger.warn('Not enough QueryLog records to auto-train ML model');
  }

  getModelPath() {
    return MODEL_PATHS.find((p) => fs.existsSync(p)) || MODEL_PATHS[0];
  }

  getPrimaryModelPath() {
    return MODEL_PATHS[0];
  }

  loadModelFromDisk() {
    try {
      const modelPath = this.getModelPath();
      if (!fs.existsSync(modelPath)) {
        logger.warn('No saved ML model found on disk');
        return false;
      }

      const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      this.model = RandomForestClassifier.load(modelJson);
      logger.info(`ML model loaded from disk (${path.basename(modelPath)})`);
      return true;
    } catch (error) {
      logger.error('Failed to load ML model from disk:', error.message);
      for (const modelPath of MODEL_PATHS) {
        try {
          if (fs.existsSync(modelPath)) fs.unlinkSync(modelPath);
        } catch {
          /* ignore */
        }
      }
      this.model = null;
      return false;
    }
  }

  saveModelToDisk() {
    try {
      if (!this.model) return;
      const targetPath = this.getPrimaryModelPath();
      fs.writeFileSync(targetPath, JSON.stringify(this.model.toJSON()));
      logger.info(`ML model saved to ${path.basename(targetPath)}`);
    } catch (error) {
      logger.error('Failed to save ML model to disk:', error.message);
    }
  }

  async loadStatsFromDB() {
    try {
      const dbStats = await prisma.mLModelStats.findFirst();
      if (!dbStats) {
        logger.warn('No existing ML stats found in database');
        return;
      }

      this.stats = {
        success: dbStats.success,
        recordCount: dbStats.recordCount || 0,
        accuracy: dbStats.accuracy,
        performanceRecords: dbStats.performanceRecords || 0,
        syntaxRecords: dbStats.syntaxRecords || 0,
        logicRecords: dbStats.logicRecords || 0,
        unknownRecords: dbStats.unknownRecords || 0,
        confusionMatrix: dbStats.confusionMatrix,
        message: dbStats.message,
      };
      logger.info('ML stats loaded from database');
    } catch (error) {
      logger.error('Failed to load ML stats from database:', error.message);
    }
  }

  async saveStatsToDB(stats) {
    try {
      const existingStats = await prisma.mLModelStats.findFirst();
      const payload = {
        success: stats.success,
        accuracy: stats.accuracy,
        recordCount: stats.recordCount,
        performanceRecords: stats.performanceRecords,
        syntaxRecords: stats.syntaxRecords,
        logicRecords: stats.logicRecords,
        unknownRecords: stats.unknownRecords,
        confusionMatrix: stats.confusionMatrix,
        message: stats.message,
      };

      if (existingStats) {
        await prisma.mLModelStats.update({ where: { id: existingStats.id }, data: payload });
      } else {
        await prisma.mLModelStats.create({ data: payload });
      }
      logger.info('ML stats saved to database');
    } catch (error) {
      logger.error('Failed to save ML stats to database:', error.message);
    }
  }

  countNodes(plan, targetTypes) {
    let count = 0;
    if (plan?.['Node Type']) {
      for (const type of targetTypes) {
        if (plan['Node Type'].includes(type)) count++;
      }
    }
    if (plan?.Plans) {
      for (const child of plan.Plans) {
        count += this.countNodes(child, targetTypes);
      }
    }
    return count;
  }

  encodeErrorCategory(category) {
    switch (category) {
      case 'Syntax':
        return 0;
      case 'Logic':
        return 1;
      case 'Performance':
        return 2;
      default:
        return 3;
    }
  }

  extractFeatures(explainPlan, log) {
    const plan = explainPlan?.Plan || null;
    if (!plan) {
      return [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        log?.isSyntaxValid ? 1 : 0,
        log?.joinTypeCount || 0,
        this.encodeErrorCategory(log?.errorCategory),
      ];
    }

    const totalCost = plan['Total Cost'] || 0;
    const startupCost = plan['Startup Cost'] || 0;
    const planRows = plan['Plan Rows'] || 0;
    const actualRows = plan['Actual Rows'] || 0;
    const seqScanCount = this.countNodes(plan, ['Seq Scan']);
    const indexScanCount = this.countNodes(plan, ['Index Scan']);
    const hashJoinCount = this.countNodes(plan, ['Hash Join']);
    const nestedLoopCount = this.countNodes(plan, ['Nested Loop']);
    const aggregateCount = this.countNodes(plan, ['Aggregate']);
    const filterFactor = planRows > 0 ? totalCost / planRows : 0;

    return [
      totalCost,
      startupCost,
      planRows,
      actualRows,
      seqScanCount,
      indexScanCount,
      hashJoinCount,
      nestedLoopCount,
      aggregateCount,
      filterFactor,
      log?.isSyntaxValid ? 1 : 0,
      log?.joinTypeCount || 0,
      this.encodeErrorCategory(log?.errorCategory),
    ];
  }

  async trainModel() {
    try {
      logger.info('Starting ML model training...');

      const totalRecords = await prisma.queryLog.count();
      const performanceRecords = await prisma.queryLog.count({
        where: { errorCategory: 'Performance' },
      });
      const syntaxRecords = await prisma.queryLog.count({
        where: { errorCategory: 'Syntax' },
      });
      const logicRecords = await prisma.queryLog.count({
        where: { errorCategory: 'Logic' },
      });
      const unknownRecords = await prisma.queryLog.count({
        where: {
          NOT: { errorCategory: { in: ['Performance', 'Syntax', 'Logic'] } },
        },
      });

      logger.info(
        `Training data — total: ${totalRecords}, performance: ${performanceRecords}, syntax: ${syntaxRecords}, logic: ${logicRecords}, unknown: ${unknownRecords}`
      );

      const trainingData = await prisma.queryLog.findMany({
        where: {
          errorCategory: 'Performance',
          explainPlan: { not: null },
        },
      });

      if (trainingData.length < 2) {
        this.stats = {
          success: false,
          message: 'Not enough Performance records to train model (minimum 2 needed)',
          recordCount: 0,
          performanceRecords,
          syntaxRecords,
          logicRecords,
          unknownRecords,
          accuracy: null,
          confusionMatrix: null,
        };
        await this.saveStatsToDB(this.stats);
        return this.stats;
      }

      const X = [];
      const y = [];

      for (const log of trainingData) {
        X.push(this.extractFeatures(log.explainPlan, log));
        y.push(log.isSlow ? 1 : 0);
      }

      this.model = new RandomForestClassifier({ nEstimators: 100, maxDepth: 10 });
      this.model.train(X, y);

      let correct = 0;
      let truePos = 0;
      let trueNeg = 0;
      let falsePos = 0;
      let falseNeg = 0;

      for (let i = 0; i < X.length; i++) {
        const prediction = this.model.predict([X[i]])[0];
        const actual = y[i];
        if (prediction === actual) correct++;
        if (prediction === 1 && actual === 1) truePos++;
        else if (prediction === 1 && actual === 0) falsePos++;
        else if (prediction === 0 && actual === 1) falseNeg++;
        else if (prediction === 0 && actual === 0) trueNeg++;
      }

      const accuracy = Math.round((correct / X.length) * 10000) / 100;

      this.stats = {
        success: true,
        recordCount: trainingData.length,
        accuracy,
        performanceRecords,
        syntaxRecords,
        logicRecords,
        unknownRecords,
        confusionMatrix: {
          truePositive: truePos,
          trueNegative: trueNeg,
          falsePositive: falsePos,
          falseNegative: falseNeg,
        },
      };

      logger.info(`ML model trained — accuracy: ${accuracy}%, records: ${trainingData.length}`);
      this.saveModelToDisk();
      await this.saveStatsToDB(this.stats);
      return this.stats;
    } catch (error) {
      logger.error('ML training error:', error.message);
      this.model = null;
      this.stats = {
        success: false,
        message: error.message,
        recordCount: 0,
        accuracy: null,
        performanceRecords: 0,
        syntaxRecords: 0,
        logicRecords: 0,
        unknownRecords: 0,
        confusionMatrix: null,
      };
      await this.saveStatsToDB(this.stats);
      return this.stats;
    }
  }

  predict(explainPlan, log) {
    if (!this.model) {
      logger.warn('No trained model available for prediction');
      return { probability: 0.5, prediction: 'UNKNOWN', advice: 'ML model not trained yet' };
    }

    try {
      const features = this.extractFeatures(explainPlan, log);
      let isSlowProb = 0.5;

      if (typeof this.model.predictProbability === 'function') {
        const probabilities = this.model.predictProbability([features], 1);
        isSlowProb = probabilities[0] || 0.5;
      } else if (typeof this.model.predict === 'function') {
        const predictionResult = this.model.predict([features])[0];
        isSlowProb = predictionResult === 1 ? 0.75 : 0.25;
      }

      const prediction = isSlowProb > 0.5 ? 'HIGH RISK' : 'LOW RISK';
      const advice =
        prediction === 'HIGH RISK'
          ? 'ML predicts this query is HIGH RISK'
          : 'ML predicts this query is LOW RISK';

      return {
        probability: Math.round(isSlowProb * 10000) / 100,
        prediction,
        advice,
      };
    } catch (error) {
      logger.error('ML prediction error:', error.message);
      return { probability: 0.5, prediction: 'ERROR', advice: 'Failed to make prediction' };
    }
  }

  getStats() {
    return this.stats;
  }
}

const mlManager = new MLManager();

module.exports = mlManager;
