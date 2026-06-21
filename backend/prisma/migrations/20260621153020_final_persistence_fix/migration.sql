-- Conditional fixes (quizData column is added in a later migration on fresh installs)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Chapter' AND column_name = 'quizData'
  ) THEN
    ALTER TABLE "Chapter" ALTER COLUMN "quizData" DROP DEFAULT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'QuizResult' AND column_name = 'chapterId'
  ) THEN
    ALTER TABLE "QuizResult" ALTER COLUMN "chapterId" SET NOT NULL;
  END IF;
END $$;
