import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DishesService } from '../dishes.service';
import { Dish } from '../../../shared/models/dish.model';

@Component({
  selector: 'app-dishes-list',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: 'dishes-list.page.html'
})
export class DishesListPage {
  private svc = inject(DishesService);
  private router = inject(Router);

  dishes$ = this.svc.list$();

  async createDish() {
    const now = Date.now();
    const id = await this.svc.add({
      name: 'New Dish',
      description: '',
      createdAt: now,
      basePortionPerPerson: 1,
      diet: 'meat',
      kidFriendly: true,
    } satisfies Omit<Dish, 'id'>);

    this.router.navigate(['/dishes', id]);
  }
}
