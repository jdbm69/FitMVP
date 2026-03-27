-- CreateTable
CREATE TABLE "public"."Member" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Membership" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CheckIn" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "public"."Member"("email");

-- CreateIndex
CREATE INDEX "Member_lastName_firstName_idx" ON "public"."Member"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "public"."Plan"("name");

-- CreateIndex
CREATE INDEX "Membership_memberId_startsAt_idx" ON "public"."Membership"("memberId", "startsAt");

-- CreateIndex
CREATE INDEX "Membership_memberId_cancelledAt_idx" ON "public"."Membership"("memberId", "cancelledAt");

-- CreateIndex
CREATE INDEX "CheckIn_memberId_createdAt_idx" ON "public"."CheckIn"("memberId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CheckIn" ADD CONSTRAINT "CheckIn_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
