const { PrismaClient } = require('@prisma/client');
const { RandomForestClassifier } = require('ml-random-forest');
const prisma = new PrismaClient();

// In-memory trained model
let trainedModel = null;
let trainingStats = { recordCount: 0, accuracy: null };

// Recursively count occurrences of node types
const countNodes = (node, targetType) => {
  let count = 0;
  if (node['Node Type'] && node['Node Type'].includes(targetType)) {
    count++;
  }
  if (node.Plans) {
    for (const child of node.Plans) {
      count += countNodes(child, targetType);
    }
  }
  return count;
};

// Extract features from EXPLAIN plan
const extractFeatures = (explainPlan) => {
  const plan = explainPlan.Plan || explainPlan;
  
  // Extract basic features
  const totalCost = plan['Total Cost'] || 0;
  const planRows = plan['Plan Rows'] || 0;
  const isScan = plan['Node Type'] ? (plan['Node Type'].includes('Seq') || plan['Node Type'].includes('Scan') ? 1 : 0) : 0;
  
  // Count joins and filters recursively
  const joinCount = countNodes(plan, 'Join');
  const filterCount = countNodes(plan, 'Filter');
  
  // Return feature array [totalCost, planRows, joinCount, filterCount, isScan]
  return [totalCost, planRows, joinCount, filterCount, isScan];
};

// Train the model
const trainModel = async () => {
  try {
    console.log('🔄 Starting ML model training...');
    
    // Fetch all query logs with explainPlan and isSlow set
    const queryLogs = await prisma.queryLog.findMany({
      where: {
        explainPlan: { not: null },
        isSlow: { not: null }
      }
    });

    if (queryLogs.length < 2) {
      console.log('❌ Not enough data to train model (minimum 2 records needed)');
      return { success: false, message: 'Not enough data to train model (minimum 2 records needed)' };
    }

    // Build training dataset
    const X = [];
    const y = [];

    for (const log of queryLogs) {
      const features = extractFeatures(log.explainPlan);
      X.push(features);
      y.push(log.isSlow ? 1 : 0);
    }

    // Train random forest
    trainedModel = new RandomForestClassifier({
      nEstimators: 100,
      maxDepth: 10
    });
    trainedModel.train(X, y);

    // Calculate simple accuracy (on training data for demo)
    let correct = 0;
    for (let i = 0; i < X.length; i++) {
      const prediction = trainedModel.predict([X[i]])[0];
      if (prediction === y[i]) {
        correct++;
      }
    }
    const accuracy = correct / X.length;

    // Update stats
    trainingStats = {
      recordCount: queryLogs.length,
      accuracy: Math.round(accuracy * 10000) / 100 // Round to 2 decimal places
    };

    console.log(`✅ ML model trained successfully!`);
    console.log(`   - Records used: ${trainingStats.recordCount}`);
    console.log(`   - Training accuracy: ${trainingStats.accuracy}%`);

    return {
      success: true,
      ...trainingStats
    };
  } catch (error) {
    console.error('❌ ML training error:', error);
    trainedModel = null;
    trainingStats = { recordCount: 0, accuracy: null };
    return { success: false, message: error.message };
  }
};

// Predict slowness probability
const predict = (explainPlan) => {
  if (!trainedModel) {
    return { probability: 0.5, prediction: 'UNKNOWN', advice: 'ML model not trained yet' };
  }

  try {
    const features = extractFeatures(explainPlan);
    const probabilities = trainedModel.predictProba([features])[0];
    
    const isSlowProb = probabilities[1] || 0.5; // Probability of class 1 (slow)
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
