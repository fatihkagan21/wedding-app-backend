import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { GuestListService } from '../../../core/services/guest-list.service';
import {
  CreateGuestListEntryPayload,
  ForecastStatus,
  GuestListEntry,
  GuestSide,
  InvitationStatus,
} from '../../../models/guest-list-entry.model';

interface GuestDraft {
  displayName: string;
  side: GuestSide;
  plannedGuestCount: number;
  phone: string;
  invitationStatus: InvitationStatus;
  forecastStatus: ForecastStatus;
  notes: string;
}

type GuestSortKey =
  | 'displayName'
  | 'plannedGuestCount'
  | 'side'
  | 'invitationStatus'
  | 'forecastStatus'
  | 'createdAt';
type SortDirection = 'asc' | 'desc';

const createEmptyDraft = (): GuestDraft => ({
  displayName: '',
  side: 'shared',
  plannedGuestCount: 1,
  phone: '',
  invitationStatus: 'not-sent',
  forecastStatus: 'unknown',
  notes: '',
});

@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guest-list.component.html',
  styleUrl: './guest-list.component.css',
})
export class GuestListComponent implements OnChanges {
  private guestListService = inject(GuestListService);

  @Input({ required: true }) eventId = '';
  @Input({ required: true }) adminKey = '';

  entries: GuestListEntry[] = [];
  searchTerm = '';
  sideFilter: 'all' | GuestSide = 'all';
  invitationFilter: 'all' | InvitationStatus = 'all';
  forecastFilter: 'all' | ForecastStatus = 'all';
  sortKey: GuestSortKey = 'displayName';
  sortDirection: SortDirection = 'asc';
  readonly pageSize = 10;
  currentPage = 1;
  draft: GuestDraft = createEmptyDraft();
  bulkText = '';
  bulkSide: GuestSide = 'shared';
  bulkInvitationStatus: InvitationStatus = 'not-sent';
  bulkForecast: ForecastStatus = 'unknown';
  showEntryForm = false;
  showBulkForm = false;
  editingId = '';
  updatingId = '';
  deletingId = '';
  loading = false;
  saving = false;
  migratingRsvps = false;
  errorMessage = '';
  feedbackMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventId'] && this.eventId && this.adminKey) {
      this.closeForms();
      this.loadEntries();
    }
  }

  get filteredEntries(): GuestListEntry[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('tr-TR');

    return this.entries.filter((entry) => {
      const matchesSide = this.sideFilter === 'all' || entry.side === this.sideFilter;
      const matchesInvitation = this.invitationFilter === 'all'
        || entry.invitationStatus === this.invitationFilter;
      const matchesForecast = this.forecastFilter === 'all'
        || entry.forecastStatus === this.forecastFilter;
      const searchableText = [
        entry.displayName,
        entry.phone ?? '',
        entry.notes ?? '',
      ].join(' ').toLocaleLowerCase('tr-TR');

      return matchesSide
        && matchesInvitation
        && matchesForecast
        && (!search || searchableText.includes(search));
    }).sort((a, b) => this.compareGuestEntries(a, b));
  }

  get paginatedEntries(): GuestListEntry[] {
    const startIndex = (this.activePage - 1) * this.pageSize;

    return this.filteredEntries.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredEntries.length / this.pageSize));
  }

  get activePage(): number {
    return Math.min(this.currentPage, this.totalPages);
  }

  get pageStart(): number {
    if (!this.filteredEntries.length) return 0;
    return (this.activePage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.activePage * this.pageSize, this.filteredEntries.length);
  }

  get plannedGuestTotal(): number {
    return this.entries.reduce((total, entry) => total + entry.plannedGuestCount, 0);
  }

  get sentInvitationGuestTotal(): number {
    return this.getGuestTotalByInvitation('sent', this.entries);
  }

  get comingGuestTotal(): number {
    return this.getGuestTotalByForecast('coming', this.entries);
  }

  get notComingGuestTotal(): number {
    return this.getGuestTotalByForecast('not-coming', this.entries);
  }

  get unlikelyGuestTotal(): number {
    return this.getGuestTotalByForecast('unlikely', this.entries);
  }

  get unknownGuestTotal(): number {
    return this.getGuestTotalByForecast('unknown', this.entries);
  }

  get currentPossibleGuestTotal(): number {
    return Math.max(
      0,
      this.sentInvitationGuestTotal - this.notComingGuestTotal - this.unlikelyGuestTotal
    );
  }

  get filteredEntryCount(): number {
    return this.filteredEntries.length;
  }

  get filteredGuestTotal(): number {
    return this.getGuestTotal(this.filteredEntries);
  }

  get filteredSentInvitationGuestTotal(): number {
    return this.getGuestTotalByInvitation('sent', this.filteredEntries);
  }

  get filteredCurrentPossibleGuestTotal(): number {
    return Math.max(
      0,
      this.filteredSentInvitationGuestTotal
        - this.getGuestTotalByForecast('not-coming', this.filteredEntries)
        - this.getGuestTotalByForecast('unlikely', this.filteredEntries)
    );
  }

  loadEntries(): void {
    if (!this.eventId) return;

    this.loading = true;
    this.errorMessage = '';
    this.guestListService.getByEvent(this.eventId, this.adminKey).subscribe({
      next: (entries) => {
        this.entries = entries;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Davetli listesi yüklenemedi.';
      },
    });
  }

  openCreateForm(): void {
    this.editingId = '';
    this.draft = createEmptyDraft();
    this.showBulkForm = false;
    this.showEntryForm = true;
    this.clearMessages();
  }

  openEditForm(entry: GuestListEntry): void {
    this.editingId = entry.id;
    this.draft = {
      displayName: entry.displayName,
      side: entry.side,
      plannedGuestCount: entry.plannedGuestCount,
      phone: entry.phone ?? '',
      invitationStatus: entry.invitationStatus,
      forecastStatus: entry.forecastStatus,
      notes: entry.notes ?? '',
    };
    this.showBulkForm = false;
    this.showEntryForm = true;
    this.clearMessages();
  }

  openBulkForm(): void {
    this.showEntryForm = false;
    this.showBulkForm = true;
    this.bulkText = '';
    this.clearMessages();
  }

  closeForms(): void {
    this.showEntryForm = false;
    this.showBulkForm = false;
    this.editingId = '';
    this.draft = createEmptyDraft();
  }

  saveEntry(): void {
    const displayName = this.draft.displayName.trim();
    if (displayName.length < 2) {
      this.errorMessage = 'Davetli adı en az 2 karakter olmalı.';
      return;
    }

    const payload: CreateGuestListEntryPayload = {
      eventId: this.eventId,
      displayName,
      side: this.draft.side,
      plannedGuestCount: this.normalizeGuestCount(this.draft.plannedGuestCount),
      phone: this.draft.phone.trim() || undefined,
      invitationStatus: this.draft.invitationStatus,
      forecastStatus: this.draft.forecastStatus,
      notes: this.draft.notes.trim() || undefined,
    };

    this.saving = true;
    this.clearMessages();

    if (this.editingId) {
      const updatePayload = {
        displayName: payload.displayName,
        side: payload.side,
        plannedGuestCount: payload.plannedGuestCount,
        phone: payload.phone ?? null,
        invitationStatus: payload.invitationStatus,
        forecastStatus: payload.forecastStatus,
        notes: payload.notes ?? null,
      };
      this.guestListService.update(this.editingId, updatePayload, this.adminKey).subscribe({
        next: (entry) => {
          this.replaceEntry(entry);
          this.saving = false;
          this.closeForms();
          this.feedbackMessage = 'Davetli kaydı güncellendi.';
        },
        error: () => this.handleSaveError('Davetli kaydı güncellenemedi.'),
      });
      return;
    }

    this.guestListService.create(payload, this.adminKey).subscribe({
      next: () => {
        this.saving = false;
        this.closeForms();
        this.feedbackMessage = 'Davetli listeye eklendi.';
        this.loadEntries();
      },
      error: () => this.handleSaveError('Davetli listeye eklenemedi.'),
    });
  }

  saveBulkEntries(): void {
    const lines = this.bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      this.errorMessage = 'En az bir davetli adı girin.';
      return;
    }

    if (lines.length > 500) {
      this.errorMessage = 'Tek seferde en fazla 500 kayıt eklenebilir.';
      return;
    }

    const entries = lines.map((line) => {
      const [rawName, rawCount] = line.split('|').map((part) => part.trim());
      const parsedCount = Number(rawCount);

      return {
        eventId: this.eventId,
        displayName: rawName,
        side: this.bulkSide,
        plannedGuestCount: Number.isInteger(parsedCount) && parsedCount > 0
          ? Math.min(parsedCount, 20)
          : 1,
        invitationStatus: this.bulkInvitationStatus,
        forecastStatus: this.bulkForecast,
      };
    });

    if (entries.some((entry) => entry.displayName.length < 2)) {
      this.errorMessage = 'Her satırda en az 2 karakterden oluşan bir isim olmalı.';
      return;
    }

    this.saving = true;
    this.clearMessages();
    this.guestListService.createBulk(entries, this.adminKey).subscribe({
      next: (createdEntries) => {
        this.saving = false;
        this.closeForms();
        this.feedbackMessage = `${createdEntries.length} kayıt listeye eklendi.`;
        this.loadEntries();
      },
      error: () => this.handleSaveError('Toplu kayıtlar eklenemedi.'),
    });
  }

  migrateRsvps(): void {
    if (!this.eventId) return;

    const confirmed = window.confirm(
      'Seçili etkinliğin RSVP kayıtları davetli planına aktarılacak. Devam edilsin mi?'
    );
    if (!confirmed) return;

    this.migratingRsvps = true;
    this.clearMessages();
    this.guestListService.migrateRsvps(this.eventId, this.adminKey).subscribe({
      next: (result) => {
        this.migratingRsvps = false;
        this.loadEntries();

        if (!result.totalRsvps) {
          this.feedbackMessage = 'Aktarılacak RSVP kaydı bulunamadı.';
          return;
        }

        if (!result.created) {
          this.feedbackMessage = 'Tüm RSVP kayıtları davetli planında zaten mevcut.';
          return;
        }

        this.feedbackMessage = `${result.created} RSVP kaydı davetli planına aktarıldı.`;
      },
      error: (error: unknown) => {
        this.migratingRsvps = false;
        this.errorMessage = this.getApiErrorMessage(
          error,
          'RSVP kayıtları davetli planına aktarılamadı.'
        );
      },
    });
  }

  updateInvitationStatus(entry: GuestListEntry, status: InvitationStatus): void {
    this.updateEntry(entry, { invitationStatus: status });
  }

  updateForecastStatus(entry: GuestListEntry, status: ForecastStatus): void {
    this.updateEntry(entry, { forecastStatus: status });
  }

  updateSide(entry: GuestListEntry, side: GuestSide): void {
    this.updateEntry(entry, { side });
  }

  deleteEntry(entry: GuestListEntry): void {
    const confirmed = window.confirm(`${entry.displayName} kaydını silmek istiyor musunuz?`);
    if (!confirmed) return;

    this.deletingId = entry.id;
    this.clearMessages();
    this.guestListService.delete(entry.id, this.adminKey).subscribe({
      next: () => {
        this.entries = this.entries.filter((item) => item.id !== entry.id);
        this.deletingId = '';
        this.feedbackMessage = 'Davetli kaydı silindi.';
      },
      error: () => {
        this.deletingId = '';
        this.errorMessage = 'Davetli kaydı silinemedi.';
      },
    });
  }

  sideLabel(side: GuestSide): string {
    if (side === 'bride') return 'Gelin tarafı';
    if (side === 'groom') return 'Damat tarafı';
    return 'Ortak';
  }

  invitationLabel(status: InvitationStatus): string {
    return status === 'sent' ? 'Gönderildi' : 'Gönderilmedi';
  }

  forecastLabel(status: ForecastStatus): string {
    if (status === 'coming') return 'Geliyor';
    if (status === 'not-coming') return 'Gelmiyor';
    if (status === 'unlikely') return 'Gelmeme ihtimali yüksek';
    return 'Henüz bilinmiyor';
  }

  setSort(key: GuestSortKey): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      this.currentPage = 1;
      return;
    }

    this.sortKey = key;
    this.sortDirection = key === 'plannedGuestCount' || key === 'createdAt' ? 'desc' : 'asc';
    this.currentPage = 1;
  }

  sortIndicator(key: GuestSortKey): string {
    if (this.sortKey !== key) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  goToPreviousPage(): void {
    this.currentPage = Math.max(1, this.activePage - 1);
  }

  goToNextPage(): void {
    this.currentPage = Math.min(this.totalPages, this.activePage + 1);
  }

  private updateEntry(
    entry: GuestListEntry,
    payload: {
      side?: GuestSide;
      invitationStatus?: InvitationStatus;
      forecastStatus?: ForecastStatus;
    }
  ): void {
    this.updatingId = entry.id;
    this.clearMessages();
    this.guestListService.update(entry.id, payload, this.adminKey).subscribe({
      next: (updatedEntry) => {
        this.replaceEntry(updatedEntry);
        this.updatingId = '';
      },
      error: () => {
        this.updatingId = '';
        this.errorMessage = 'Durum güncellenemedi.';
      },
    });
  }

  private replaceEntry(entry: GuestListEntry): void {
    this.entries = this.entries.map((item) => item.id === entry.id ? entry : item);
  }

  private getGuestTotalByForecast(
    status: ForecastStatus,
    entries: GuestListEntry[]
  ): number {
    return entries
      .filter((entry) => entry.forecastStatus === status)
      .reduce((total, entry) => total + entry.plannedGuestCount, 0);
  }

  private getGuestTotalByInvitation(
    status: InvitationStatus,
    entries: GuestListEntry[]
  ): number {
    return this.getGuestTotal(
      entries.filter((entry) => entry.invitationStatus === status)
    );
  }

  private getGuestTotal(entries: GuestListEntry[]): number {
    return entries.reduce((total, entry) => total + entry.plannedGuestCount, 0);
  }

  private compareGuestEntries(a: GuestListEntry, b: GuestListEntry): number {
    const direction = this.sortDirection === 'asc' ? 1 : -1;

    if (this.sortKey === 'plannedGuestCount') {
      return (a.plannedGuestCount - b.plannedGuestCount) * direction;
    }

    if (this.sortKey === 'createdAt') {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    }

    const left = this.getGuestSortValue(a);
    const right = this.getGuestSortValue(b);

    return left.localeCompare(right, 'tr-TR', { sensitivity: 'base' }) * direction;
  }

  private getGuestSortValue(entry: GuestListEntry): string {
    if (this.sortKey === 'displayName') return entry.displayName;
    if (this.sortKey === 'side') return this.sideLabel(entry.side);
    if (this.sortKey === 'invitationStatus') return this.invitationLabel(entry.invitationStatus);
    return this.forecastLabel(entry.forecastStatus);
  }

  private normalizeGuestCount(value: number): number {
    return Math.min(20, Math.max(1, Math.floor(Number(value) || 1)));
  }

  private handleSaveError(message: string): void {
    this.saving = false;
    this.errorMessage = message;
  }

  private getApiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const response = error.error as { error?: unknown; detail?: unknown } | null;
      const detail = typeof response?.detail === 'string' ? response.detail : '';
      const apiError = typeof response?.error === 'string' ? response.error : fallback;

      return detail ? `${apiError}: ${detail}` : apiError;
    }

    return fallback;
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.feedbackMessage = '';
  }
}
