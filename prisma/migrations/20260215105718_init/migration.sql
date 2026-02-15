-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PARTNER');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'PROCESSING', 'QUOTING', 'QUOTED', 'ACCEPTED', 'UNDERWRITING', 'APPROVED', 'CLOSING', 'CLOSED', 'DECLINED', 'LOST');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('PERMANENT_MORTGAGE', 'BRIDGE', 'LAND', 'CONSTRUCTION', 'SBA', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ACQUISITION', 'REFINANCE');

-- CreateEnum
CREATE TYPE "LoanPosition" AS ENUM ('FIRST_MORTGAGE', 'SUBORDINATE');

-- CreateEnum
CREATE TYPE "Occupancy" AS ENUM ('OWNER_OCCUPIED', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('MULTIFAMILY', 'RETAIL', 'OFFICE', 'INDUSTRIAL', 'MIXED_USE', 'HOSPITALITY', 'LAND', 'SELF_STORAGE', 'HEALTHCARE', 'SHORT_TERM_RENTALS', 'OTHER');

-- CreateEnum
CREATE TYPE "DealEventType" AS ENUM ('STAGE_CHANGE', 'NOTE', 'LENDER_ASSIGNED', 'LENDER_REMOVED', 'COMMISSION_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('INTERNAL', 'PARTNER', 'BORROWER');

-- CreateEnum
CREATE TYPE "DealLenderStatus" AS ENUM ('ASSIGNED', 'CONTACTED', 'CONSIDERED', 'PASSED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('ESTIMATED', 'CONFIRMED', 'PAID');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "partnerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "defaultCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Borrower" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "businessName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Borrower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "assignedAdminId" TEXT,
    "assignedLenderId" TEXT,
    "loanType" "LoanType" NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "loanPosition" "LoanPosition" NOT NULL DEFAULT 'FIRST_MORTGAGE',
    "propertyType" "PropertyType" NOT NULL DEFAULT 'OTHER',
    "occupancy" "Occupancy" NOT NULL DEFAULT 'INVESTMENT',
    "propertyAddress" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "noi" DOUBLE PRECISION,
    "noiNotAvailable" BOOLEAN NOT NULL DEFAULT false,
    "signedPurchaseAgreement" BOOLEAN NOT NULL DEFAULT false,
    "inPlaceOccupancy" DOUBLE PRECISION,
    "loanAmountRequested" DOUBLE PRECISION NOT NULL,
    "loanAmountClosed" DOUBLE PRECISION,
    "targetLtv" DOUBLE PRECISION,
    "estimatedCloseDate" TIMESTAMP(3),
    "recourseAcceptance" BOOLEAN NOT NULL DEFAULT true,
    "partnerCompensation" DOUBLE PRECISION,
    "propertyState" VARCHAR(50) NOT NULL DEFAULT '',
    "propertyCity" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'SUBMITTED',
    "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declineReason" TEXT,
    "lostReason" TEXT,
    "partnerNotes" TEXT,
    "referralSource" TEXT,
    "enableClientTracking" BOOLEAN NOT NULL DEFAULT true,
    "borrowerAccessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealEvent" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "actorId" TEXT,
    "eventType" "DealEventType" NOT NULL,
    "fromStage" "DealStage",
    "toStage" "DealStage",
    "note" TEXT,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'INTERNAL',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lender" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "minLoanAmount" DOUBLE PRECISION,
    "maxLoanAmount" DOUBLE PRECISION,
    "coverageStates" TEXT[],
    "propertyTypes" TEXT[],
    "transactionTypes" TEXT[],
    "lenderType" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rawImportData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealLender" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "status" "DealLenderStatus" NOT NULL DEFAULT 'CONSIDERED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealLender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'ESTIMATED',
    "grossCommission" DOUBLE PRECISION,
    "partnerPct" DOUBLE PRECISION NOT NULL,
    "partnerAmount" DOUBLE PRECISION,
    "closedLoanAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_partnerId_idx" ON "User"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_email_key" ON "Partner"("email");

-- CreateIndex
CREATE INDEX "Partner_email_idx" ON "Partner"("email");

-- CreateIndex
CREATE INDEX "Partner_isActive_idx" ON "Partner"("isActive");

-- CreateIndex
CREATE INDEX "Borrower_email_idx" ON "Borrower"("email");

-- CreateIndex
CREATE INDEX "Borrower_businessName_idx" ON "Borrower"("businessName");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_referenceNumber_key" ON "Deal"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_borrowerAccessToken_key" ON "Deal"("borrowerAccessToken");

-- CreateIndex
CREATE INDEX "Deal_partnerId_idx" ON "Deal"("partnerId");

-- CreateIndex
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX "Deal_assignedAdminId_idx" ON "Deal"("assignedAdminId");

-- CreateIndex
CREATE INDEX "Deal_assignedLenderId_idx" ON "Deal"("assignedLenderId");

-- CreateIndex
CREATE INDEX "Deal_propertyState_idx" ON "Deal"("propertyState");

-- CreateIndex
CREATE INDEX "Deal_createdAt_idx" ON "Deal"("createdAt");

-- CreateIndex
CREATE INDEX "Deal_borrowerAccessToken_idx" ON "Deal"("borrowerAccessToken");

-- CreateIndex
CREATE INDEX "Deal_stage_createdAt_idx" ON "Deal"("stage", "createdAt");

-- CreateIndex
CREATE INDEX "Deal_partnerId_stage_idx" ON "Deal"("partnerId", "stage");

-- CreateIndex
CREATE INDEX "DealEvent_dealId_createdAt_idx" ON "DealEvent"("dealId", "createdAt");

-- CreateIndex
CREATE INDEX "DealEvent_dealId_visibility_idx" ON "DealEvent"("dealId", "visibility");

-- CreateIndex
CREATE INDEX "Lender_isActive_idx" ON "Lender"("isActive");

-- CreateIndex
CREATE INDEX "Lender_minLoanAmount_idx" ON "Lender"("minLoanAmount");

-- CreateIndex
CREATE INDEX "Lender_maxLoanAmount_idx" ON "Lender"("maxLoanAmount");

-- CreateIndex
CREATE INDEX "DealLender_dealId_idx" ON "DealLender"("dealId");

-- CreateIndex
CREATE INDEX "DealLender_lenderId_idx" ON "DealLender"("lenderId");

-- CreateIndex
CREATE UNIQUE INDEX "DealLender_dealId_lenderId_key" ON "DealLender"("dealId", "lenderId");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_dealId_key" ON "Commission"("dealId");

-- CreateIndex
CREATE INDEX "Commission_partnerId_idx" ON "Commission"("partnerId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Commission_partnerId_status_idx" ON "Commission"("partnerId", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "Borrower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_assignedLenderId_fkey" FOREIGN KEY ("assignedLenderId") REFERENCES "Lender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealLender" ADD CONSTRAINT "DealLender_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealLender" ADD CONSTRAINT "DealLender_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "Lender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
