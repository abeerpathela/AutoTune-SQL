const express = require('express');
const { z } = require('zod');
const { submitQuery } = require('../controllers/queryController');

const router = express.Router();

const QueryRequestSchema = z.object({
  sql: z.string().min(1, 'SQL query is required')
});

const validateRequest = (req, res, next) => {
  try {
    QueryRequestSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: error.errors
    });
  }
};

router.post('/analyze', validateRequest, submitQuery);

module.exports = router;
