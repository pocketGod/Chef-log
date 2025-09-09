import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Dish } from '../../shared/models/dish.model';
import { FirestoreService, WithId } from '../../core/data/firestore.service';

@Injectable({ providedIn: 'root' })
export class DishesService {
  private db = inject(FirestoreService);

  list$(): Observable<WithId<Dish>[]> {
    return this.db.list$<Dish>('dishes', this.db.orderBy('createdAt', 'desc'));
  }

  add(d: Omit<Dish, 'id'>) {
    return this.db.add<Dish>('dishes', d);
  }

  remove(id: string) {
    return this.db.remove(`dishes/${id}`);
  }
}