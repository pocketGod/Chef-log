// features/dishes/dishes.service.ts
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

  get$(id: string) {
    return this.db.doc$<Dish>(`dishes/${id}`);
  }

  add(d: Omit<Dish, 'id'>) {
    return this.db.add<Dish>('dishes', d);
  }

  update(id: string, patch: Partial<Dish>) {
    return this.db.update(`dishes/${id}`, patch);
  }

  remove(id: string) {
    return this.db.remove(`dishes/${id}`);
  }


  getMany(ids: string[]) {
    return Promise.all(ids.map(id => this.db.get<Dish>(`dishes/${id}`))).then(list => list.filter(Boolean) as WithId<Dish>[]);
  }
}
