const express = require('express');
const rateLimit = require('express-rate-limit');
const { getOptimization } = require('../services/optimizationService');

const router = express.Router();

// Rate limiter
const optimizationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many optimization requests. Please try again later.'
  }
});

router.post('/:id', optimizationLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const optimization = await getOptimization(id);

    res.status(200).json({
      status: 'success',
      data: optimization
    });
  } catch (error) {
    console.error('Optimization error:', error);
    
    // Check for model decommissioned error
    if (error.message === 'The configured AI model is no longer available. Please update the Groq model configuration.') {
      return res.status(500).json({
        status: 'error',
        message: 'The configured AI model is no longer available. Please update the Groq model configuration.'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to optimize query. Please try again or review manually.'
    });
  }
});

module.exports = router;
