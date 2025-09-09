import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav>
      <a routerLink="/dishes">Dishes</a> |
      <a routerLink="/events">Events</a>
    </nav>
  `
})
export class NavbarComponent {}
