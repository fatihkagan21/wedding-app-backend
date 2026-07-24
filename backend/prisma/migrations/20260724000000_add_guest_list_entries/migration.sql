CREATE TABLE "GuestListEntry" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "side" TEXT NOT NULL DEFAULT 'shared',
    "plannedGuestCount" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT,
    "invitationStatus" TEXT NOT NULL DEFAULT 'not-sent',
    "forecastStatus" TEXT NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestListEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GuestListEntry_eventId_idx" ON "GuestListEntry"("eventId");

ALTER TABLE "GuestListEntry"
ADD CONSTRAINT "GuestListEntry_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
