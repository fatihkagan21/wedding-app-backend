import { Routes } from '@angular/router';
import { EventPageComponent } from './features/public-event/pages/event-page/event-page.component';
import { DashboardComponent } from './features/admin/dashboard.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: DashboardComponent
  },
  {
    path: 'ani-kosesi',
    component: EventPageComponent,
    data: { initialSection: 'photos' }
  },
  {
    path: '',
    component: EventPageComponent
  }
];
