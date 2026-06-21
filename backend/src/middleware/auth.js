const authService = require('../services/authService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required' });
  }
  next();
};

module.exports = { protect, authenticate: protect, requireAdmin };
