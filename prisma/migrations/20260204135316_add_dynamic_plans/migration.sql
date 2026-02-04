/*
  Warnings:

  - You are about to drop the column `plan` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "plan",
ADD COLUMN     "planId" TEXT;

-- DropEnum
DROP TYPE "Plan";

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emailsPerMonth" INTEGER NOT NULL DEFAULT 100,
    "maxBulkSend" INTEGER NOT NULL DEFAULT 10,
    "apiKeysMax" INTEGER NOT NULL DEFAULT 2,
    "templatesMax" INTEGER NOT NULL DEFAULT 5,
    "features" TEXT[],
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "basePlanId" TEXT NOT NULL,
    "emailsPerMonth" INTEGER NOT NULL,
    "maxBulkSend" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "features" TEXT[],
    "status" "PlanStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CustomPlan_userId_key" ON "CustomPlan"("userId");

-- AddForeignKey
ALTER TABLE "CustomPlan" ADD CONSTRAINT "CustomPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomPlan" ADD CONSTRAINT "CustomPlan_basePlanId_fkey" FOREIGN KEY ("basePlanId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
