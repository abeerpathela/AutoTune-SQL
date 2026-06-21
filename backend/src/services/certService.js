const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { FRONTEND_URL } = require('../config/appConfig');
const { calculateProgress, TOTAL_CHAPTERS } = require('./academyService');
const { buildCertificatePdfBytes } = require('../utils/certificatePdf');

const prisma = new PrismaClient();
const CERTS_DIR = path.join(__dirname, '../../data/certificates');
const DEFAULT_CERT_TYPE = 'SQL Optimization Specialist';

function ensureCertsDir() {
  if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });
}

function displayName(user) {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  return user.email || 'AutoTune Graduate';
}

async function writeCertificatePdf(user, certificate) {
  ensureCertsDir();
  const filePath = path.join(CERTS_DIR, `${certificate.certificateId}.pdf`);
  const bytes = await buildCertificatePdfBytes({
    userName: displayName(user),
    certificateId: certificate.certificateId,
    issueDate: certificate.issueDate,
  });
  fs.writeFileSync(filePath, bytes);
  return filePath;
}

/**
 * Existing-first: return DB certificate immediately if present.
 * Progress is checked only when creating a new certificate.
 */
const generateCertificate = async (userId, type = DEFAULT_CERT_TYPE) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const existing = await prisma.certificate.findUnique({
    where: { userId_type: { userId, type } },
  });

  if (existing) {
    const filePath = path.join(CERTS_DIR, `${existing.certificateId}.pdf`);
    if (!fs.existsSync(filePath)) {
      await writeCertificatePdf(user, existing);
    }
    return { certificate: existing, filePath, existing: true };
  }

  const progress = await calculateProgress(userId);
  if (progress.percentage < 100 || progress.completed < (progress.total || TOTAL_CHAPTERS)) {
    throw new Error(
      `Certification locked. Complete all ${progress.total || TOTAL_CHAPTERS} chapters. You've completed ${progress.completed} so far.`
    );
  }

  const certificateId = `AT-SQL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const verificationLink = `${FRONTEND_URL}/verify/${certificateId}`;

  const certificate = await prisma.certificate.create({
    data: { certificateId, userId, type, verificationLink },
  });

  const filePath = await writeCertificatePdf(user, certificate);
  return { certificate, filePath, existing: false };
};

const findUserCertificate = async (userId, idOrCertId) => {
  return prisma.certificate.findFirst({
    where: {
      userId,
      OR: [{ id: idOrCertId }, { certificateId: idOrCertId }],
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
};

const findCertificateByPublicId = async (certId) => {
  return prisma.certificate.findFirst({
    where: {
      OR: [{ certificateId: certId }, { id: certId }],
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
};

const streamCertificateDownload = async (userId, idOrCertId, res) => {
  const certificate = await findUserCertificate(userId, idOrCertId);
  if (!certificate) {
    const err = new Error('Certificate not found');
    err.status = 404;
    throw err;
  }

  const bytes = await buildCertificatePdfBytes({
    userName: displayName(certificate.user),
    certificateId: certificate.certificateId,
    issueDate: certificate.issueDate,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="AutoTune-Certificate-${certificate.certificateId}.pdf"`
  );
  res.send(Buffer.from(bytes));
};

const verifyCertificate = async (certId) => {
  const certificate = await findCertificateByPublicId(certId);

  if (!certificate) return { valid: false, message: 'Certificate not found' };

  const name = displayName(certificate.user);

  return {
    valid: true,
    certificate: {
      id: certificate.id,
      certificateId: certificate.certificateId,
      type: certificate.type,
      issueDate: certificate.issueDate,
      verificationLink: certificate.verificationLink,
      userName: name,
      user: certificate.user,
    },
  };
};

const getUserCertificates = async (userId) => {
  return prisma.certificate.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  generateCertificate,
  verifyCertificate,
  getUserCertificates,
  streamCertificateDownload,
  findUserCertificate,
  findCertificateByPublicId,
  DEFAULT_CERT_TYPE,
};
