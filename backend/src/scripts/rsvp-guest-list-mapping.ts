import { ForecastStatus } from "../modules/guest-list/dto/guest-list-entry.dto.js";

export interface MigrationRsvp {
  id: string;
  eventId: string;
  contactFullName: string;
  attending: boolean;
  attendeeCount: number | null;
  attendees: unknown;
  notes: string | null;
}

export interface MigratedGuestListEntry {
  eventId: string;
  rsvpId: string;
  displayName: string;
  side: "shared";
  plannedGuestCount: number;
  invitationStatus: "sent";
  forecastStatus: ForecastStatus;
  notes: string | null;
}

const getAttendeeNames = (attendees: unknown): string[] => {
  if (!Array.isArray(attendees)) return [];

  return attendees
    .filter((name): name is string => typeof name === "string")
    .map((name) => name.trim())
    .filter(Boolean);
};

export const mapRsvpToGuestListEntry = (
  rsvp: MigrationRsvp
): MigratedGuestListEntry => {
  const attendeeNames = getAttendeeNames(rsvp.attendees);
  const submittedCount = rsvp.attendeeCount ?? attendeeNames.length;
  const plannedGuestCount = rsvp.attending
    ? Math.min(20, Math.max(1, submittedCount))
    : 1;
  const noteParts = [
    rsvp.notes?.trim(),
    attendeeNames.length ? `RSVP katılımcıları: ${attendeeNames.join(", ")}` : undefined,
  ].filter((part): part is string => Boolean(part));

  return {
    eventId: rsvp.eventId,
    rsvpId: rsvp.id,
    displayName: rsvp.contactFullName.trim(),
    side: "shared",
    plannedGuestCount,
    invitationStatus: "sent",
    forecastStatus: rsvp.attending ? "coming" : "not-coming",
    notes: noteParts.length ? noteParts.join(" | ").slice(0, 500) : null,
  };
};
