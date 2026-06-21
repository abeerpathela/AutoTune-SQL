const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Demo data fallback — 8 chapters from Basics to Advanced
const demoCourse = {
  id: 'demo-course',
  title: 'SQL Mastery Track',
  description: 'Complete path from basics to advanced optimization',
  chapters: [
    {
      id: 'chapter-1',
      title: 'SQL Basics',
      order: 1,
      content: `# SQL Basics\n\nLearn foundational SELECT, WHERE, and ORDER BY patterns.\n\n\`\`\`sql\nSELECT name, email FROM users WHERE active = true ORDER BY created_at DESC;\n\`\`\``,
    },
    {
      id: 'chapter-2',
      title: 'Joins',
      order: 2,
      content: `# Joins\n\nUnderstand INNER, LEFT, and RIGHT joins.\n\n\`\`\`sql\nSELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id;\n\`\`\``,
    },
    {
      id: 'chapter-3',
      title: 'Aggregations',
      order: 3,
      content: `# Aggregations\n\nUse GROUP BY, HAVING, and aggregate functions.\n\n\`\`\`sql\nSELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 5;\n\`\`\``,
    },
    {
      id: 'chapter-4',
      title: 'Subqueries',
      order: 4,
      content: `# Subqueries\n\nNest queries for filtering and derived tables.\n\n\`\`\`sql\nSELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE country = 'US');\n\`\`\``,
    },
    {
      id: 'chapter-5',
      title: 'Optimization',
      order: 5,
      content: `# Optimization\n\nRead EXPLAIN plans and reduce full table scans.\n\n\`\`\`sql\nEXPLAIN ANALYZE SELECT * FROM orders WHERE status = 'pending';\n\`\`\``,
    },
    {
      id: 'chapter-6',
      title: 'Transactions',
      order: 6,
      content: `# Transactions\n\nEnsure atomicity with BEGIN, COMMIT, and ROLLBACK.\n\n\`\`\`sql\nBEGIN;\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nCOMMIT;\n\`\`\``,
    },
    {
      id: 'chapter-7',
      title: 'Indexes',
      order: 7,
      content: `# Indexes\n\nCreate indexes to accelerate lookups and joins.\n\n\`\`\`sql\nCREATE INDEX idx_orders_status ON orders(status);\n\`\`\``,
    },
    {
      id: 'chapter-8',
      title: 'Advanced',
      order: 8,
      content: `# Advanced SQL\n\nWindow functions, CTEs, and performance-aware patterns.\n\n\`\`\`sql\nWITH ranked AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn\n  FROM orders\n)\nSELECT * FROM ranked WHERE rn = 1;\n\`\`\``,
    },
  ],
};

// Course CRUD (Admin Only)
const createCourse = async (title, description) => {
  return prisma.course.create({
    data: {
      title,
      description,
    },
  });
};

const getCourses = async () => {
  const courses = await prisma.course.findMany({
    include: {
      chapters: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (courses.length === 0) {
    return [demoCourse];
  }

  return courses;
};

const getCourseById = async (courseId) => {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });
};

const updateCourse = async (courseId, data) => {
  return prisma.course.update({
    where: { id: courseId },
    data,
  });
};

const deleteCourse = async (courseId) => {
  return prisma.course.delete({
    where: { id: courseId },
  });
};

// Chapter CRUD (Admin Only)
const createChapter = async (courseId, title, content, order) => {
  return prisma.chapter.create({
    data: {
      courseId,
      title,
      content,
      order,
    },
  });
};

const getChapterById = async (chapterId) => {
  return prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      quiz: true,
    },
  });
};

const updateChapter = async (chapterId, data) => {
  return prisma.chapter.update({
    where: { id: chapterId },
    data,
  });
};

const deleteChapter = async (chapterId) => {
  return prisma.chapter.delete({
    where: { id: chapterId },
  });
};

// Quiz CRUD (Admin Only)
const createQuiz = async (chapterId, questions) => {
  return prisma.quiz.create({
    data: {
      chapterId,
      questions,
    },
  });
};

const updateQuiz = async (quizId, questions) => {
  return prisma.quiz.update({
    where: { id: quizId },
    data: { questions },
  });
};

const deleteQuiz = async (quizId) => {
  return prisma.quiz.delete({
    where: { id: quizId },
  });
};

// User Progress
const calculateProgress = async (userId) => {
  const allChapters = await prisma.chapter.findMany();
  const totalChapters = allChapters.length;

  if (totalChapters === 0) {
    return { percentage: 0, completed: 0, total: 0 };
  }

  const completedProgress = await prisma.userProgress.findMany({
    where: {
      userId,
      status: 'COMPLETED',
    },
  });

  const completed = completedProgress.length;
  const percentage = Math.round((completed / totalChapters) * 100);

  return { percentage, completed, total: totalChapters };
};

const updateProgress = async (userId, chapterId, status) => {
  return prisma.userProgress.upsert({
    where: {
      userId_chapterId: {
        userId,
        chapterId,
      },
    },
    create: {
      userId,
      chapterId,
      status,
    },
    update: {
      status,
    },
  });
};

const getUserProgress = async (userId) => {
  return prisma.userProgress.findMany({
    where: { userId },
    include: {
      chapter: true,
    },
  });
};

const evaluateQuiz = async (userId, quizId, userAnswers) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
  });

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  const questions = quiz.questions;
  let correct = 0;

  for (let i = 0; i < questions.length; i++) {
    if (userAnswers[i] === questions[i].correctAnswer) {
      correct++;
    }
  }

  const score = (correct / questions.length) * 100;

  const result = await prisma.quizResult.upsert({
    where: {
      userId_quizId: {
        userId,
        quizId,
      },
    },
    create: {
      userId,
      quizId,
      score,
    },
    update: {
      score,
    },
  });

  return { score, correct, total: questions.length };
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
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
  updateProgress,
  getUserProgress,
  evaluateQuiz,
};
