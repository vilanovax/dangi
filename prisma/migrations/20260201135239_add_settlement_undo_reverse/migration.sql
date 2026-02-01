-- AlterTable
ALTER TABLE "Settlement" ADD COLUMN     "referenceSettlementId" TEXT,
ADD COLUMN     "reversed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'confirmed',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'normal';

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "Settlement_referenceSettlementId_idx" ON "Settlement"("referenceSettlementId");

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_referenceSettlementId_fkey" FOREIGN KEY ("referenceSettlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
