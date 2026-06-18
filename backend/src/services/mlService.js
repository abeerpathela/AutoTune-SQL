const { PrismaClient } = require('@prisma/client');
const { RandomForestClassifier } = require('ml-random-forest');
const prisma = new PrismaClient();

// In-memory trained model
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
    return trainingStats;
  }
};

// Predict slowness probability
const predict = (explainPlan, log) => {
  if (!trainedModel) {
    return { probability: 0.5, prediction: 'UNKNOWN', advice: 'ML model not trained yet' };
  }

  try {
    const features = extractFeatures(explainPlan, log);
    const probabilities = trainedModel.predictProba([features])[0];

    const isSlowProb = probabilities[1] || 0.5;
    const prediction = isSlowProb > 0.5 ? 'HIGH RISK' : 'LOW RISK';
    const advice = prediction === 'HIGH RISK'
      ? 'ML predicts this query is HIGH RISK'
      : 'ML predicts this query is LOW RISK';

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
  getStats
};
