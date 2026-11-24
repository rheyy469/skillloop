-- Additive non-destructive migration: Persist P1/P2 features in PostgreSQL
-- (LearningMilestone, UserSettings, DirectMessage, CommunityGroup)

-- CreateTable
CREATE TABLE "LearningMilestone" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" UUID NOT NULL,
    "notifyNewRequest" BOOLEAN NOT NULL DEFAULT true,
    "notifyRequestAccepted" BOOLEAN NOT NULL DEFAULT true,
    "notifySessionUpdates" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewFeedback" BOOLEAN NOT NULL DEFAULT true,
    "showTimezonePublicly" BOOLEAN NOT NULL DEFAULT true,
    "showPortfolioPublicly" BOOLEAN NOT NULL DEFAULT true,
    "showHistoryPublicly" BOOLEAN NOT NULL DEFAULT true,
    "interfaceLanguage" TEXT NOT NULL DEFAULT 'id',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "isReported" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "skillFocus" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "meetingLink" TEXT,
    "scheduleNote" TEXT NOT NULL,
    "creatorId" UUID NOT NULL,
    "memberIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningMilestone_userId_idx" ON "LearningMilestone"("userId");

-- CreateIndex
CREATE INDEX "LearningMilestone_requestId_idx" ON "LearningMilestone"("requestId");

-- CreateIndex
CREATE INDEX "DirectMessage_requestId_createdAt_idx" ON "DirectMessage"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_recipientId_readAt_idx" ON "DirectMessage"("recipientId", "readAt");

-- CreateIndex
CREATE INDEX "CommunityGroup_creatorId_idx" ON "CommunityGroup"("creatorId");

-- CreateIndex
CREATE INDEX "CommunityGroup_createdAt_idx" ON "CommunityGroup"("createdAt");

-- AddForeignKey
ALTER TABLE "LearningMilestone" ADD CONSTRAINT "LearningMilestone_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CollaborationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMilestone" ADD CONSTRAINT "LearningMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CollaborationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityGroup" ADD CONSTRAINT "CommunityGroup_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
