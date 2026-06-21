-- Academy focus mode & video watch tracking
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "videoWatched" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "quizAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UserProgress" ADD COLUMN IF NOT EXISTS "focusViolations" INTEGER NOT NULL DEFAULT 0;
