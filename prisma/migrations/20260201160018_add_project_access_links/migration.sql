-- CreateTable
CREATE TABLE "ProjectAccessLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "scopes" TEXT NOT NULL DEFAULT '[]',
    "role" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAccessLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAccessLink_token_key" ON "ProjectAccessLink"("token");

-- CreateIndex
CREATE INDEX "ProjectAccessLink_projectId_idx" ON "ProjectAccessLink"("projectId");

-- CreateIndex
CREATE INDEX "ProjectAccessLink_token_idx" ON "ProjectAccessLink"("token");

-- CreateIndex
CREATE INDEX "ProjectAccessLink_isActive_idx" ON "ProjectAccessLink"("isActive");

-- AddForeignKey
ALTER TABLE "ProjectAccessLink" ADD CONSTRAINT "ProjectAccessLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
