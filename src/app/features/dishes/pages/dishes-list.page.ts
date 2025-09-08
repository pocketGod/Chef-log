import { Component, inject } from '@angular/core';
import { DishesService } from '../dishes.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-dishes-list',
  standalone: true,
  imports:[AsyncPipe],
  template: `
    <h1>Dishes</h1>

    <button (click)="seed()">Add Kebab</button>

    @if (dishes$ | async; as dishes) {
      @if (dishes.length > 0) {
        <ul>
          @for (d of dishes; track d.id) {
            <li>
              <strong>{{ d.name }}</strong>
              @if (d.popularity) {
                — popularity: {{ d.popularity }}
              }
              @if (d.description) {
                <div>{{ d.description }}</div>
              }
            </li>
          }
        </ul>
      } @else {
        <p>No dishes yet. Click “Add Kebab”.</p>
      }
    }
  `
})
export class DishesListPage {
  private svc = inject(DishesService);
  dishes$ = this.svc.list$();

  seed() { this.svc.addKebab(); }
}
