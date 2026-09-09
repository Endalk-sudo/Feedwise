-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "themes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "rootCause" TEXT;
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "suggestedAction" TEXT;
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "contextTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "ownerReply" TEXT;
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "internalNote" TEXT;
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "correctedByHuman" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Feedback_organizationId_status_idx" ON "Feedback"("organizationId", "status");
