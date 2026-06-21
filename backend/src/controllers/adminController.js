const adminService = require('../services/adminService');
const { DEFAULT_CERT_TYPE } = require('../services/certService');

const completeAcademy = async (req, res) => {
  try {
    const result = await adminService.completeAcademyForUser(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('[admin] completeAcademy', req.user?.id, error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

const completeAndCertify = async (req, res) => {
  try {
    const type = req.body?.type || DEFAULT_CERT_TYPE;
    const result = await adminService.completeAndCertify(req.user.id, type);
    res.json(result);
  } catch (error) {
    console.error('[admin] completeAndCertify', req.user?.id, error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

module.exports = { completeAcademy, completeAndCertify };
