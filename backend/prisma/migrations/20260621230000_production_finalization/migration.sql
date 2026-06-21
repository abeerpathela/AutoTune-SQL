-- Production finalization: dedicated lab columns + certificate dedupe constraint

ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "practiceQuery" TEXT;
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "expectedResult" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_userId_type_key" ON "Certificate"("userId", "type");
