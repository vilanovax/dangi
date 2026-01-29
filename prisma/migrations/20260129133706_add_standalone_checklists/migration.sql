-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "chargeYear" INTEGER,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackingOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "quantity" TEXT,
    "note" TEXT,
    "addedById" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "incomeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId" TEXT,
    "receivedById" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringId" TEXT,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomeCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "IncomeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "periodKey" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "categoryId" TEXT,
    "participantId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastProcessed" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "userId" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "checklistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistShare" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "userId" TEXT,
    "permission" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingItem_projectId_idx" ON "ShoppingItem"("projectId");

-- CreateIndex
CREATE INDEX "ShoppingItem_projectId_createdAt_idx" ON "ShoppingItem"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Income_projectId_incomeDate_idx" ON "Income"("projectId", "incomeDate" DESC);

-- CreateIndex
CREATE INDEX "Income_receivedById_idx" ON "Income"("receivedById");

-- CreateIndex
CREATE INDEX "Income_categoryId_idx" ON "Income"("categoryId");

-- CreateIndex
CREATE INDEX "IncomeCategory_projectId_idx" ON "IncomeCategory"("projectId");

-- CreateIndex
CREATE INDEX "Budget_projectId_periodKey_idx" ON "Budget"("projectId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_projectId_categoryId_periodKey_key" ON "Budget"("projectId", "categoryId", "periodKey");

-- CreateIndex
CREATE INDEX "RecurringTransaction_projectId_idx" ON "RecurringTransaction"("projectId");

-- CreateIndex
CREATE INDEX "RecurringTransaction_isActive_idx" ON "RecurringTransaction"("isActive");

-- CreateIndex
CREATE INDEX "RecurringTransaction_participantId_idx" ON "RecurringTransaction"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Checklist_shareCode_key" ON "Checklist"("shareCode");

-- CreateIndex
CREATE INDEX "Checklist_userId_isArchived_createdAt_idx" ON "Checklist"("userId", "isArchived", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Checklist_userId_category_idx" ON "Checklist"("userId", "category");

-- CreateIndex
CREATE INDEX "Checklist_shareCode_idx" ON "Checklist"("shareCode");

-- CreateIndex
CREATE INDEX "ChecklistItem_checklistId_order_idx" ON "ChecklistItem"("checklistId", "order");

-- CreateIndex
CREATE INDEX "ChecklistItem_checklistId_isChecked_idx" ON "ChecklistItem"("checklistId", "isChecked");

-- CreateIndex
CREATE INDEX "ChecklistShare_checklistId_idx" ON "ChecklistShare"("checklistId");

-- CreateIndex
CREATE INDEX "ChecklistShare_userId_idx" ON "ChecklistShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistShare_checklistId_userId_key" ON "ChecklistShare"("checklistId", "userId");

-- CreateIndex
CREATE INDEX "Category_projectId_idx" ON "Category"("projectId");

-- CreateIndex
CREATE INDEX "Expense_projectId_expenseDate_idx" ON "Expense"("projectId", "expenseDate" DESC);

-- CreateIndex
CREATE INDEX "Expense_projectId_categoryId_idx" ON "Expense"("projectId", "categoryId");

-- CreateIndex
CREATE INDEX "Expense_projectId_paidById_idx" ON "Expense"("projectId", "paidById");

-- CreateIndex
CREATE INDEX "Expense_periodKey_idx" ON "Expense"("periodKey");

-- CreateIndex
CREATE INDEX "Expense_paidById_idx" ON "Expense"("paidById");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateIndex
CREATE INDEX "ExpenseShare_participantId_idx" ON "ExpenseShare"("participantId");

-- CreateIndex
CREATE INDEX "ExpenseShare_expenseId_idx" ON "ExpenseShare"("expenseId");

-- CreateIndex
CREATE INDEX "Participant_userId_idx" ON "Participant"("userId");

-- CreateIndex
CREATE INDEX "Participant_projectId_idx" ON "Participant"("projectId");

-- CreateIndex
CREATE INDEX "Settlement_projectId_settledAt_idx" ON "Settlement"("projectId", "settledAt" DESC);

-- CreateIndex
CREATE INDEX "Settlement_fromId_idx" ON "Settlement"("fromId");

-- CreateIndex
CREATE INDEX "Settlement_toId_idx" ON "Settlement"("toId");

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IncomeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeCategory" ADD CONSTRAINT "IncomeCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistShare" ADD CONSTRAINT "ChecklistShare_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistShare" ADD CONSTRAINT "ChecklistShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
