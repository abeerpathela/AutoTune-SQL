const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { completeAcademy, completeAndCertify } = require('../controllers/adminController');

router.post('/complete-academy', protect, requireAdmin, completeAcademy);
router.post('/debug/complete-and-certify', protect, requireAdmin, completeAndCertify);

module.exports = router;
