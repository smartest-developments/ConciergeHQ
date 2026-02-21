-- Create enums
CREATE TYPE "RequestCategory" AS ENUM ('ELECTRONICS', 'HOME_APPLIANCES', 'SPORTS_EQUIPMENT');
CREATE TYPE "ItemCondition" AS ENUM ('NEW', 'USED');
CREATE TYPE "RequestUrgency" AS ENUM ('STANDARD', 'FAST', 'CRITICAL');
CREATE TYPE "RequestStatus" AS ENUM ('FEE_PENDING', 'FEE_PAID', 'SOURCING', 'PROPOSAL_PUBLISHED', 'PROPOSAL_EXPIRED', 'COMPLETED', 'CANCELED');
CREATE TYPE "RequestCountry" AS ENUM ('AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK');

-- Create tables
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "SourcingRequest" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "budgetChf" DECIMAL(10,2) NOT NULL,
  "specs" TEXT NOT NULL,
  "category" "RequestCategory" NOT NULL,
  "condition" "ItemCondition" NOT NULL,
  "country" "RequestCountry" NOT NULL,
  "urgency" "RequestUrgency" NOT NULL,
  "sourcingFeeChf" DECIMAL(10,2) NOT NULL,
  "status" "RequestStatus" NOT NULL,
  "feePaidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourcingRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Proposal" (
  "id" SERIAL PRIMARY KEY,
  "requestId" INTEGER NOT NULL,
  "merchantName" TEXT NOT NULL,
  "externalUrl" TEXT NOT NULL,
  "summary" TEXT,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "actedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Proposal_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "SourcingRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "RequestStatusEvent" (
  "id" SERIAL PRIMARY KEY,
  "requestId" INTEGER NOT NULL,
  "fromStatus" "RequestStatus",
  "toStatus" "RequestStatus" NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequestStatusEvent_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "SourcingRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "SourcingRequest_userId_idx" ON "SourcingRequest"("userId");
CREATE INDEX "RequestStatusEvent_requestId_idx" ON "RequestStatusEvent"("requestId");
CREATE INDEX "Proposal_requestId_idx" ON "Proposal"("requestId");
