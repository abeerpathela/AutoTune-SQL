const { PrismaClient } = require('@prisma/client');
const { generateCertificate, DEFAULT_CERT_TYPE } = require('./certService');

const prisma = new PrismaClient();

/**
 * Admin God Mode — mark all 36 chapters complete for instant 100% testing.
 */
async function completeAcademyForUser(userId) {
  const chapters = await prisma.chapter.findMany({
    orderBy: { globalOrder: 'asc' },
    select: { id: true, type: true, globalOrder: true },
  });

  if (chapters.length === 0) {
    throw new Error('No chapters found. Run the academy seeder first.');
  }

  for (const chapter of chapters) {
    const isVideo = chapter.type === 'VIDEO';
    await prisma.userProgress.upsert({
      where: { userId_chapterId: { userId, chapterId: chapter.id } },
      create: {
        userId,
        chapterId: chapter.id,
        isUnlocked: true,
        isCompleted: true,
        videoWatched: isVideo,
        videoCompleted: isVideo,
        videoWatchPercent: isVideo ? 100 : 0,
        quizScore: 100,
        quizAttempts: 1,
      },
      update: {
        isUnlocked: true,
        isCompleted: true,
        videoWatched: isVideo ? true : undefined,
        videoCompleted: isVideo ? true : undefined,
        videoWatchPercent: isVideo ? 100 : undefined,
        quizScore: 100,
      },
    });
  }

  return {
    completedCount: chapters.length,
    totalChapters: chapters.length,
    progressPercent: 100,
    message: `All ${chapters.length} chapters marked complete for admin testing.`,
  };
}

/**
 * Complete academy + issue certificate — instant "Earned" UI verification.
 */
async function completeAndCertify(userId, type = DEFAULT_CERT_TYPE) {
  const progressResult = await completeAcademyForUser(userId);
  const certResult = await generateCertificate(userId, type);

  return {
    ...progressResult,
    certificate: certResult.certificate,
    certExisting: certResult.existing,
    message: certResult.existing
      ? 'Academy completed. Existing certificate returned.'
      : 'Academy completed and certificate issued.',
  };
}

module.exports = { completeAcademyForUser, completeAndCertify };
