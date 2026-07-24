import assert from "node:assert/strict";
import test from "node:test";
import {
  bulkCreateGuestListEntrySchema,
  createGuestListEntrySchema,
  migrateRsvpsToGuestListSchema,
  updateGuestListEntrySchema,
} from "./guest-list-entry.schema.js";

const eventId = "e6d91f60-d3e9-4f80-8ee6-62e3ffdc762a";

test("guest list entry validation applies planning defaults", () => {
  const result = createGuestListEntrySchema.parse({
    eventId,
    displayName: "  Ayşe Yılmaz  ",
  });

  assert.deepEqual(result, {
    eventId,
    displayName: "Ayşe Yılmaz",
    side: "shared",
    plannedGuestCount: 1,
    invitationStatus: "not-sent",
    forecastStatus: "unknown",
  });
});

test("guest list entry validation rejects empty updates", () => {
  assert.equal(updateGuestListEntrySchema.safeParse({}).success, false);
});

test("guest list entry validation allows optional fields to be cleared", () => {
  const result = updateGuestListEntrySchema.parse({ phone: "", notes: null });

  assert.deepEqual(result, { phone: null, notes: null });
});

test("bulk guest list validation accepts multiple entries", () => {
  const result = bulkCreateGuestListEntrySchema.safeParse({
    entries: [
      { eventId, displayName: "Ayşe Yılmaz" },
      { eventId, displayName: "Mehmet Kaya", plannedGuestCount: 2 },
    ],
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.entries.length, 2);
    assert.equal(result.data.entries[1].plannedGuestCount, 2);
  }
});

test("RSVP migration validation defaults to a real run", () => {
  const result = migrateRsvpsToGuestListSchema.parse({ eventId });

  assert.deepEqual(result, { eventId, dryRun: false });
});
