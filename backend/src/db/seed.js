const { PrismaClient } = require('@prisma/client');
const { MODULES, getAllChaptersFlat } = require('./seedContent');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AutoTune Academy (30 chapters × 5 modules)...');

  // Clear dependent data
  await prisma.quizResult.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.course.deleteMany();

  const allChapters = getAllChaptersFlat();

  for (const mod of MODULES) {
    const course = await prisma.course.create({
      data: {
        id: mod.id,
        title: mod.title,
        description: mod.description,
      },
    });

    const moduleChapters = allChapters.filter((c) => c.moduleId === mod.id);

    for (const ch of moduleChapters) {
      const chapter = await prisma.chapter.create({
        data: {
          title: ch.title,
          content: ch.content,
          videoUrl: ch.videoUrl,
          practiceSql: ch.practiceSql,
          order: ch.order,
          globalOrder: ch.globalOrder,
          courseId: course.id,
        },
      });

      await prisma.quiz.create({
        data: {
          chapterId: chapter.id,
          questions: ch.quizQuestions,
        },
      });
    }

    console.log(`  ✓ ${mod.title} — ${moduleChapters.length} chapters`);
  }

  const total = await prisma.chapter.count();
  const quizzes = await prisma.quiz.count();
  console.log(`✅ Seeded ${total} chapters and ${quizzes} quizzes (20 questions each)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
