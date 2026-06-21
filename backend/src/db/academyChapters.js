/**
 * 36-chapter LMS — 6 modules
 * Module 1: NO VIDEO — Introduction & certification (6 THEORY)
 * Modules 2–5: chapter 1 = VIDEO (verified YouTube), chapters 2–6 = THEORY
 * Module 6: all THEORY (AI/ML + final exam)
 */

const { getContent, quiz, packChapterData } = require('./chapterContent');
const { getLabForChapter } = require('./chapterLabs');
const { VIDEO_QUIZZES } = require('./videoQuizzes');

const MODULES = [
  {
    id: 'module-1',
    title: 'Module 1: Introduction',
    videoId: null,
    videoTitle: null,
    theoryKeys: [
      'learning-path',
      'certification-process',
      'relational-databases',
      'postgres-setup',
      'academy-rules',
      'module1-checkpoint',
    ],
  },
  {
    id: 'module-2',
    title: 'Module 2: Filtering & Sorting',
    videoId: 'nS9n_Yj_P94',
    videoTitle: 'Filtering & Sorting — WHERE, ORDER BY, LIMIT',
    theoryKeys: [
      'comparison-operators',
      'like-patterns',
      'in-between',
      'distinct-sorting',
      'combining-filters',
    ],
  },
  {
    id: 'module-3',
    title: 'Module 3: Joins',
    videoId: '9yeOJ0ZMUYw',
    videoTitle: 'SQL Joins Explained (Programming with Mosh)',
    theoryKeys: ['inner-join', 'left-join', 'join-cardinality', 'self-join', 'join-antipatterns'],
  },
  {
    id: 'module-4',
    title: 'Module 4: Aggregations',
    videoId: '0rB_P_shM8Y',
    videoTitle: 'GROUP BY & HAVING — Aggregations',
    theoryKeys: ['count-sum', 'avg-min-max', 'having-filters', 'rollup', 'window-intro'],
  },
  {
    id: 'module-5',
    title: 'Module 5: Query Optimization',
    videoId: '7S_tz1z_5bA',
    videoTitle: 'Indexes & Query Performance',
    theoryKeys: ['btree-indexes', 'explain-plans', 'explain-analyze', 'query-rewriting', 'production-guardrails'],
  },
  {
    id: 'module-6',
    title: 'Module 6: AutoTune AI',
    videoId: null,
    videoTitle: null,
    theoryKeys: ['autotune-arch', 'ml-risk', 'ai-rewrite', 'error-class', 'schema-tuning', 'final-exam'],
  },
];

const VIDEO_INTRO = {
  'module-2': `# WHERE & Logical Operators

Watch this verified lecture covering filtering with WHERE, comparison operators, AND/OR logic, and practical predicate patterns.

After watching the full video, the **Mark Video Complete** button will unlock.`,
  'module-3': `# SQL Joins Explained

**Programming with Mosh** walks through INNER, LEFT, RIGHT, and FULL joins with clear visual explanations.

Watch the full video to unlock theory chapters on join patterns.`,
  'module-4': `# GROUP BY & HAVING

**Alex The Analyst** explains aggregation, GROUP BY, and HAVING with real analytics examples.

Watch the full video to study COUNT/SUM, AVG, HAVING, ROLLUP, and window functions.`,
  'module-5': `# Database Indexing & Performance

**Mosh** covers B-tree indexes, sequential vs index scans, and practical performance tuning.

Watch the full video to unlock chapters on indexes, EXPLAIN, and production guardrails.`,
};

function buildQuizPayload(rawQuestions, globalOrder) {
  const lab = getLabForChapter(globalOrder);
  return packChapterData(quiz(rawQuestions), lab);
}

function getAllChaptersFlat() {
  const flat = [];
  let globalOrder = 1;

  MODULES.forEach((mod) => {
    const hasVideo = Boolean(mod.videoId);

    for (let i = 0; i < 6; i++) {
      const isVideoSlot = hasVideo && i === 0;
      const lab = getLabForChapter(globalOrder);

      if (isVideoSlot) {
        const videoQuestions = VIDEO_QUIZZES[mod.id] || [];
        flat.push({
          moduleId: mod.id,
          moduleTitle: mod.title,
          order: i + 1,
          globalOrder,
          title: `${mod.title} — ${mod.videoTitle}`,
          type: 'VIDEO',
          videoUrl: mod.videoId,
          theoryContent: VIDEO_INTRO[mod.id] || `# ${mod.videoTitle}\n\nWatch the module overview video, then mark it complete.`,
          quizData: buildQuizPayload(videoQuestions, globalOrder),
        });
      } else {
        const keyIndex = hasVideo ? i - 1 : i;
        const key = mod.theoryKeys[keyIndex];
        const { theoryContent, quizData: rawQuiz } = getContent(key);
        const topicTitle = theoryContent.match(/^# (.+)/m)?.[1] || key;
        const questions = Array.isArray(rawQuiz) ? rawQuiz : rawQuiz?.questions || [];

        flat.push({
          moduleId: mod.id,
          moduleTitle: mod.title,
          order: i + 1,
          globalOrder,
          title: `Chapter ${globalOrder}: ${topicTitle}`,
          type: 'THEORY',
          videoUrl: null,
          theoryContent,
          quizData: { questions, practiceLab: lab },
        });
      }

      globalOrder++;
    }
  });

  return flat;
}

function getModulesWithChapters() {
  const flat = getAllChaptersFlat();
  return MODULES.map((mod) => ({
    ...mod,
    chapters: flat.filter((c) => c.moduleId === mod.id),
  }));
}

module.exports = { MODULES, getModulesWithChapters, getAllChaptersFlat };
