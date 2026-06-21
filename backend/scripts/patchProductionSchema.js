const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "practiceQuery" TEXT'
  );
  await prisma.$executeRawUnsafe(
    'ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "expectedResult" JSONB'
  );

  const dupGroups = await prisma.$queryRawUnsafe(`
    SELECT "userId", type, array_agg(id ORDER BY "createdAt" DESC) AS ids
    FROM "Certificate"
    GROUP BY "userId", type
    HAVING COUNT(*) > 1
  `);

  for (const row of dupGroups) {
    const [, ...drop] = row.ids;
    for (const id of drop) {
      await prisma.certificate.delete({ where: { id } });
    }
  }

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_userId_type_key"
    ON "Certificate"("userId", type)
  `);

  console.log(`Schema patched. Removed duplicates from ${dupGroups.length} certificate groups.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
