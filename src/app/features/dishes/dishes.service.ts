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

  /** demo seed */
  addKebab() {
    const kebab: Dish = {
      name: 'Kebab',
      description: 'Juicy grilled kebab with herbs',
      popularity: 2.4,
      isPublic: true,
      createdAt: Date.now()
    };
    return addDoc(this.col, kebab).then(ref => {
        console.log('Created dish with ID:', ref.id);
    });
  }
}
