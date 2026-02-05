-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('EMAIL_SENT', 'EMAIL_OPENED', 'EMAIL_CLICKED', 'EMAIL_BOUNCED', 'UNSUBSCRIBED', 'SUBSCRIBED', 'CONTACT_CREATED', 'CONTACT_UPDATED', 'LIST_ADDED', 'LIST_REMOVED');

-- CreateEnum
CREATE TYPE "RecipientStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED');

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "tags" TEXT[],
    "customFields" JSONB,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastEmailSent" TIMESTAMP(3),
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "emailsOpened" INTEGER NOT NULL DEFAULT 0,
    "emailsClicked" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactListMember" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactListMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactEvent" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" "RecipientStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Contact_status_idx" ON "Contact"("status");

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "List"("userId");

-- CreateIndex
CREATE INDEX "ContactListMember_contactId_idx" ON "ContactListMember"("contactId");

-- CreateIndex
CREATE INDEX "ContactListMember_listId_idx" ON "ContactListMember"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactListMember_contactId_listId_key" ON "ContactListMember"("contactId", "listId");

-- CreateIndex
CREATE INDEX "ContactEvent_contactId_idx" ON "ContactEvent"("contactId");

-- CreateIndex
CREATE INDEX "ContactEvent_type_idx" ON "ContactEvent"("type");

-- CreateIndex
CREATE INDEX "ContactEvent_createdAt_idx" ON "ContactEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CampaignRecipient_contactId_idx" ON "CampaignRecipient"("contactId");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_campaignId_contactId_key" ON "CampaignRecipient"("campaignId", "contactId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactListMember" ADD CONSTRAINT "ContactListMember_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactListMember" ADD CONSTRAINT "ContactListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEvent" ADD CONSTRAINT "ContactEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
