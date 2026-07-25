export type GuestSide = 'bride' | 'groom' | 'shared';
export type InvitationStatus = 'not-sent' | 'sent';
export type ForecastStatus = 'coming' | 'not-coming' | 'unlikely' | 'unknown';

export interface GuestListEntry {
  id: string;
  eventId: string;
  rsvpId?: string;
  displayName: string;
  side: GuestSide;
  plannedGuestCount: number;
  phone?: string;
  invitationStatus: InvitationStatus;
  forecastStatus: ForecastStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateGuestListEntryPayload = Omit<
  GuestListEntry,
  'id' | 'rsvpId' | 'createdAt' | 'updatedAt'
>;

export type UpdateGuestListEntryPayload = Partial<
  Omit<CreateGuestListEntryPayload, 'eventId' | 'phone' | 'notes'>
> & {
  phone?: string | null;
  notes?: string | null;
};

export interface GuestListMigrationResult {
  dryRun: boolean;
  totalRsvps: number;
  alreadyMigrated: number;
  pending: number;
  created: number;
  skippedExisting: number;
}
