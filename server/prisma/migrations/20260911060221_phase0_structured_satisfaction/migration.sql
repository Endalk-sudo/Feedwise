-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "concreteIssue" TEXT,
ADD COLUMN     "costEstimate" DOUBLE PRECISION,
ADD COLUMN     "fixableProblem" BOOLEAN,
ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "retentionRisk" TEXT,
ADD COLUMN     "satisfactionEstimate" INTEGER,
ADD COLUMN     "verificationSource" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "themes" DROP DEFAULT,
ALTER COLUMN "contextTags" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Feedback_organizationId_satisfactionEstimate_idx" ON "Feedback"("organizationId", "satisfactionEstimate");

-- CreateIndex
CREATE INDEX "Feedback_organizationId_fixableProblem_idx" ON "Feedback"("organizationId", "fixableProblem");

-- CreateIndex
CREATE INDEX "Feedback_organizationId_retentionRisk_idx" ON "Feedback"("organizationId", "retentionRisk");
