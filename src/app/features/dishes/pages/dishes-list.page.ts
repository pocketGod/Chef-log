import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';              
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest } from 'rxjs';      
import { map } from 'rxjs/operators';                       
import { DishesService } from '../dishes.service';
import { Dish } from '../../../shared/models/dish.model';
import { Diet, GuestTypes } from '../../../shared/models/common.model';  

@Component({
  selector: 'app-dishes-list',
  standalone: true,
  imports: [AsyncPipe, RouterLink, FormsModule, CommonModule],            
  templateUrl: 'dishes-list.page.html'
})
export class DishesListPage {
  private svc = inject(DishesService);
  private router = inject(Router);

  dishes$ = this.svc.list$();

  search$ = new BehaviorSubject<string>('');
  selectedGuest$ = new BehaviorSubject<Set<GuestTypes>>(new Set());
  selectedDiet$  = new BehaviorSubject<Set<Diet>>(new Set());

  GuestTypes: GuestTypes[] = ['adult', 'kid', 'vegan', 'vegeterian'];
  Diets: Diet[] = ['vegan', 'vegeterian', 'seafood', 'meat'];

  filtered$ = combineLatest([this.dishes$, this.search$, this.selectedGuest$, this.selectedDiet$]).pipe(
    map(([dishes, q, selGuest, selDiet]) => {
      const query = (q || '').trim().toLowerCase();

      const matchesSearch = (d: Dish) => {
        if (!query) return { ok: true, score: 0 };
        const nameHit = (d.name || '').toLowerCase().includes(query);
        const descHit = (d.description || '').toLowerCase().includes(query);
        return { ok: nameHit || descHit, score: (nameHit ? 2 : 0) + (descHit ? 1 : 0) };
      };

      const isSuitableFor = (d: Dish, gt: GuestTypes) => {
        const diet = (d.diet || 'meat') as Diet;
        if (gt === 'adult') return true;
        if (gt === 'kid')   return d.kidFriendly !== false;
        if (gt === 'vegan') return diet === 'vegan';
        if (gt === 'vegeterian') return diet === 'vegan' || diet === 'vegeterian' || diet === 'seafood';
        return true;
      };

      return dishes
        .map(d => {
          const s = matchesSearch(d);
          return { d, score: s.score, searchOk: s.ok };
        })
        .filter(x => x.searchOk) // search filter
        .filter(x => {
          const selG = selGuest.size ? Array.from(selGuest).some(gt => isSuitableFor(x.d, gt)) : true;
          const selD = selDiet.size  ? selDiet.has(x.d.diet as Diet) : true;
          return selG && selD;
        })
        .sort((a, b) => {
          if (query) return (b.score - a.score) || a.d.name.localeCompare(b.d.name);
          return (b.d.createdAt || 0) - (a.d.createdAt || 0);
        })
        .map(x => x.d);
    })
  );

  setSearch(v: string) { this.search$.next(v); }

  toggleGuest(t: GuestTypes) {
    const next = new Set(this.selectedGuest$.value);
    next.has(t) ? next.delete(t) : next.add(t);
    this.selectedGuest$.next(next);
  }

  toggleDiet(d: Diet) {
    const next = new Set(this.selectedDiet$.value);
    next.has(d) ? next.delete(d) : next.add(d);
    this.selectedDiet$.next(next);
  }

  clearFilters() {
    this.search$.next('');
    this.selectedGuest$.next(new Set());
    this.selectedDiet$.next(new Set());
  }

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
