-- LMS restructure: Chapter type + quizData, simplified UserProgress

CREATE TYPE "ChapterType" AS ENUM ('VIDEO', 'THEORY');

-- Drop legacy quiz FK chain
ALTER TABLE "QuizResult" DROP CONSTRAINT IF EXISTS "QuizResult_quizId_fkey";
DROP TABLE IF EXISTS "Quiz";

-- Rebuild UserProgress (drop status before enum)
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "videoCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "isCompleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "UserProgress" SET "videoCompleted" = COALESCE("isWatched", false) WHERE "videoCompleted" = false;
UPDATE "UserProgress" SET "isCompleted" = true WHERE COALESCE("status"::text, '') = 'COMPLETED';

ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "status";
ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "isWatched";
ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "exerciseCompleted";
ALTER TABLE "UserProgress" DROP COLUMN IF EXISTS "quizPassed";

DROP TYPE IF EXISTS "ProgressStatus";

ALTER TABLE "UserProgress" ALTER COLUMN "quizScore" TYPE INTEGER USING ROUND(COALESCE("quizScore", 0))::INTEGER;

-- Rebuild Chapter
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "type" "ChapterType" NOT NULL DEFAULT 'THEORY';
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "theoryContent" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "quizData" JSONB NOT NULL DEFAULT '[]';

UPDATE "Chapter" SET "theoryContent" = COALESCE("theoryContent", "content") WHERE "theoryContent" IS NULL;
UPDATE "Chapter" SET "quizData" = '[]'::jsonb WHERE "quizData" IS NULL;

ALTER TABLE "Chapter" ALTER COLUMN "theoryContent" SET NOT NULL;

ALTER TABLE "Chapter" DROP COLUMN IF EXISTS "content";
ALTER TABLE "Chapter" DROP COLUMN IF EXISTS "practiceSql";
ALTER TABLE "Chapter" DROP COLUMN IF EXISTS "practiceQuestion";
ALTER TABLE "Chapter" DROP COLUMN IF EXISTS "targetSql";

-- Rebuild QuizResult
ALTER TABLE "QuizResult" ADD COLUMN IF NOT EXISTS "chapterId" TEXT;
UPDATE "QuizResult" SET "chapterId" = "quizId" WHERE "chapterId" IS NULL AND "quizId" IS NOT NULL;
ALTER TABLE "QuizResult" DROP COLUMN IF EXISTS "quizId";
ALTER TABLE "QuizResult" ALTER COLUMN "score" TYPE INTEGER USING ROUND("score")::INTEGER;

DROP INDEX IF EXISTS "QuizResult_userId_quizId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "QuizResult_userId_chapterId_key" ON "QuizResult"("userId", "chapterId");
