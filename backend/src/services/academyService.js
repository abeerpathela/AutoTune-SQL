const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PASS_THRESHOLD = 80;
const TOTAL_CHAPTERS = 30;

async function getAllChaptersOrdered() {
  return prisma.chapter.findMany({
    orderBy: { globalOrder: 'asc' },
    include: { quiz: true, course: true },
  });
}

async function ensureProgressInitialized(userId) {
  const chapters = await getAllChaptersOrdered();
  if (chapters.length === 0) return;

  const existing = await prisma.userProgress.findMany({ where: { userId } });
  if (existing.length > 0) return;

  await prisma.userProgress.createMany({
    data: chapters.map((ch) => ({
      userId,
      chapterId: ch.id,
      status: 'IN_PROGRESS',
      isUnlocked: ch.globalOrder === 1,
      isWatched: false,
      exerciseCompleted: false,
    })),
  });
}

async function unlockNextChapter(userId, currentGlobalOrder) {
  const next = await prisma.chapter.findFirst({
    where: { globalOrder: currentGlobalOrder + 1 },
  });
  if (!next) return;

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
}

const getCourses = async () => {
  const courses = await prisma.course.findMany({
    include: {
      chapters: { orderBy: { order: 'asc' }, include: { quiz: { select: { id: true } } } },
    },
    orderBy: { title: 'asc' },
  });
  return courses;
};

const getAcademyCatalog = async (userId) => {
  await ensureProgressInitialized(userId);

  const chapters = await getAllChaptersOrdered();
  const progress = await prisma.userProgress.findMany({
    where: { userId },
  });
  const progressMap = new Map(progress.map((p) => [p.chapterId, p]));

  return chapters.map((ch) => {
    const p = progressMap.get(ch.id);
    return {
      id: ch.id,
      title: ch.title,
      content: ch.content,
      videoUrl: ch.videoUrl,
      practiceSql: ch.practiceSql,
      order: ch.order,
      globalOrder: ch.globalOrder,
      courseId: ch.courseId,
      moduleTitle: ch.course.title,
      quizId: ch.quiz?.id,
      quizQuestionCount: Array.isArray(ch.quiz?.questions) ? ch.quiz.questions.length : 0,
      progress: {
        isWatched: p?.isWatched ?? false,
        exerciseCompleted: p?.exerciseCompleted ?? false,
        quizScore: p?.quizScore ?? null,
        isUnlocked: p?.isUnlocked ?? ch.globalOrder === 1,
        status: p?.status ?? 'IN_PROGRESS',
        isCompleted: p?.status === 'COMPLETED' && (p?.quizScore ?? 0) >= PASS_THRESHOLD,
      },
    };
  });
};

const getChapterByGlobalOrder = async (userId, globalOrder) => {
  await ensureProgressInitialized(userId);

  const chapter = await prisma.chapter.findFirst({
    where: { globalOrder: parseInt(globalOrder, 10) },
    include: { quiz: true, course: true },
  });

  if (!chapter) return null;

  const progress = await prisma.userProgress.findUnique({
    where: { userId_chapterId: { userId, chapterId: chapter.id } },
  });

  const isUnlocked = progress?.isUnlocked ?? chapter.globalOrder === 1;
  if (!isUnlocked) {
    const err = new Error('Chapter locked. Complete previous chapters first.');
    err.code = 'CHAPTER_LOCKED';
    err.redirectOrder = Math.max(1, chapter.globalOrder - 1);
    throw err;
  }

  return {
    ...chapter,
    moduleTitle: chapter.course.title,
    progress: progress || {
      isWatched: false,
      exerciseCompleted: false,
      quizScore: null,
      isUnlocked: chapter.globalOrder === 1,
      status: 'IN_PROGRESS',
    },
  };
};

const getCourseById = async (courseId) => {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: { chapters: { orderBy: { order: 'asc' }, include: { quiz: true } } },
  });
};

const createCourse = async (title, description) => prisma.course.create({ data: { title, description } });
const updateCourse = async (courseId, data) => prisma.course.update({ where: { id: courseId }, data });
const deleteCourse = async (courseId) => prisma.course.delete({ where: { id: courseId } });

const createChapter = async (courseId, title, content, order, videoUrl, practiceSql, globalOrder) =>
  prisma.chapter.create({
    data: { courseId, title, content, order, videoUrl, practiceSql, globalOrder },
  });

const getChapterById = async (chapterId) =>
  prisma.chapter.findUnique({ where: { id: chapterId }, include: { quiz: true, course: true } });

const updateChapter = async (chapterId, data) => prisma.chapter.update({ where: { id: chapterId }, data });
const deleteChapter = async (chapterId) => prisma.chapter.delete({ where: { id: chapterId } });

const createQuiz = async (chapterId, questions) => prisma.quiz.create({ data: { chapterId, questions } });
const updateQuiz = async (quizId, questions) => prisma.quiz.update({ where: { id: quizId }, data: { questions } });
const deleteQuiz = async (quizId) => prisma.quiz.delete({ where: { id: quizId } });

const calculateProgress = async (userId) => {
  await ensureProgressInitialized(userId);
  const total = await prisma.chapter.count();
  const completed = await prisma.userProgress.count({
    where: { userId, status: 'COMPLETED', quizScore: { gte: PASS_THRESHOLD } },
  });
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { percentage, completed, total: total || TOTAL_CHAPTERS };
};

const markWatched = async (userId, chapterId) => {
  await ensureProgressInitialized(userId);
  return prisma.userProgress.update({
    where: { userId_chapterId: { userId, chapterId } },
    data: { isWatched: true },
  });
};

const markExerciseCompleted = async (userId, chapterId) => {
  await ensureProgressInitialized(userId);
  return prisma.userProgress.update({
    where: { userId_chapterId: { userId, chapterId } },
    data: { exerciseCompleted: true },
  });
};

const updateProgress = async (userId, chapterId, status) => {
  await ensureProgressInitialized(userId);
  return prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId } },
    create: { userId, chapterId, status },
    update: { status },
  });
};

const getUserProgress = async (userId) => {
  await ensureProgressInitialized(userId);
  return prisma.userProgress.findMany({
    where: { userId },
    include: { chapter: { include: { course: true } } },
    orderBy: { chapter: { globalOrder: 'asc' } },
  });
};

const evaluateQuiz = async (userId, quizId, userAnswers) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { chapter: true },
  });

  if (!quiz) throw new Error('Quiz not found');

  const questions = quiz.questions;
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (userAnswers[i] === questions[i].correctAnswer) correct++;
  }

  const score = Math.round((correct / questions.length) * 100);

  await prisma.quizResult.upsert({
    where: { userId_quizId: { userId, quizId } },
    create: { userId, quizId, score },
    update: { score },
  });

  const passed = score >= PASS_THRESHOLD;

  await prisma.userProgress.upsert({
    where: { userId_chapterId: { userId, chapterId: quiz.chapterId } },
    create: {
      userId,
      chapterId: quiz.chapterId,
      quizScore: score,
      status: passed ? 'COMPLETED' : 'IN_PROGRESS',
      isUnlocked: quiz.chapter.globalOrder === 1,
    },
    update: {
      quizScore: score,
      status: passed ? 'COMPLETED' : 'IN_PROGRESS',
    },
  });

  if (passed) {
    await unlockNextChapter(userId, quiz.chapter.globalOrder);
  }

  return {
    score,
    correct,
    total: questions.length,
    passed,
    passThreshold: PASS_THRESHOLD,
    chapterCompleted: passed,
    nextChapterUnlocked: passed && quiz.chapter.globalOrder < TOTAL_CHAPTERS,
  };
};

module.exports = {
  PASS_THRESHOLD,
  TOTAL_CHAPTERS,
  getCourses,
  getAcademyCatalog,
  getChapterByGlobalOrder,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  createChapter,
  getChapterById,
  updateChapter,
  deleteChapter,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  calculateProgress,
  markWatched,
  markExerciseCompleted,
  updateProgress,
  getUserProgress,
  evaluateQuiz,
  ensureProgressInitialized,
};
