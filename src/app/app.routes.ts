import { Routes } from '@angular/router';
import { DishesListPage } from './features/dishes/pages/dish-list/dishes-list.page';
import { EventsListPage } from './features/events/pages/events-list.page';
import { authGuard } from './core/auth/auth.guard';
import { LoginPage } from './features/common/pages/login.page';
import { EventEditorPage } from './features/events/pages/event-editor.page';
import { DishEditorPage } from './features/dishes/pages/dish-editor/dish-editor.page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dishes' },
  { path: 'login', component: LoginPage },

  { path: 'dishes', component: DishesListPage, canActivate: [authGuard] },
   { path: 'dishes/:id', component: DishEditorPage, canActivate: [authGuard] },

   
  { path: 'events', component: EventsListPage,  canActivate: [authGuard] },
  { path: 'events/:id', component: EventEditorPage, canActivate: [authGuard] },

  { path: '**', redirectTo: 'dishes' }
];