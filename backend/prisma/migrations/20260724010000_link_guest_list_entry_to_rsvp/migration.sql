ALTER TABLE "GuestListEntry" ADD COLUMN "rsvpId" TEXT;

CREATE UNIQUE INDEX "GuestListEntry_rsvpId_key" ON "GuestListEntry"("rsvpId");

ALTER TABLE "GuestListEntry"
ADD CONSTRAINT "GuestListEntry_rsvpId_fkey"
FOREIGN KEY ("rsvpId") REFERENCES "Rsvp"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
