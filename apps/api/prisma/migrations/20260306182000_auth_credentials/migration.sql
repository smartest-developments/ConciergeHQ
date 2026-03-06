-- Add credential persistence for email/password auth.
CREATE TABLE "UserCredential" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "failedAttemptCount" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserCredential_userId_key" ON "UserCredential"("userId");

ALTER TABLE "UserCredential"
ADD CONSTRAINT "UserCredential_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
