import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Dish } from '../../shared/models/dish.model';

@Injectable({ providedIn: 'root' })
export class DishesService {
  private db = inject(Firestore);
  private col = collection(this.db, 'dishes');

  list$(): Observable<Dish[]> {
    const q = query(this.col, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Dish[]>;
  }


}
