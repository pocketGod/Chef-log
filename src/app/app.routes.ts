import { Routes } from '@angular/router';
import { DishesListPage } from './features/dishes/pages/dishes-list.page';
import { EventsListPage } from './features/events/pages/events-list.page';
import { authGuard } from './core/auth/auth.guard';
import { LoginPage } from './features/common/pages/login.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dishes' },
  { path: 'login', component: LoginPage },

  { path: 'dishes', component: DishesListPage, canActivate: [authGuard] },
  { path: 'events', component: EventsListPage,  canActivate: [authGuard] },

  { path: '**', redirectTo: 'dishes' }
];