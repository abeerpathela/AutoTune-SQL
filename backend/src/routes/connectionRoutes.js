const express = require('express');
const router = express.Router();
const {
  createConnection,
  getConnections,
  deleteConnection,
  testDbConnection,
  getSchema
} = require('../controllers/connectionController');

router.post('/', createConnection);
router.get('/', getConnections);
router.delete('/:id', deleteConnection);
router.post('/test', testDbConnection);
router.get('/:id/schema', getSchema);

module.exports = router;
