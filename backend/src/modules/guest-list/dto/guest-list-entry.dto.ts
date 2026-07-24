export const guestSides = ["bride", "groom", "shared"] as const;
export const invitationStatuses = ["not-sent", "sent"] as const;
export const forecastStatuses = [
  "coming",
  "not-coming",
  "likely",
  "unlikely",
  "unknown",
] as const;

export type GuestSide = (typeof guestSides)[number];
export type InvitationStatus = (typeof invitationStatuses)[number];
export type ForecastStatus = (typeof forecastStatuses)[number];

export interface CreateGuestListEntryDto {
  eventId: string;
  displayName: string;
  side: GuestSide;
  plannedGuestCount: number;
  phone?: string;
  invitationStatus: InvitationStatus;
  forecastStatus: ForecastStatus;
  notes?: string;
}

export type UpdateGuestListEntryDto = Partial<
  Omit<CreateGuestListEntryDto, "eventId" | "phone" | "notes">
> & {
  phone?: string | null;
  notes?: string | null;
};
