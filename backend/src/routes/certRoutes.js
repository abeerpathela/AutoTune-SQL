const express = require('express');
const router = express.Router();
const certService = require('../services/certService');
const { authenticate } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

router.post('/generate', authenticate, async (req, res) => {
  try {
    const { type } = req.body;
    const result = await certService.generateCertificate(req.user.id, type);
    res.json(result.certificate);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const certificates = await certService.getUserCertificates(req.user.id);
    res.json(certificates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/download/:certId', authenticate, async (req, res) => {
  try {
    const certPath = path.join(__dirname, '../../data/certificates', `${req.params.certId}.pdf`);
    
    if (!fs.existsSync(certPath)) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.download(certPath, 'certificate.pdf');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/verify/:certId', async (req, res) => {
  try {
    const result = await certService.verifyCertificate(req.params.certId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
