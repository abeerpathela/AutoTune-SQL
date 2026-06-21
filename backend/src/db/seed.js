const { PrismaClient } = require('@prisma/client');
const { getModulesWithChapters } = require('./academyChapters');
const { getLabForChapter } = require('./chapterLabs');
const { invalidateAcademyCache } = require('../services/academyCacheService');

const prisma = new PrismaClient();

/**
 * Guaranteed embeddable YouTube IDs — bare 11-char strings ONLY.
 * Mapped exclusively to the first (Video Lecture) chapter of modules 2–5.
 */
const VERIFIED_MODULE_VIDEOS = {
  'module-1': null,
  'module-2': 'nS9n_Yj_P94', // Filtering & Sorting
  'module-3': '9yeOJ0ZMUYw', // Joins (verified working)
  'module-4': '0rB_P_shM8Y', // Aggregations
  'module-5': '7S_tz1z_5bA', // Optimization
  'module-6': null,
};

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function normalizeVideoId(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  const match =
    trimmed.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ||
    trimmed.match(/^([a-zA-Z0-9_-]{11})$/);
  return match?.[1] && YOUTUBE_ID_RE.test(match[1]) ? match[1] : null;
}

function resolveChapterVideoUrl(ch, moduleId) {
  if (ch.type !== 'VIDEO') return null;

  const verifiedId = VERIFIED_MODULE_VIDEOS[moduleId];
  if (!verifiedId) return null;

  const fromChapter = normalizeVideoId(ch.videoUrl);
  if (fromChapter && fromChapter === verifiedId) return fromChapter;

  return verifiedId;
}

async function main() {
  console.log('🌱 Seeding AutoTune LMS (verified YouTube IDs — bare ID strings only)...');

  await prisma.quizResult.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.course.deleteMany();

  const modules = getModulesWithChapters();

  for (const mod of modules) {
    const course = await prisma.course.create({
      data: { id: mod.id, title: mod.title, description: `${mod.title} learning track` },
    });

    for (const ch of mod.chapters) {
      const videoUrl = resolveChapterVideoUrl(ch, mod.id);
      const lab = getLabForChapter(ch.globalOrder);

      await prisma.chapter.create({
        data: {
          title: ch.title,
          type: ch.type,
          videoUrl,
          theoryContent: ch.theoryContent,
          practiceQuery: lab.practiceQuery,
          expectedResult: lab.expectedResult,
          quizData: ch.quizData,
          order: ch.order,
          globalOrder: ch.globalOrder,
          courseId: course.id,
        },
      });

      if (ch.type === 'VIDEO') {
        console.log(`    📺 Ch ${ch.globalOrder}: videoUrl="${videoUrl ?? 'null'}"`);
      }
    }

    console.log(`  ✓ ${mod.title} — ${mod.chapters.length} chapters`);
  }

  const videoChapters = await prisma.chapter.findMany({
    where: { type: 'VIDEO' },
    select: { globalOrder: true, title: true, videoUrl: true },
    orderBy: { globalOrder: 'asc' },
  });

  console.log('\n📋 Verified video chapters:');
  videoChapters.forEach((v) => {
    console.log(`   ${v.globalOrder}. ${v.title} → ${v.videoUrl}`);
  });

  const total = await prisma.chapter.count();
  await invalidateAcademyCache();
  console.log(`\n✅ Seeded ${total} LMS chapters (Redis cache invalidated)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
