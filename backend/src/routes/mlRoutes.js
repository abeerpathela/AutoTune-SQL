const express = require('express');
const { trainModel, getStats } = require('../services/mlService');

const router = express.Router();

// Train the model
router.post('/train', async (req, res, next) => {
  try {
    const result = await trainModel();
    
    if (result.success) {
      res.status(200).json({
        status: 'success',
        data: result
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: result.message
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get model stats
router.get('/stats', (req, res, next) => {
  try {
    const stats = getStats();
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
