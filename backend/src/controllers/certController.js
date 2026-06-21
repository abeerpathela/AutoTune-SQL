const certService = require('../services/certService');

const generateCertificate = async (req, res) => {
  try {
    const { type } = req.body;
    const certType = type || certService.DEFAULT_CERT_TYPE;
    const result = await certService.generateCertificate(req.user.id, certType);
    res.status(200).json({ ...result.certificate, existing: result.existing });
  } catch (error) {
    console.error('[cert] generate', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

const getMyCertificates = async (req, res) => {
  try {
    const certificates = await certService.getUserCertificates(req.user.id);
    res.json(certificates);
  } catch (error) {
    console.error('[cert] my', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const downloadCertificate = async (req, res) => {
  try {
    await certService.streamCertificateDownload(req.user.id, req.params.certId, res);
  } catch (error) {
    console.error('[cert] download', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
};

const verifyCertificate = async (req, res) => {
  try {
    const result = await certService.verifyCertificate(req.params.certId);
    res.json(result);
  } catch (error) {
    console.error('[cert] verify', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  generateCertificate,
  getMyCertificates,
  downloadCertificate,
  verifyCertificate,
};
