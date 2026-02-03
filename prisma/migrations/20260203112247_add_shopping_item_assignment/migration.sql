-- AlterTable
ALTER TABLE "ShoppingItem" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "checkedAt" TIMESTAMP(3),
ADD COLUMN     "checkedById" TEXT;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
