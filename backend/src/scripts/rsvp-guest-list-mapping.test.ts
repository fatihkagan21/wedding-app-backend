import assert from "node:assert/strict";
import test from "node:test";
import { mapRsvpToGuestListEntry } from "./rsvp-guest-list-mapping.js";

test("maps an attending RSVP to a sent and coming guest entry", () => {
  const result = mapRsvpToGuestListEntry({
    id: "rsvp-1",
    eventId: "event-1",
    contactFullName: "  Ayşe Yılmaz ",
    attending: true,
    attendeeCount: 2,
    attendees: ["Ayşe Yılmaz", "Ali Yılmaz"],
    notes: "Vejetaryen menü",
  });

  assert.deepEqual(result, {
    eventId: "event-1",
    rsvpId: "rsvp-1",
    displayName: "Ayşe Yılmaz",
    side: "shared",
    plannedGuestCount: 2,
    invitationStatus: "sent",
    forecastStatus: "coming",
    notes: "Vejetaryen menü | RSVP katılımcıları: Ayşe Yılmaz, Ali Yılmaz",
  });
});

test("maps a declined RSVP to a not-coming guest entry", () => {
  const result = mapRsvpToGuestListEntry({
    id: "rsvp-2",
    eventId: "event-1",
    contactFullName: "Mehmet Kaya",
    attending: false,
    attendeeCount: null,
    attendees: null,
    notes: null,
  });

  assert.equal(result.plannedGuestCount, 1);
  assert.equal(result.invitationStatus, "sent");
  assert.equal(result.forecastStatus, "not-coming");
  assert.equal(result.notes, null);
});
