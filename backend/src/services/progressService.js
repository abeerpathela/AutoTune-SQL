const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PASS_THRESHOLD = 80;
const TOTAL_CHAPTERS = 36;

function mapProgressFlags(p) {
  const videoWatched = p?.isWatched ?? false;
  const labPassed = p?.exerciseCompleted ?? false;
  const quizPassed = p?.quizPassed ?? ((p?.quizScore ?? 0) >= PASS_THRESHOLD);
  const isCompleted =
    p?.status === 'COMPLETED' && videoWatched && labPassed && quizPassed;

  return {
    videoWatched,
    labPassed,
    quizPassed,
    isWatched: videoWatched,
    exerciseCompleted: labPassed,
    quizScore: p?.quizScore ?? null,
    isUnlocked: p?.isUnlocked ?? false,
    status: p?.status ?? 'IN_PROGRESS',
    isCompleted,
  };
}

async function unlockNextChapter(userId, currentGlobalOrder) {
  const next = await prisma.chapter.findFirst({
    where: { globalOrder: currentGlobalOrder + 1 },
  });
  if (!next) return null;

  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId: next.id } },
    create: {
      userId,
      chapterId: next.id,
      status: 'IN_PROGRESS',
      isUnlocked: true,
    },
    update: { isUnlocked: true },
  });

  return next;
}

async function syncChapterCompletion(userId, chapterId) {
  const [progress, chapter] = await Promise.all([
    prisma.userProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    }),
    prisma.chapter.findUnique({ where: { id: chapterId } }),
  ]);

  if (!progress || !chapter) {
    return { videoWatched: false, labPassed: false, quizPassed: false, isCompleted: false };
  }

  const chapterHasVideo = Boolean(chapter.videoUrl?.trim());
  const videoWatched = chapterHasVideo ? progress.isWatched : true;
  const labPassed = progress.exerciseCompleted;
  const quizPassed = progress.quizPassed || (progress.quizScore ?? 0) >= PASS_THRESHOLD;

  if (quizPassed && !progress.quizPassed) {
    await prisma.userProgress.update({
      where: { userId_chapterId: { userId, chapterId } },
      data: { quizPassed: true },
    });
  }

  const allComplete = videoWatched && labPassed && quizPassed;

  if (allComplete && progress.status !== 'COMPLETED') {
    await prisma.userProgress.update({
      where: { userId_chapterId: { userId, chapterId } },
      data: { status: 'COMPLETED', quizPassed: true },
    });
    await unlockNextChapter(userId, chapter.globalOrder);
  } else if (!allComplete && progress.status === 'COMPLETED') {
    await prisma.userProgress.update({
      where: { userId_chapterId: { userId, chapterId } },
      data: { status: 'IN_PROGRESS' },
    });
  }

  return {
    videoWatched,
    labPassed,
    quizPassed,
    isCompleted: allComplete,
    nextUnlocked: allComplete && chapter.globalOrder < TOTAL_CHAPTERS,
  };
}

async function markVideoWatched(userId, chapterId) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      isWatched: true,
      isUnlocked: chapter?.globalOrder === 1,
    },
    update: { isWatched: true },
  });

  const completion = await syncChapterCompletion(userId, chapterId);
  return { completion };
}

async function markLabPassed(userId, chapterId) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      exerciseCompleted: true,
      isUnlocked: chapter?.globalOrder === 1,
    },
    update: { exerciseCompleted: true },
  });

  const completion = await syncChapterCompletion(userId, chapterId);
  return { completion };
}

async function recordQuizResult(userId, chapterId, score) {
  const passed = score >= PASS_THRESHOLD;

  const progress = await prisma.userProgress.update({
    where: { userId_chapterId: { userId, chapterId } },
    data: {
      quizScore: score,
      quizPassed: passed,
    },
  });

  const completion = await syncChapterCompletion(userId, chapterId);
  return { progress, completion, passed };
}

async function patchProgress(userId, chapterId, updates = {}) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new Error('Chapter not found');

  const data = {};
  if (updates.videoWatched === true) data.isWatched = true;
  if (updates.labPassed === true) data.exerciseCompleted = true;
  if (typeof updates.quizScore === 'number') {
    data.quizScore = updates.quizScore;
    data.quizPassed = updates.quizScore >= PASS_THRESHOLD;
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No valid progress fields to update');
  }

  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      isUnlocked: chapter.globalOrder === 1,
      status: 'IN_PROGRESS',
      ...data,
    },
    update: data,
  });

  const completion = await syncChapterCompletion(userId, chapterId);
  const progress = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  return {
    progress: mapProgressFlags(progress),
    completion,
  };
}

async function countFullyCompletedChapters(userId) {
  const chapters = await prisma.chapter.count();
  const completed = await prisma.userProgress.count({
    where: {
      userId,
      status: 'COMPLETED',
      isWatched: true,
      exerciseCompleted: true,
      quizPassed: true,
      quizScore: { gte: PASS_THRESHOLD },
    },
  });

  return { completed, total: chapters || TOTAL_CHAPTERS };
}

async function isEligibleForCertificate(userId) {
  const { completed, total } = await countFullyCompletedChapters(userId);
  return completed >= total && total >= TOTAL_CHAPTERS;
}

module.exports = {
  PASS_THRESHOLD,
  TOTAL_CHAPTERS,
  mapProgressFlags,
  unlockNextChapter,
  syncChapterCompletion,
  markVideoWatched,
  markLabPassed,
  recordQuizResult,
  patchProgress,
  countFullyCompletedChapters,
  isEligibleForCertificate,
};
