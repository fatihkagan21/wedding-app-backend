import { prisma } from "../prisma.js";
import {
  CreateGuestListEntryDto,
  UpdateGuestListEntryDto,
} from "./dto/guest-list-entry.dto.js";
import type { MigratedGuestListEntry } from "../../scripts/rsvp-guest-list-mapping.js";

export const getGuestListByEvent = (eventId: string) => {
  return prisma.guestListEntry.findMany({
    where: { eventId },
    orderBy: [{ createdAt: "asc" }, { displayName: "asc" }],
  });
};

export const getGuestListEntryById = (id: string) => {
  return prisma.guestListEntry.findUnique({ where: { id } });
};

export const createGuestListEntry = (data: CreateGuestListEntryDto) => {
  return prisma.guestListEntry.create({ data });
};

export const createGuestListEntries = (entries: CreateGuestListEntryDto[]) => {
  return prisma.$transaction(
    entries.map((data) => prisma.guestListEntry.create({ data }))
  );
};

export const getRsvpsForGuestListMigration = (eventId?: string) => {
  return prisma.rsvp.findMany({
    where: eventId ? { eventId } : undefined,
    orderBy: { createdAt: "asc" },
  });
};

export const getMigratedGuestListRsvpIds = (rsvpIds: string[]) => {
  return prisma.guestListEntry.findMany({
    where: { rsvpId: { in: rsvpIds } },
    select: { rsvpId: true },
  });
};

export const createMigratedGuestListEntry = (entry: MigratedGuestListEntry) => {
  return prisma.guestListEntry.create({ data: entry });
};

export const updateGuestListEntry = (
  id: string,
  data: UpdateGuestListEntryDto
) => {
  return prisma.guestListEntry.update({ where: { id }, data });
};

export const deleteGuestListEntry = (id: string) => {
  return prisma.guestListEntry.delete({ where: { id } });
};
