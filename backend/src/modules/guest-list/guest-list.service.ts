import { AppError } from "../../shared/errors/AppError.js";
import { mapRsvpToGuestListEntry } from "../../scripts/rsvp-guest-list-mapping.js";
import * as eventRepo from "../event/event.repository.js";
import {
  CreateGuestListEntryDto,
  UpdateGuestListEntryDto,
} from "./dto/guest-list-entry.dto.js";
import * as repo from "./guest-list.repository.js";

export interface MigrateRsvpsToGuestListOptions {
  eventId?: string;
  dryRun?: boolean;
}

export interface MigrateRsvpsToGuestListResult {
  dryRun: boolean;
  totalRsvps: number;
  alreadyMigrated: number;
  pending: number;
  created: number;
  skippedExisting: number;
}

const requireEvent = async (eventId: string) => {
  const event = await eventRepo.getEventById(eventId);
  if (!event) {
    throw new AppError("Event not found", 404);
  }
};

const isUniqueConstraintError = (error: unknown): boolean => {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "P2002";
};

export const getGuestListByEvent = async (eventId: string) => {
  await requireEvent(eventId);
  return repo.getGuestListByEvent(eventId);
};

export const createGuestListEntry = async (data: CreateGuestListEntryDto) => {
  await requireEvent(data.eventId);
  return repo.createGuestListEntry(data);
};

export const createGuestListEntries = async (
  entries: CreateGuestListEntryDto[]
) => {
  const eventIds = new Set(entries.map((entry) => entry.eventId));
  if (eventIds.size !== 1) {
    throw new AppError("Bulk entries must belong to the same event", 400);
  }

  await requireEvent(entries[0].eventId);
  return repo.createGuestListEntries(entries);
};

export const migrateRsvpsToGuestList = async (
  options: MigrateRsvpsToGuestListOptions
): Promise<MigrateRsvpsToGuestListResult> => {
  if (options.eventId) {
    await requireEvent(options.eventId);
  }

  const rsvps = await repo.getRsvpsForGuestListMigration(options.eventId);
  if (!rsvps.length) {
    return {
      dryRun: Boolean(options.dryRun),
      totalRsvps: 0,
      alreadyMigrated: 0,
      pending: 0,
      created: 0,
      skippedExisting: 0,
    };
  }

  const rsvpIds = rsvps.map((rsvp) => rsvp.id);
  const migratedRows = await repo.getMigratedGuestListRsvpIds(rsvpIds);
  const migratedRsvpIds = new Set(
    migratedRows
      .map((entry) => entry.rsvpId)
      .filter((rsvpId): rsvpId is string => Boolean(rsvpId))
  );
  const pendingRsvps = rsvps.filter((rsvp) => !migratedRsvpIds.has(rsvp.id));
  const alreadyMigrated = migratedRsvpIds.size;
  const pending = pendingRsvps.length;

  if (options.dryRun || !pending) {
    return {
      dryRun: Boolean(options.dryRun),
      totalRsvps: rsvps.length,
      alreadyMigrated,
      pending,
      created: 0,
      skippedExisting: alreadyMigrated,
    };
  }

  let created = 0;
  let skippedDuringCreate = 0;

  for (const rsvp of pendingRsvps) {
    try {
      await repo.createMigratedGuestListEntry(mapRsvpToGuestListEntry(rsvp));
      created += 1;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      skippedDuringCreate += 1;
    }
  }

  return {
    dryRun: false,
    totalRsvps: rsvps.length,
    alreadyMigrated,
    pending,
    created,
    skippedExisting: alreadyMigrated + skippedDuringCreate,
  };
};

export const updateGuestListEntry = async (
  id: string,
  data: UpdateGuestListEntryDto
) => {
  const existing = await repo.getGuestListEntryById(id);
  if (!existing) {
    throw new AppError("Guest list entry not found", 404);
  }

  return repo.updateGuestListEntry(id, data);
};

export const deleteGuestListEntry = async (id: string) => {
  const existing = await repo.getGuestListEntryById(id);
  if (!existing) {
    throw new AppError("Guest list entry not found", 404);
  }

  return repo.deleteGuestListEntry(id);
};
