import { inject, Injectable } from '@angular/core';
import {
  CreateGuestListEntryPayload,
  GuestListEntry,
  GuestListMigrationResult,
  UpdateGuestListEntryPayload,
} from '../../models/guest-list-entry.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class GuestListService {
  private api = inject(ApiService);

  getByEvent(eventId: string, adminKey: string) {
    return this.api.get<GuestListEntry[]>(`/guest-list/event/${eventId}`, {
      headers: { 'x-admin-key': adminKey },
    });
  }

  create(payload: CreateGuestListEntryPayload, adminKey: string) {
    return this.api.post<GuestListEntry>('/guest-list', payload, {
      headers: { 'x-admin-key': adminKey },
    });
  }

  createBulk(entries: CreateGuestListEntryPayload[], adminKey: string) {
    return this.api.post<GuestListEntry[]>('/guest-list/bulk', { entries }, {
      headers: { 'x-admin-key': adminKey },
    });
  }

  migrateRsvps(eventId: string, adminKey: string, dryRun = false) {
    return this.api.post<GuestListMigrationResult>('/guest-list/migrate-rsvps', {
      eventId,
      dryRun,
    }, {
      headers: { 'x-admin-key': adminKey },
    });
  }

  update(id: string, payload: UpdateGuestListEntryPayload, adminKey: string) {
    return this.api.patch<GuestListEntry>(`/guest-list/${id}`, payload, {
      headers: { 'x-admin-key': adminKey },
    });
  }

  delete(id: string, adminKey: string) {
    return this.api.delete<void>(`/guest-list/${id}`, {
      headers: { 'x-admin-key': adminKey },
    });
  }
}
