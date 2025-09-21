import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DishesService } from '../dishes.service';

@Component({
  selector: 'app-dishes-list',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  template: `
    <h1>Dishes</h1>

    @if (dishes$ | async; as dishes) {
      @if (dishes.length > 0) {
        <ul>
          @for (d of dishes; track d.id) {
            <li>
              <strong>{{ d.name }}</strong>

              &nbsp;•&nbsp;
              
              <a [routerLink]="['/dishes', d.id]">Edit</a>

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
}
