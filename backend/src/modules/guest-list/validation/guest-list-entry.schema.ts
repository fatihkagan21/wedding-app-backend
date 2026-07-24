import { z } from "zod";
import {
  forecastStatuses,
  guestSides,
  invitationStatuses,
} from "../dto/guest-list-entry.dto.js";

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional().transform((value) => value || undefined);

const updatableOptionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional().transform((value) => {
    if (value === undefined) return undefined;
    return value || null;
  });

export const createGuestListEntrySchema = z.object({
  eventId: z.string().uuid(),
  displayName: z.string().trim().min(2).max(120),
  side: z.enum(guestSides).default("shared"),
  plannedGuestCount: z.number().int().min(1).max(20).default(1),
  phone: optionalText(40),
  invitationStatus: z.enum(invitationStatuses).default("not-sent"),
  forecastStatus: z.enum(forecastStatuses).default("unknown"),
  notes: optionalText(500),
});

export const updateGuestListEntrySchema = z.object({
  displayName: z.string().trim().min(2).max(120).optional(),
  side: z.enum(guestSides).optional(),
  plannedGuestCount: z.number().int().min(1).max(20).optional(),
  phone: updatableOptionalText(40),
  invitationStatus: z.enum(invitationStatuses).optional(),
  forecastStatus: z.enum(forecastStatuses).optional(),
  notes: updatableOptionalText(500),
}).refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field is required",
  });

export const bulkCreateGuestListEntrySchema = z.object({
  entries: z.array(createGuestListEntrySchema).min(1).max(500),
});

export const migrateRsvpsToGuestListSchema = z.object({
  eventId: z.string().uuid().optional(),
  dryRun: z.boolean().optional().default(false),
});
