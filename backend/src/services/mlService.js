const { PrismaClient } = require('@prisma/client');
const { RandomForestClassifier } = require('ml-random-forest');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Paths for model and stats persistence
const MODEL_PATH = path.join(__dirname, '../../data/ml-model.json');
const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory trained model and stats
let trainedModel = null;
let trainingStats = {
  success: false,
  recordCount: 0,
  accuracy: null,
  performanceRecords: 0,
  syntaxRecords: 0,
  logicRecords: 0,
  unknownRecords: 0,
  confusionMatrix: null
};

// Save model to disk
const saveModelToDisk = () => {
  try {
    if (trainedModel) {
      const modelData = JSON.stringify(trainedModel.toJSON());
      fs.writeFileSync(MODEL_PATH, modelData);
      console.log('✅ ML model saved to disk');
    }
  } catch (error) {
    console.error('❌ Failed to save ML model to disk:', error);
  }
};

// Load model from disk
const loadModelFromDisk = () => {
  try {
    if (fs.existsSync(MODEL_PATH)) {
      const modelData = fs.readFileSync(MODEL_PATH, 'utf-8');
      const modelJson = JSON.parse(modelData);
      trainedModel = RandomForestClassifier.load(modelJson);
      
      // Debug: log model methods
      console.log('🔍 Loaded model keys:', Object.keys(trainedModel));
      console.log('🔍 predict exists:', typeof trainedModel.predict === 'function');
      console.log('🔍 predictProbability exists:', typeof trainedModel.predictProbability === 'function');
      
      console.log('✅ ML model loaded from disk');
      return true;
    }
    console.log('⚠️ No saved ML model found on disk');
    return false;
  } catch (error) {
    console.error('❌ Failed to load ML model from disk:', error);
    // Delete broken model file
    try {
      if (fs.existsSync(MODEL_PATH)) {
        fs.unlinkSync(MODEL_PATH);
      }
    } catch (unlinkErr) {
      console.error('❌ Failed to delete broken model file:', unlinkErr);
    }
    trainedModel = null;
    return false;
  }
};

// Save stats to database
const saveStatsToDB = async (stats) => {
  try {
    // Check if we already have a stats record
    const existingStats = await prisma.mLModelStats.findFirst();
    
    if (existingStats) {
      await prisma.mLModelStats.update({
        where: { id: existingStats.id },
        data: {
          success: stats.success,
          accuracy: stats.accuracy,
          recordCount: stats.recordCount,
          performanceRecords: stats.performanceRecords,
          syntaxRecords: stats.syntaxRecords,
          logicRecords: stats.logicRecords,
          unknownRecords: stats.unknownRecords,
          confusionMatrix: stats.confusionMatrix,
          message: stats.message
        }
      });
    } else {
      await prisma.mLModelStats.create({
        data: {
          success: stats.success,
          accuracy: stats.accuracy,
          recordCount: stats.recordCount,
          performanceRecords: stats.performanceRecords,
          syntaxRecords: stats.syntaxRecords,
          logicRecords: stats.logicRecords,
          unknownRecords: stats.unknownRecords,
          confusionMatrix: stats.confusionMatrix,
          message: stats.message
        }
      });
    }
    console.log('✅ ML stats saved to database');
  } catch (error) {
    console.error('❌ Failed to save ML stats to database:', error);
  }
};

// Load stats from database
const loadStatsFromDB = async () => {
  try {
    const dbStats = await prisma.mLModelStats.findFirst();
    
    if (dbStats) {
      trainingStats = {
        success: dbStats.success,
        recordCount: dbStats.recordCount || 0,
        accuracy: dbStats.accuracy,
        performanceRecords: dbStats.performanceRecords || 0,
        syntaxRecords: dbStats.syntaxRecords || 0,
        logicRecords: dbStats.logicRecords || 0,
        unknownRecords: dbStats.unknownRecords || 0,
        confusionMatrix: dbStats.confusionMatrix,
        message: dbStats.message
      };
      console.log('✅ ML stats loaded from database');
    } else {
      console.log('⚠️ No existing ML stats found in database');
    }
  } catch (error) {
    console.error('❌ Failed to load ML stats from database:', error);
  }
};

// Initialize service on load
const initializeMLService = async () => {
  await loadStatsFromDB();
  const modelLoaded = loadModelFromDisk();
  
  // Auto-train if no model exists but we have enough training records
  if (!modelLoaded && trainingStats.performanceRecords >= 2) {
    console.log('🔄 Auto-training ML model (no saved model found)...');
    await trainModel();
  } else if (!modelLoaded) {
    console.log('⚠️ Not enough training records to auto-train ML model');
  }
};

// Recursively count occurrences of node types
const countNodes = (plan, targetTypes) => {
  let count = 0;
  if (plan['Node Type']) {
    for (const type of targetTypes) {
      if (plan['Node Type'].includes(type)) {
        count++;
      }
    }
  }
  if (plan.Plans) {
    for (const child of plan.Plans) {
      count += countNodes(child, targetTypes);
    }
  }
  return count;
};

// Encode error category
const encodeErrorCategory = (category) => {
  switch (category) {
    case 'Syntax': return 0;
    case 'Logic': return 1;
    case 'Performance': return 2;
    default: return 3;
  }
};

// Extract enhanced features from EXPLAIN plan and QueryLog
const extractFeatures = (explainPlan, log) => {
  const plan = explainPlan?.Plan || null;
  if (!plan) {
    return [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      log?.isSyntaxValid ? 1 : 0,
      log?.joinTypeCount || 0,
      encodeErrorCategory(log?.errorCategory)
    ];
  }

  const totalCost = plan['Total Cost'] || 0;
  const startupCost = plan['Startup Cost'] || 0;
  const planRows = plan['Plan Rows'] || 0;
  const actualRows = plan['Actual Rows'] || 0;

  const seqScanCount = countNodes(plan, ['Seq Scan']);
  const indexScanCount = countNodes(plan, ['Index Scan']);

  const hashJoinCount = countNodes(plan, ['Hash Join']);
  const nestedLoopCount = countNodes(plan, ['Nested Loop']);
  const aggregateCount = countNodes(plan, ['Aggregate']);

  const filterFactor = planRows > 0 ? totalCost / planRows : 0;

  return [
    totalCost, startupCost, planRows, actualRows,
    seqScanCount, indexScanCount, hashJoinCount,
    nestedLoopCount, aggregateCount, filterFactor,
    log?.isSyntaxValid ? 1 : 0,
    log?.joinTypeCount || 0,
    encodeErrorCategory(log?.errorCategory)
  ];
};

// Train the model
const trainModel = async () => {
  try {
    console.log('🔄 Starting ML model training...');

    // --------------------------
    // Get DIRECT category counts
    // --------------------------
    const totalRecords = await prisma.queryLog.count();
    const performanceRecords = await prisma.queryLog.count({
      where: { errorCategory: 'Performance' }
    });
    const syntaxRecords = await prisma.queryLog.count({
      where: { errorCategory: 'Syntax' }
    });
    const logicRecords = await prisma.queryLog.count({
      where: { errorCategory: 'Logic' }
    });
    const unknownRecords = await prisma.queryLog.count({
      where: {
        NOT: {
          errorCategory: { in: ['Performance', 'Syntax', 'Logic'] }
        }
      }
    });

    // --------------------------
    // Verification logging
    // --------------------------
    console.log('📊 Training Verification:');
    console.log('  Total QueryLogs:', totalRecords);
    console.log('  Performance Records:', performanceRecords);
    console.log('  Syntax Records:', syntaxRecords);
    console.log('  Logic Records:', logicRecords);
    console.log('  Unknown Records:', unknownRecords);
    console.log('  Check Sum:', performanceRecords + syntaxRecords + logicRecords + unknownRecords, '=', totalRecords);

    // --------------------------
    // Get ONLY Performance records for training
    // --------------------------
    const trainingData = await prisma.queryLog.findMany({
      where: {
        errorCategory: 'Performance',
        explainPlan: { not: null }
      }
    });

    if (trainingData.length < 2) {
      console.log('❌ Not enough Performance records to train model (minimum 2 needed)');
      trainingStats = {
        success: false,
        message: 'Not enough Performance records to train model (minimum 2 needed)',
        recordCount: 0,
        performanceRecords,
        syntaxRecords,
        logicRecords,
        unknownRecords,
        accuracy: null,
        confusionMatrix: null
      };
      await saveStatsToDB(trainingStats);
      return trainingStats;
    }

    // --------------------------
    // Build training dataset
    // --------------------------
    const X = [];
    const y = [];

    for (const log of trainingData) {
      const features = extractFeatures(log.explainPlan, log);
      X.push(features);
      y.push(log.isSlow ? 1 : 0);
    }

    // --------------------------
    // Train model
    // --------------------------
    trainedModel = new RandomForestClassifier({
      nEstimators: 100,
      maxDepth: 10
    });
    trainedModel.train(X, y);

    // --------------------------
    // Calculate accuracy and confusion matrix
    // --------------------------
    let correct = 0;
    let truePos = 0, trueNeg = 0, falsePos = 0, falseNeg = 0;

    for (let i = 0; i < X.length; i++) {
      const prediction = trainedModel.predict([X[i]])[0];
      const actual = y[i];

      if (prediction === actual) {
        correct++;
      }

      if (prediction === 1 && actual === 1) truePos++;
      else if (prediction === 1 && actual === 0) falsePos++;
      else if (prediction === 0 && actual === 1) falseNeg++;
      else if (prediction === 0 && actual === 0) trueNeg++;
    }

    const accuracy = Math.round((correct / X.length) * 10000) / 100;

    // --------------------------
    // Update and return training stats
    // --------------------------
    trainingStats = {
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
        falseNegative: falseNeg
      }
    };

    console.log('✅ ML model trained successfully!');
    console.log('Training Records:', trainingStats.recordCount);
    console.log('Performance Records:', trainingStats.performanceRecords);
    console.log('Syntax Records:', trainingStats.syntaxRecords);
    console.log('Logic Records:', trainingStats.logicRecords);
    console.log('Accuracy:', trainingStats.accuracy + '%');
    console.log('Confusion Matrix:', trainingStats.confusionMatrix);

    // Save model to disk and stats to database
    saveModelToDisk();
    await saveStatsToDB(trainingStats);

    return trainingStats;
  } catch (error) {
    console.error('❌ ML training error:', error);
    trainedModel = null;
    trainingStats = {
      success: false,
      message: error.message,
      recordCount: 0,
      accuracy: null,
      performanceRecords: 0,
      syntaxRecords: 0,
      logicRecords: 0,
      unknownRecords: 0,
      confusionMatrix: null
    };
    await saveStatsToDB(trainingStats);
    return trainingStats;
  }
};

// Predict slowness probability
const predict = (explainPlan, log) => {
  if (!trainedModel) {
    console.log('⚠️ No trained model available');
    return { probability: 0.5, prediction: 'UNKNOWN', advice: 'ML model not trained yet' };
  }

  try {
    const features = extractFeatures(explainPlan, log);
    console.log('🔍 Prediction features:', features);

    let isSlowProb = 0.5;
    let prediction;

    if (typeof trainedModel.predictProbability === 'function') {
      const probabilities = trainedModel.predictProbability([features], 1);
      isSlowProb = probabilities[0] || 0.5;
    } else if (typeof trainedModel.predict === 'function') {
      const predictionResult = trainedModel.predict([features])[0];
      isSlowProb = predictionResult === 1 ? 0.75 : 0.25;
    }

    prediction = isSlowProb > 0.5 ? 'HIGH RISK' : 'LOW RISK';
    const advice = prediction === 'HIGH RISK'
      ? 'ML predicts this query is HIGH RISK'
      : 'ML predicts this query is LOW RISK';

    console.log('🔍 Prediction result:', { probability: isSlowProb, prediction, advice });

    return {
      probability: Math.round(isSlowProb * 10000) / 100,
      prediction,
      advice
    };
  } catch (error) {
    console.error('❌ ML prediction error:', error);
    return { probability: 0.5, prediction: 'ERROR', advice: 'Failed to make prediction' };
  }
};

// Get model stats
const getStats = () => trainingStats;

module.exports = {
  extractFeatures,
  trainModel,
  predict,
  getStats,
  initializeMLService
};
