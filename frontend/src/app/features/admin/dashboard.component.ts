import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { RsvpService } from '../../core/services/rsvp.service';
import { Event } from '../../models/event.model';
import { Rsvp } from '../../models/rsvp.model';
import { GuestListComponent } from './guest-list/guest-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GuestListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private eventService = inject(EventService);
  private rsvpService = inject(RsvpService);

  adminKey = '';
  events: Event[] = [];
  selectedEventId = '';
  rsvps: Rsvp[] = [];
  searchTerm = '';
  attendanceFilter: 'all' | 'attending' | 'declined' = 'all';
  notesOnly = false;
  guestLimit = 0;
  loading = false;
  deletingId = '';
  errorMessage = '';
  authenticated = false;
  activeView: 'guest-list' | 'rsvps' = 'guest-list';
  readonly pageSize = 10;
  currentPage = 1;

  ngOnInit(): void {
    const savedKey = sessionStorage.getItem('wedding-admin-key');
    if (savedKey) {
      this.adminKey = savedKey;
      this.signIn();
    }
  }

  get filteredRsvps(): Rsvp[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('tr-TR');

    return this.rsvps.filter((rsvp) => {
      const matchesAttendance = this.attendanceFilter === 'all'
        || (this.attendanceFilter === 'attending' && rsvp.attending)
        || (this.attendanceFilter === 'declined' && !rsvp.attending);
      const matchesNotes = !this.notesOnly || !!rsvp.notes?.trim();
      const searchableText = [
        rsvp.contactFullName,
        ...(rsvp.attendees ?? []),
        rsvp.notes ?? ''
      ].join(' ').toLocaleLowerCase('tr-TR');

      return matchesAttendance && matchesNotes && (!search || searchableText.includes(search));
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  get paginatedRsvps(): Rsvp[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredRsvps.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRsvps.length / this.pageSize));
  }

  get pageStart(): number {
    return this.filteredRsvps.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredRsvps.length);
  }

  resetPagination(): void {
    this.currentPage = 1;
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  get attendingResponses(): number {
    return this.rsvps.filter((rsvp) => rsvp.attending).length;
  }

  get declinedResponses(): number {
    return this.rsvps.filter((rsvp) => !rsvp.attending).length;
  }

  get totalGuests(): number {
    return this.rsvps.reduce(
      (total, rsvp) => total + (rsvp.attending ? rsvp.attendeeCount ?? 0 : 0),
      0
    );
  }

  get attendanceRate(): number {
    if (!this.rsvps.length) return 0;
    return Math.round((this.attendingResponses / this.rsvps.length) * 100);
  }

  get responsesWithNotes(): number {
    return this.rsvps.filter((rsvp) => !!rsvp.notes?.trim()).length;
  }

  get recentRsvps(): Rsvp[] {
    return [...this.rsvps]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  get dailyRsvpStats(): { label: string; count: number; height: number }[] {
    const counts = new Map<string, { date: Date; count: number }>();

    this.rsvps.forEach((rsvp) => {
      const date = new Date(rsvp.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const key = date.toISOString().slice(0, 10);
      const current = counts.get(key);
      counts.set(key, {
        date,
        count: (current?.count ?? 0) + 1,
      });
    });

    const items = [...counts.values()]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-7);
    const maxCount = Math.max(...items.map((item) => item.count), 1);

    return items.map((item) => ({
      label: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(item.date),
      count: item.count,
      height: Math.max(10, Math.round((item.count / maxCount) * 100)),
    }));
  }

  get guestLimitUsageRate(): number {
    if (!this.guestLimit) return 0;
    return Math.round((this.totalGuests / this.guestLimit) * 100);
  }

  get guestLimitMessage(): string {
    if (!this.guestLimit) return 'Limit girilmedi.';
    if (this.totalGuests > this.guestLimit) {
      return `${this.totalGuests - this.guestLimit} kişi limitin üzerinde.`;
    }
    if (this.guestLimitUsageRate >= 90) {
      return `${this.guestLimit - this.totalGuests} kişilik boşluk kaldı.`;
    }
    return `${this.guestLimit - this.totalGuests} kişilik boşluk var.`;
  }

  get guestLimitState(): 'neutral' | 'warning' | 'danger' {
    if (!this.guestLimit) return 'neutral';
    if (this.totalGuests > this.guestLimit) return 'danger';
    if (this.guestLimitUsageRate >= 90) return 'warning';
    return 'neutral';
  }

  signIn(): void {
    if (!this.adminKey.trim()) {
      this.errorMessage = 'Admin anahtarını girin.';
      return;
    }

    this.errorMessage = '';
    this.loadEvents();
  }

  signOut(): void {
    sessionStorage.removeItem('wedding-admin-key');
    this.adminKey = '';
    this.authenticated = false;
    this.events = [];
    this.rsvps = [];
  }

  loadEvents(): void {
    this.loading = true;
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events;
        if (!events.length) {
          this.loading = false;
          this.errorMessage = 'Henüz bir davetiye bulunmuyor.';
          return;
        }

        this.selectedEventId = this.selectedEventId || events[0].id;
        this.loadRsvps(true);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Davetiye listesi yüklenemedi.';
      }
    });
  }

  loadRsvps(authenticating = false): void {
    if (!this.selectedEventId) return;

    this.loadGuestLimit();
    this.resetPagination();
    this.loading = true;
    this.errorMessage = '';
    this.rsvpService.getRsvpsByEvent(this.selectedEventId, this.adminKey).subscribe({
      next: (rsvps) => {
        this.rsvps = rsvps;
        this.loading = false;
        this.authenticated = true;
        sessionStorage.setItem('wedding-admin-key', this.adminKey);
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.authenticated = false;
          sessionStorage.removeItem('wedding-admin-key');
          this.errorMessage = 'Admin anahtarı geçersiz.';
        } else {
          this.errorMessage = authenticating
            ? 'Admin paneline bağlanılamadı.'
            : 'Katılım yanıtları yüklenemedi.';
        }
      }
    });
  }

  saveGuestLimit(): void {
    const normalizedLimit = Math.max(0, Math.floor(Number(this.guestLimit) || 0));
    this.guestLimit = normalizedLimit;

    if (!this.selectedEventId) return;

    const storageKey = this.getGuestLimitStorageKey();
    if (normalizedLimit > 0) {
      localStorage.setItem(storageKey, String(normalizedLimit));
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  exportRsvps(): void {
    if (!this.rsvps.length) {
      this.errorMessage = 'Dışa aktarılacak katılım yanıtı yok.';
      return;
    }

    const headers = [
      'İletişim',
      'Durum',
      'Misafir Sayısı',
      'Misafirler',
      'Not',
      'Tarih',
    ];
    const rows = this.filteredRsvps.map((rsvp) => [
      rsvp.contactFullName,
      rsvp.attending ? 'Katılıyor' : 'Katılmıyor',
      rsvp.attending ? String(rsvp.attendeeCount ?? 0) : '0',
      rsvp.attendees?.join(', ') ?? '',
      rsvp.notes ?? '',
      new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(rsvp.createdAt)),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => this.toCsvCell(cell)).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const selectedEvent = this.events.find((event) => event.id === this.selectedEventId);
    const fileName = this.toFileName(`${selectedEvent?.title ?? 'rsvp'}-yanitlari.csv`);

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  deleteRsvp(rsvp: Rsvp): void {
    const confirmed = window.confirm(`${rsvp.contactFullName} kaydını silmek istiyor musunuz?`);
    if (!confirmed) return;

    this.deletingId = rsvp.id;
    this.rsvpService.deleteRsvp(rsvp.id, this.adminKey).subscribe({
      next: () => {
        this.rsvps = this.rsvps.filter((item) => item.id !== rsvp.id);
        if (this.currentPage > this.totalPages) {
          this.currentPage = this.totalPages;
        }
        this.deletingId = '';
      },
      error: () => {
        this.deletingId = '';
        this.errorMessage = 'Kayıt silinemedi. Lütfen tekrar deneyin.';
      }
    });
  }

  private loadGuestLimit(): void {
    if (!this.selectedEventId) {
      this.guestLimit = 0;
      return;
    }

    const savedLimit = Number(localStorage.getItem(this.getGuestLimitStorageKey()));
    this.guestLimit = Number.isFinite(savedLimit) && savedLimit > 0 ? savedLimit : 0;
  }

  private getGuestLimitStorageKey(): string {
    return `wedding-admin-guest-limit-${this.selectedEventId}`;
  }

  private toCsvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private toFileName(value: string): string {
    return value
      .toLocaleLowerCase('tr-TR')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
