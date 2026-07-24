import { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/AppError.js";
import * as service from "./guest-list.service.js";
import {
  bulkCreateGuestListEntrySchema,
  createGuestListEntrySchema,
  migrateRsvpsToGuestListSchema,
  updateGuestListEntrySchema,
} from "./validation/guest-list-entry.schema.js";

const sendError = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  console.error(fallback, error);
  return res.status(500).json({
    error: fallback,
    ...(process.env.NODE_ENV === "production" || !(error instanceof Error)
      ? {}
      : { detail: error.message }),
  });
};

export const getGuestListByEvent = async (req: Request, res: Response) => {
  try {
    const entries = await service.getGuestListByEvent(req.params.eventId as string);
    return res.status(200).json(entries);
  } catch (error) {
    return sendError(res, error, "Failed to fetch guest list");
  }
};

export const createGuestListEntry = async (req: Request, res: Response) => {
  const result = createGuestListEntrySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: z.treeifyError(result.error) });
  }

  try {
    const entry = await service.createGuestListEntry(result.data);
    return res.status(201).json(entry);
  } catch (error) {
    return sendError(res, error, "Failed to create guest list entry");
  }
};

export const createGuestListEntries = async (req: Request, res: Response) => {
  const result = bulkCreateGuestListEntrySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: z.treeifyError(result.error) });
  }

  try {
    const entries = await service.createGuestListEntries(result.data.entries);
    return res.status(201).json(entries);
  } catch (error) {
    return sendError(res, error, "Failed to create guest list entries");
  }
};

export const migrateRsvpsToGuestList = async (req: Request, res: Response) => {
  const result = migrateRsvpsToGuestListSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: z.treeifyError(result.error) });
  }

  try {
    const migration = await service.migrateRsvpsToGuestList(result.data);
    return res.status(200).json(migration);
  } catch (error) {
    return sendError(res, error, "Failed to migrate RSVPs to guest list");
  }
};

export const updateGuestListEntry = async (req: Request, res: Response) => {
  const result = updateGuestListEntrySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: z.treeifyError(result.error) });
  }

  try {
    const entry = await service.updateGuestListEntry(
      req.params.id as string,
      result.data
    );
    return res.status(200).json(entry);
  } catch (error) {
    return sendError(res, error, "Failed to update guest list entry");
  }
};

export const deleteGuestListEntry = async (req: Request, res: Response) => {
  try {
    await service.deleteGuestListEntry(req.params.id as string);
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error, "Failed to delete guest list entry");
  }
};
