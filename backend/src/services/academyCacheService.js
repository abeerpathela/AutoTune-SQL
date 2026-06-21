const getRedisClient = require('../config/redis');
const { PrismaClient } = require('@prisma/client');
const { parseQuizData } = require('../utils/quizDataParser');

const prisma = new PrismaClient();

const STATIC_CATALOG_KEY = 'academy:catalog:static:v1';
const CHAPTER_CONTENT_PREFIX = 'academy:chapter:content:v1:';
const STATIC_CATALOG_TTL = 3600;
const CHAPTER_CONTENT_TTL = 3600;

async function getStaticCatalog() {
  const redis = getRedisClient();

  try {
    const cached = await redis.get(STATIC_CATALOG_KEY);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[academy-cache] static catalog read failed:', err.message);
  }

  const rows = await prisma.chapter.findMany({
    orderBy: { globalOrder: 'asc' },
    select: {
      id: true,
      title: true,
      type: true,
      videoUrl: true,
      order: true,
      globalOrder: true,
      courseId: true,
      quizData: true,
      course: { select: { title: true } },
    },
  });

  const staticCatalog = rows.map((ch) => ({
    id: ch.id,
    title: ch.title,
    type: ch.type,
    videoUrl: ch.videoUrl,
    order: ch.order,
    globalOrder: ch.globalOrder,
    courseId: ch.courseId,
    moduleTitle: ch.course.title,
    quizQuestionCount: parseQuizData(ch.quizData).questions.length,
  }));

  try {
    await redis.setex(STATIC_CATALOG_KEY, STATIC_CATALOG_TTL, JSON.stringify(staticCatalog));
  } catch (err) {
    console.warn('[academy-cache] static catalog write failed:', err.message);
  }

  return staticCatalog;
}

async function getChapterContentCached(chapterId) {
  const redis = getRedisClient();
  const cacheKey = `${CHAPTER_CONTENT_PREFIX}${chapterId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    console.warn('[academy-cache] chapter content read failed:', err.message);
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: {
      id: true,
      type: true,
      globalOrder: true,
      theoryContent: true,
      quizData: true,
      videoUrl: true,
      practiceQuery: true,
      expectedResult: true,
    },
  });

  if (!chapter) return null;

  const parsed = parseQuizData(chapter.quizData);

  const practiceLab = chapter.practiceQuery
    ? {
        practiceQuery: chapter.practiceQuery,
        targetSql: chapter.practiceQuery,
        expectedResult: chapter.expectedResult ?? parsed.practiceLab?.expectedResult,
      }
    : parsed.practiceLab;

  const content = {
    id: chapter.id,
    type: chapter.type,
    globalOrder: chapter.globalOrder,
    videoUrl: chapter.videoUrl,
    theoryContent: chapter.theoryContent ?? '',
    quiz: { questions: parsed.questions },
    practiceLab,
  };

  try {
    await redis.setex(cacheKey, CHAPTER_CONTENT_TTL, JSON.stringify(content));
  } catch (err) {
    console.warn('[academy-cache] chapter content write failed:', err.message);
  }

  return content;
}

async function invalidateAcademyCache() {
  const redis = getRedisClient();
  try {
    await redis.del(STATIC_CATALOG_KEY);
    const keys = await redis.keys(`${CHAPTER_CONTENT_PREFIX}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    console.warn('[academy-cache] invalidate failed:', err.message);
  }
}

module.exports = {
  getStaticCatalog,
  getChapterContentCached,
  invalidateAcademyCache,
};
