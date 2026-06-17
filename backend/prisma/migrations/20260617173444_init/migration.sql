-- CreateTable
CREATE TABLE "QueryLog" (
    "id" TEXT NOT NULL,
    "originalQuery" TEXT NOT NULL,
    "optimizedQuery" TEXT,
    "executionTime" DOUBLE PRECISION,
    "isSlow" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryLog_pkey" PRIMARY KEY ("id")
);
