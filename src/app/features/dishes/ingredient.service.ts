// ingredients.service.ts
import { Injectable, inject } from '@angular/core';
import { FirestoreService, WithId } from '../../core/data/firestore.service';
import { Unit } from '../../shared/models/common.model';

@Injectable({ providedIn: 'root' })
export class IngredientsService {
  private db = inject(FirestoreService);

  // ALWAYS write name_lc so prefix search & dedupe work
  add(i: { name: string; defaultUnit?: Unit }) {
    const name = i.name.trim();
    return this.db.add('ingredients', {
      name,
      name_lc: name.toLowerCase(),
      defaultUnit: i.defaultUnit ?? null,
      createdAt: Date.now(),
    });
  }

  getById(id: string) {
    return this.db.get(`ingredients/${id}`);
  }

  // exact, case-insensitive match
  async findByExactNameLc(name: string): Promise<WithId<any> | undefined> {
    const t = name.trim().toLowerCase();
    const rows = await this.db.listOnce('ingredients',
      this.db.where('name_lc', '==', t),
      this.db.limit(1)
    );
    return rows[0];
  }

  // reuse if exists, otherwise create
  async upsertByName(name: string): Promise<string> {
    const existing = await this.findByExactNameLc(name);
    if (existing) return existing.id;
    return this.add({ name });
  }

  // prefix search (fed to the dropdown)
  searchByPrefix$(term: string) {
    const t = (term || '').trim().toLowerCase();
    if (!t) {
      return this.db.list$('ingredients', this.db.orderBy('name_lc'), this.db.limit(20));
    }
    const end = t + '\uf8ff';
    return this.db.list$('ingredients',
      this.db.orderBy('name_lc'),
      this.db.where('name_lc', '>=', t),
      this.db.where('name_lc', '<=', end),
      this.db.limit(20)
    );
  }
}
