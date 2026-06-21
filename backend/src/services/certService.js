const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { FRONTEND_URL } = require('../config/appConfig');
const { TOTAL_CHAPTERS, PASS_THRESHOLD } = require('./academyService');

const prisma = new PrismaClient();

const generateCertificate = async (userId, type) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user completed all chapters
  const totalChapters = await prisma.chapter.count();
  const completedChapters = await prisma.userProgress.count({
    where: {
      userId,
      status: 'COMPLETED',
      quizScore: { gte: PASS_THRESHOLD },
    },
  });

  if (completedChapters < totalChapters || totalChapters < TOTAL_CHAPTERS) {
    throw new Error(`You must complete all ${totalChapters || TOTAL_CHAPTERS} chapters with ≥80% quiz scores. You've completed ${completedChapters} so far.`);
  }

  const certificateId = `AT-SQL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const verificationLink = `${FRONTEND_URL}/verify/${certificateId}`;

  const certificate = await prisma.certificate.create({
    data: {
      certificateId,
      userId,
      type,
      verificationLink,
    },
  });

  const certsDir = path.join(__dirname, '../../data/certificates');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(certsDir, `${certificateId}.pdf`);
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Header
    doc.fontSize(30).text('AutoTune-SQL', { align: 'center' });
    doc.moveDown();
    doc.fontSize(22).text('Certificate of Completion', { align: 'center' });
    doc.moveDown(2);

    // User Name
    const fullName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email;
    doc.fontSize(24).text(fullName, { align: 'center' });
    doc.moveDown();

    // Course Type
    doc.fontSize(18).text(`has successfully completed the "${type}" course`, { align: 'center' });
    doc.moveDown(2);

    // Date
    const issueDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.fontSize(14).text(`Issued on: ${issueDate}`, { align: 'center' });
    doc.moveDown(2);

    // Verification Link
    doc.fontSize(12).text(`Verify this certificate at: ${verificationLink}`, { align: 'center', link: verificationLink });

    doc.end();

    writeStream.on('finish', () => {
      resolve({ certificate, filePath });
    });

    writeStream.on('error', reject);
  });
};

const verifyCertificate = async (certId) => {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateId: certId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!certificate) {
    return { valid: false, message: 'Certificate not found' };
  }

  return {
    valid: true,
    certificate: {
      type: certificate.type,
      issueDate: certificate.issueDate,
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
};
