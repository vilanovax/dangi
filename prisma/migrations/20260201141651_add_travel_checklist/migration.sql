-- CreateTable
CREATE TABLE "TravelChecklistItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TravelChecklistItem_projectId_status_idx" ON "TravelChecklistItem"("projectId", "status");

-- CreateIndex
CREATE INDEX "TravelChecklistItem_status_completedAt_idx" ON "TravelChecklistItem"("status", "completedAt");

-- AddForeignKey
ALTER TABLE "TravelChecklistItem" ADD CONSTRAINT "TravelChecklistItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelChecklistItem" ADD CONSTRAINT "TravelChecklistItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
