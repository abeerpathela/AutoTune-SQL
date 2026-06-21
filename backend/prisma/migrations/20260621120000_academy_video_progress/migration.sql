-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "practiceSql" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "globalOrder" INTEGER;

-- Backfill globalOrder from course order before adding constraint
UPDATE "Chapter" c
SET "globalOrder" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "courseId", "order") AS rn
  FROM "Chapter"
) sub
WHERE c.id = sub.id AND c."globalOrder" IS NULL;

ALTER TABLE "Chapter" ALTER COLUMN "globalOrder" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Chapter_globalOrder_key" ON "Chapter"("globalOrder");

-- AlterTable UserProgress
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "isWatched" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "exerciseCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "quizScore" DOUBLE PRECISION;
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "isUnlocked" BOOLEAN NOT NULL DEFAULT false;
