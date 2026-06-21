const { PrismaClient } = require('@prisma/client');
const { getStaticCatalog, getChapterContentCached } = require('./academyCacheService');
const { parseQuizData } = require('../utils/quizDataParser');

const prisma = new PrismaClient();
const PASS_THRESHOLD = 80;
const TOTAL_CHAPTERS = 36;

function mapProgress(p) {
  return {
    videoWatched: p?.videoWatched ?? false,
    videoWatchPercent: p?.videoWatchPercent ?? 0,
    videoCompleted: p?.videoCompleted ?? false,
    quizScore: p?.quizScore ?? null,
    quizAttempts: p?.quizAttempts ?? 0,
    focusViolations: p?.focusViolations ?? 0,
    isCompleted: p?.isCompleted ?? false,
    isUnlocked: p?.isUnlocked ?? false,
  };
}

function gradeQuiz(questions, answers) {
  const review = questions.map((q, i) => {
    const userAnswer = answers[i] ?? -1;
    const isCorrect = userAnswer === q.correctAnswer;
    return {
      question: q.question,
      options: q.options,
      userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
    };
  });
  const correct = review.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { review, correct, total, score, passed: score >= PASS_THRESHOLD };
}

async function getAllChaptersOrdered() {
  return prisma.chapter.findMany({
    orderBy: { globalOrder: 'asc' },
    select: {
      id: true,
      globalOrder: true,
      courseId: true,
    },
  });
}

async function ensureProgressInitialized(userId) {
  const chapters = await getAllChaptersOrdered();
  if (chapters.length === 0) return;

  const existing = await prisma.userProgress.findMany({
    where: { userId },
    select: { chapterId: true },
  });
  const existingSet = new Set(existing.map((r) => r.chapterId));

  const missing = chapters.filter((ch) => !existingSet.has(ch.id));
  if (missing.length > 0) {
    await prisma.userProgress.createMany({
      data: missing.map((ch) => ({
        userId,
        chapterId: ch.id,
        isUnlocked: ch.globalOrder === 1,
      })),
      skipDuplicates: true,
    });
  }

  await syncUnlockedChapters(userId);
}

/** Reconcile isUnlocked from completed predecessors (survives refresh / re-login). */
async function syncUnlockedChapters(userId) {
  const chapters = await getAllChaptersOrdered();
  const progressRows = await prisma.userProgress.findMany({
    where: { userId },
    select: {
      chapterId: true,
      videoWatched: true,
      videoWatchPercent: true,
      videoCompleted: true,
      quizScore: true,
      quizAttempts: true,
      focusViolations: true,
      isCompleted: true,
      isUnlocked: true,
    },
  });
  const progressMap = new Map(progressRows.map((p) => [p.chapterId, p]));

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const prev = i > 0 ? chapters[i - 1] : null;
    const prevDone = !prev || progressMap.get(prev.id)?.isCompleted === true;
    const shouldUnlock = ch.globalOrder === 1 || prevDone;
    const row = progressMap.get(ch.id);

    if (shouldUnlock && !row?.isUnlocked) {
      await prisma.userProgress.upsert({
        where: { userId_chapterId: { userId, chapterId: ch.id } },
        create: { userId, chapterId: ch.id, isUnlocked: true },
        update: { isUnlocked: true },
      });
      progressMap.set(ch.id, { ...row, isUnlocked: true });
    }
  }
}

function buildChapterStatus(progressRow, globalOrder, computedUnlocked) {
  const mapped = mapProgress(progressRow);
  const isUnlocked =
    computedUnlocked !== undefined
      ? computedUnlocked
      : mapped.isUnlocked || globalOrder === 1;

  let state = 'Locked';
  if (mapped.isCompleted) {
    state = 'Completed';
  } else if (isUnlocked) {
    state = 'Unlocked';
  }

  return {
    state,
    isCompleted: mapped.isCompleted,
    isUnlocked,
    videoWatched: mapped.videoWatched,
    videoWatchPercent: mapped.videoWatchPercent,
    videoCompleted: mapped.videoCompleted,
    quizScore: mapped.quizScore,
    quizAttempts: mapped.quizAttempts,
    focusViolations: mapped.focusViolations,
  };
}

async function recalculateMasterState(userId) {
  const completedCount = await prisma.userProgress.count({
    where: { userId, isCompleted: true },
  });
  const progressPercent = Math.round((completedCount / TOTAL_CHAPTERS) * 100);
  const completedRows = await prisma.userProgress.findMany({
    where: { userId, isCompleted: true },
    select: { chapterId: true },
  });

  return {
    success: true,
    completedCount,
    progressPercent,
    completedChapterIds: completedRows.map((r) => r.chapterId),
    totalChapters: TOTAL_CHAPTERS,
  };
}

/** Atomic complete → unlock next → sync → recalculate master state. */
async function completeChapterAndRecalculate(userId, chapterId, extraFields = {}) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, globalOrder: true },
  });
  if (!chapter) throw new Error('Chapter not found');

  const progress = await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      isCompleted: true,
      isUnlocked: chapter.globalOrder === 1,
      ...extraFields,
    },
    update: {
      isCompleted: true,
      ...extraFields,
    },
  });

  await unlockNextChapter(userId, chapter.globalOrder);
  await syncUnlockedChapters(userId);

  const master = await recalculateMasterState(userId);
  const next = await prisma.chapter.findFirst({
    where: { globalOrder: chapter.globalOrder + 1 },
    select: { id: true },
  });

  return {
    ...master,
    updatedChapterId: chapterId,
    progress: mapProgress(progress),
    nextChapterId: next?.id ?? null,
  };
}

async function isPreviousChapterCompleted(userId, globalOrder) {
  if (globalOrder <= 1) return true;

  const prev = await prisma.chapter.findFirst({
    where: { globalOrder: globalOrder - 1 },
  });
  if (!prev) return true;

  const prevProgress = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId: prev.id } },
  });

  return prevProgress?.isCompleted === true;
}

async function unlockNextChapter(userId, currentGlobalOrder) {
  const next = await prisma.chapter.findFirst({
    where: { globalOrder: currentGlobalOrder + 1 },
  });
  if (!next) return null;

  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId: next.id } },
    create: { userId, chapterId: next.id, isUnlocked: true },
    update: { isUnlocked: true },
  });

  return next;
}

async function markChapterCompleted(userId, chapterId) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });

  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      isCompleted: true,
      isUnlocked: chapter?.globalOrder === 1,
    },
    update: { isCompleted: true },
  });

  if (chapter) {
    await unlockNextChapter(userId, chapter.globalOrder);
  }

  const next = chapter
    ? await prisma.chapter.findFirst({ where: { globalOrder: chapter.globalOrder + 1 } })
    : null;

  return next?.id ?? null;
}

const getAcademyCatalog = async (userId) => {
  await ensureProgressInitialized(userId);

  const [staticChapters, progressRows] = await Promise.all([
    getStaticCatalog(),
    prisma.userProgress.findMany({
      where: { userId },
      select: {
        chapterId: true,
        videoWatched: true,
        videoWatchPercent: true,
        videoCompleted: true,
        quizScore: true,
        quizAttempts: true,
        focusViolations: true,
        isCompleted: true,
        isUnlocked: true,
      },
    }),
  ]);

  const progressMap = new Map(progressRows.map((p) => [p.chapterId, p]));

  return staticChapters.map((ch, index) => {
    const progressRow = progressMap.get(ch.id) ?? null;
    const prev = index > 0 ? staticChapters[index - 1] : null;
    const prevCompleted =
      !prev || progressMap.get(prev.id)?.isCompleted === true;
    const isUnlocked = ch.globalOrder === 1 || prevCompleted;
    const status = buildChapterStatus(progressRow, ch.globalOrder, isUnlocked);

    return {
      id: ch.id,
      title: ch.title,
      type: ch.type,
      videoUrl: ch.type === 'VIDEO' ? ch.videoUrl : null,
      order: ch.order,
      globalOrder: ch.globalOrder,
      courseId: ch.courseId,
      moduleTitle: ch.moduleTitle,
      quizQuestionCount: ch.quizQuestionCount,
      status,
      isCompleted: Boolean(progressRow?.isCompleted),
      progress: mapProgress(progressRow),
    };
  });
};

const getChapterContent = async (userId, chapterId) => {
  await ensureProgressInitialized(userId);

  const content = await getChapterContentCached(chapterId);
  if (!content) return null;

  if (content.globalOrder > 1) {
    const unlocked = await isPreviousChapterCompleted(userId, content.globalOrder);
    if (!unlocked) {
      const err = new Error('Complete the previous chapter to unlock this content.');
      err.code = 'CHAPTER_LOCKED';
      err.redirectOrder = Math.max(1, content.globalOrder - 1);
      throw err;
    }
  }

  const progressRow = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
    select: {
      videoWatched: true,
      videoWatchPercent: true,
      videoCompleted: true,
      quizScore: true,
      quizAttempts: true,
      focusViolations: true,
      isCompleted: true,
      isUnlocked: true,
    },
  });

  const status = buildChapterStatus(
    progressRow,
    content.globalOrder,
    content.globalOrder === 1 || (await isPreviousChapterCompleted(userId, content.globalOrder))
  );

  return {
    ...content,
    status,
    isCompleted: Boolean(progressRow?.isCompleted),
    progress: mapProgress(progressRow),
  };
};

const getResumeChapterOrder = async (userId) => {
  const catalog = await getAcademyCatalog(userId);
  const next = catalog.find((ch) => !ch.isCompleted);
  return next?.globalOrder ?? catalog[0]?.globalOrder ?? 1;
};

const getChapterByGlobalOrder = async (userId, globalOrder) => {
  await ensureProgressInitialized(userId);

  const order = parseInt(globalOrder, 10);
  const catalog = await getAcademyCatalog(userId);
  const chapter = catalog.find((ch) => ch.globalOrder === order);

  if (!chapter) return null;

  if (order > 1) {
    const unlocked = await isPreviousChapterCompleted(userId, order);
    if (!unlocked) {
      const err = new Error('Complete the previous chapter to unlock this content.');
      err.code = 'CHAPTER_LOCKED';
      err.redirectOrder = Math.max(1, order - 1);
      throw err;
    }
  }

  if (!chapter.status.isUnlocked && order > 1) {
    await prisma.userProgress.upsert({
      where: { userId_chapterId: { userId, chapterId: chapter.id } },
      create: { userId, chapterId: chapter.id, isUnlocked: true },
      update: { isUnlocked: true },
    });
    chapter.status.isUnlocked = true;
  }

  return chapter;
};

const completeVideo = async (userId, chapterId, videoId, maxWatchPercent = 0) => {
  await ensureProgressInitialized(userId);

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new Error('Chapter not found');
  if (chapter.type !== 'VIDEO') {
    throw new Error('This chapter is not a video lecture. Use the quiz to complete theory chapters.');
  }

  if (!videoId || !chapter.videoUrl || videoId.trim() !== chapter.videoUrl.trim()) {
    throw new Error('Invalid video ID for this chapter.');
  }

  const canAccess = await isPreviousChapterCompleted(userId, chapter.globalOrder);
  if (!canAccess && chapter.globalOrder > 1) {
    throw new Error('Previous chapter must be completed first.');
  }

  const existing = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  const storedPercent = Math.max(existing?.videoWatchPercent ?? 0, maxWatchPercent);
  if (storedPercent < 80) {
    throw new Error('Watch at least 80% of the video without skipping to mark complete.');
  }

  return completeChapterAndRecalculate(userId, chapterId, {
    videoWatched: true,
    videoWatchPercent: storedPercent,
    videoCompleted: true,
  });
};

const markVideoWatched = async (userId, chapterId, videoId, maxWatchPercent = 0) => {
  await ensureProgressInitialized(userId);

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new Error('Chapter not found');
  if (chapter.type !== 'VIDEO') throw new Error('Video watch tracking is only for video chapters.');

  if (!videoId || !chapter.videoUrl || videoId.trim() !== chapter.videoUrl.trim()) {
    throw new Error('Invalid video ID for this chapter.');
  }

  const existing = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  const percent = Math.max(existing?.videoWatchPercent ?? 0, Math.min(100, Math.round(maxWatchPercent)));
  const videoWatched = percent >= 95 || existing?.videoWatched;

  const progress = await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      videoWatched,
      videoWatchPercent: percent,
      isUnlocked: chapter.globalOrder === 1,
    },
    update: {
      videoWatchPercent: percent,
      ...(videoWatched ? { videoWatched: true } : {}),
    },
  });

  return { progress: mapProgress(progress) };
};

const submitQuiz = async (userId, chapterId, answers) => {
  await ensureProgressInitialized(userId);

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new Error('Chapter not found');
  if (chapter.type !== 'THEORY') {
    throw new Error('Quiz submission is only for theory chapters.');
  }

  const canAccess = await isPreviousChapterCompleted(userId, chapter.globalOrder);
  if (!canAccess && chapter.globalOrder > 1) {
    throw new Error('Previous chapter must be completed first.');
  }

  const questions = Array.isArray(chapter.quizData) ? chapter.quizData : parseQuizData(chapter.quizData).questions;
  if (questions.length === 0) throw new Error('No quiz configured for this chapter.');

  const { review, correct, total, score, passed } = gradeQuiz(questions, answers);

  await prisma.quizResult.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, score },
    update: { score },
  });

  const currentProgress = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      quizScore: score,
      quizAttempts: 1,
      isUnlocked: chapter.globalOrder === 1,
    },
    update: {
      quizScore: score,
      quizAttempts: (currentProgress?.quizAttempts ?? 0) + 1,
    },
  });

  if (passed) {
    const master = await completeChapterAndRecalculate(userId, chapterId, {
      quizScore: score,
      quizAttempts: (currentProgress?.quizAttempts ?? 0) + 1,
    });

    return {
      passed,
      score,
      correctCount: correct,
      totalCount: total,
      review,
      nextChapterId: master.nextChapterId,
      progress: master.progress,
      success: master.success,
      completedCount: master.completedCount,
      progressPercent: master.progressPercent,
      updatedChapterId: master.updatedChapterId,
      completedChapterIds: master.completedChapterIds,
    };
  }

  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      quizScore: score,
      isCompleted: false,
      isUnlocked: chapter.globalOrder === 1,
    },
    update: { quizScore: score, isCompleted: false },
  });

  const progress = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  return {
    passed,
    score,
    correctCount: correct,
    totalCount: total,
    review,
    nextChapterId: null,
    progress: mapProgress(progress),
  };
};

const failQuiz = async (userId, chapterId, reason = 'focus_violation') => {
  await ensureProgressInitialized(userId);

  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new Error('Chapter not found');
  if (chapter.type !== 'THEORY') throw new Error('Quiz failure is only for theory chapters.');

  const currentProgress = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  const focusViolations = (currentProgress?.focusViolations ?? 0) + 1;

  await prisma.quizResult.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, score: 0 },
    update: { score: 0 },
  });

  const progress = await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      quizScore: 0,
      quizAttempts: 1,
      focusViolations,
      isCompleted: false,
      isUnlocked: chapter.globalOrder === 1,
    },
    update: {
      quizScore: 0,
      quizAttempts: (currentProgress?.quizAttempts ?? 0) + 1,
      focusViolations,
      isCompleted: false,
    },
  });

  return {
    passed: false,
    score: 0,
    correctCount: 0,
    totalCount: parseQuizData(chapter.quizData).questions.length || 10,
    review: [],
    nextChapterId: null,
    reason,
    progress: mapProgress(progress),
  };
};

const recordFocusViolation = async (userId, chapterId) => {
  await ensureProgressInitialized(userId);

  const currentProgress = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  const focusViolations = (currentProgress?.focusViolations ?? 0) + 1;

  const progress = await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, focusViolations },
    update: { focusViolations },
  });

  return { violationCount: focusViolations, progress: mapProgress(progress) };
};

const updateProgress = async (userId, chapterId, payload = {}) => {
  await ensureProgressInitialized(userId);

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { id: true, globalOrder: true },
  });
  if (!chapter) throw new Error('Chapter not found');

  const existing = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId } },
  });

  const markingComplete = payload.isCompleted === true;

  if (markingComplete) {
    const extraFields = {
      videoWatched: payload.videoWatched ?? existing?.videoWatched ?? true,
      videoWatchPercent:
        payload.videoWatchPercent !== undefined
          ? Math.max(existing?.videoWatchPercent ?? 0, Math.min(100, Math.round(payload.videoWatchPercent)))
          : existing?.videoWatchPercent ?? 0,
      videoCompleted: payload.videoCompleted ?? existing?.videoCompleted ?? true,
      quizScore: payload.quizScore !== undefined ? payload.quizScore : existing?.quizScore ?? null,
    };

    return completeChapterAndRecalculate(userId, chapterId, extraFields);
  }

  const data = {
    isCompleted: existing?.isCompleted ?? false,
    videoWatched: payload.videoWatched ?? existing?.videoWatched ?? false,
    videoWatchPercent:
      payload.videoWatchPercent !== undefined
        ? Math.max(existing?.videoWatchPercent ?? 0, Math.min(100, Math.round(payload.videoWatchPercent)))
        : existing?.videoWatchPercent ?? 0,
    videoCompleted: payload.videoCompleted ?? existing?.videoCompleted ?? false,
    quizScore: payload.quizScore !== undefined ? payload.quizScore : existing?.quizScore ?? null,
  };

  const progress = await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: {
      userId,
      chapterId,
      ...data,
      isUnlocked: chapter.globalOrder === 1,
    },
    update: data,
  });

  const master = await recalculateMasterState(userId);

  return {
    ...master,
    updatedChapterId: chapterId,
    progress: mapProgress(progress),
  };
};

const getProgressSummary = async (userId) => {
  await ensureProgressInitialized(userId);
  await syncUnlockedChapters(userId);
  return recalculateMasterState(userId);
};

const calculateProgress = async (userId) => {
  await ensureProgressInitialized(userId);
  const total = await prisma.chapter.count();
  const completed = await prisma.userProgress.count({
    where: { userId, isCompleted: true },
  });
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const incompleteChapters = await prisma.chapter.findMany({
    orderBy: { globalOrder: 'asc' },
    select: { id: true, title: true, globalOrder: true },
  });

  const completedRows = await prisma.userProgress.findMany({
    where: { userId, isCompleted: true },
    select: { chapterId: true },
  });
  const completedSet = new Set(completedRows.map((r) => r.chapterId));

  const remainingChapters = incompleteChapters.filter((ch) => !completedSet.has(ch.id));

  return {
    percentage,
    completed,
    total: total || TOTAL_CHAPTERS,
    remainingChapters,
  };
};

const getUserProgress = async (userId) => {
  await ensureProgressInitialized(userId);
  return prisma.userProgress.findMany({
    where: { userId },
    include: { chapter: { include: { course: true } } },
    orderBy: { chapter: { globalOrder: 'asc' } },
  });
};

const isEligibleForCertificate = async (userId) => {
  const { completed, total } = await calculateProgress(userId);
  return completed >= total && total >= TOTAL_CHAPTERS;
};

module.exports = {
  PASS_THRESHOLD,
  TOTAL_CHAPTERS,
  getAcademyCatalog,
  getChapterContent,
  getResumeChapterOrder,
  getChapterByGlobalOrder,
  completeVideo,
  markVideoWatched,
  submitQuiz,
  failQuiz,
  recordFocusViolation,
  updateProgress,
  getProgressSummary,
  calculateProgress,
  getUserProgress,
  isEligibleForCertificate,
  ensureProgressInitialized,
};
