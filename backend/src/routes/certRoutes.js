const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  generateCertificate,
  getMyCertificates,
  downloadCertificate,
  verifyCertificate,
} = require('../controllers/certController');

router.post('/generate', authenticate, generateCertificate);
router.get('/my', authenticate, getMyCertificates);
router.get('/download/:certId', authenticate, downloadCertificate);
router.get('/verify/:certId', verifyCertificate);

module.exports = router;
