-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "practiceQuestion" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "targetSql" TEXT;

-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "quizPassed" BOOLEAN NOT NULL DEFAULT false;
