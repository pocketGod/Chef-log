import { Component, effect, inject, signal, computed } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventsService } from '../events.service';
import { DishesService } from '../../dishes/dishes.service';
import { EventMenuItem, EventSegment } from '../../../shared/models/event.model';
import { Dish } from '../../../shared/models/dish.model';

@Component({
  selector: 'app-event-editor',
  standalone: true,
  imports: [AsyncPipe, FormsModule, CommonModule, RouterLink],
  template: `
    <a routerLink="/events">← Back to Events</a>
    <h1>Event Editor</h1>

    @if (event$ | async; as e) {
    <section class="grid gap-4" style="grid-template-columns: 1fr 1fr 1fr;">
      <!-- Left: Event details & segments -->
      <div>
        <h3>Details</h3>
        <label>
          Name:
          <input [(ngModel)]="local.name" (blur)="saveName(e.id!)" />
        </label>

        <h3 class="mt-4">Segments</h3>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Guests</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (s of local.segments; track s.key) {
            <tr>
              <td>
                <select [(ngModel)]="s.key" (ngModelChange)="onSegmentsChange(e.id!)">
                  <option *ngFor="let t of GuestTypes" [ngValue]="t">{{ t }}</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  [(ngModel)]="s.guests"
                  (ngModelChange)="onSegmentsChange(e.id!)"
                />
              </td>
              <td><button (click)="removeSegment(e.id!, s.key)">✕</button></td>
            </tr>
            }
          </tbody>
        </table>
        <button (click)="addSegment(e.id!)">Add Segment</button>
      </div>

      <!-- Middle: Dishes & popularity -->
      <div>
        <h3>Menu (per-dish popularity)</h3>
        @if (dishes$ | async; as dishes) {
        <ul>
          @for (d of dishes; track d.id) {
          <li style="margin-bottom: .75rem;">
            <label>
              <input
                type="checkbox"
                [checked]="hasDish(d.id!)"
                (change)="toggleDish(e.id!, d.id!, $event.target.checked)"
              />
              <strong>{{ d.name }}</strong>
              <small> (bpp: {{ bppOf(d.id!) }})</small>
            </label>

            @if (hasDish(d.id!)) {
            <div style="display:flex; align-items:center; gap:.5rem;">
              <span>Popularity:</span>
              <!-- keep slider responsive locally, persist only on change -->
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                [ngModel]="localPopularity(d.id!)"
                (ngModelChange)="setLocalPopularity(d.id!, $event)"
                (change)="persistPopularity(e.id!, d.id!)"
              />
              <span>{{ localPopularity(d.id!) }}</span>
            </div>
            }
          </li>
          }
        </ul>
        }
      </div>

      <!-- Right: Live totals -->
      <div>
        <h3>Totals</h3>
        <p>
          Total guests: <strong>{{ totalGuests() }}</strong>
        </p>
        <h4>Dish portions</h4>
        <ul>
          @for (m of local.menu; track m.dishId) {
          <li>
            {{ dishName(m.dishId) }}:
            {{ computePortions(m.dishId, localPopularity(m.dishId)) | number : '1.0-1' }}
            <small> (bpp: {{ bppOf(m.dishId) }})</small>
          </li>
          }
        </ul>
        <!-- Next step: ingredient-level shopping list -->
      </div>
    </section>
    } @else {
    <p>Loading event…</p>
    }
  `,
})
export class EventEditorPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private events = inject(EventsService);
  private dishesSvc = inject(DishesService);

  // route
  eventId = this.route.snapshot.paramMap.get('id')!;
  event$ = this.events.get$(this.eventId);
  dishes$ = this.dishesSvc.list$();
  GuestTypes: ('adult' | 'kid' | 'vegan' | 'vegeterian')[] = [
    'adult',
    'kid',
    'vegan',
    'vegeterian',
  ];

  // ---- stable dish lookup: id -> { name, bpp }
  private _dishInfo = signal<
    Record<string, { name: string; bpp: number; diet: string; kid?: boolean }>
  >({});
  private _dishInfoComputed = computed(() => this._dishInfo());

  // helpers for template
  dishName = (id: string) => this._dishInfoComputed()[id]?.name ?? 'Dish';
  bppOf = (id: string) => this._dishInfoComputed()[id]?.bpp ?? 1;

  // local UI state
  local = {
    name: '',
    segments: [] as EventSegment[],
    menu: [] as EventMenuItem[],
  };

  // local popularity cache to keep slider smooth
  private _pop = signal<Record<string, number>>({}); // dishId -> popularity
  localPopularity = (dishId: string) => this._pop()[dishId] ?? 1;

  constructor() {
    // hydrate local from event once and on updates
    effect(() => {
      this.event$.subscribe((e) => {
        if (!e) return;
        this.local.name = e.name;
        // normalize any old keys to the new union
        const normalize = (k: string): 'adult' | 'kid' | 'vegan' | 'vegeterian' => {
          const t = (k || '').toLowerCase().trim();
          if (t === 'adult' || t === 'adults') return 'adult';
          if (t === 'kid' || t === 'kids') return 'kid';
          if (t === 'vegan' || t === 'vegans') return 'vegan';
          if (t === 'vegeterian' || t === 'vegetarian' || t === 'veg') return 'vegeterian';
          return 'adult';
        };
        this.local.segments = (e.segments ?? []).map((s) => ({
          key: normalize(s.key),
          guests: Number(s.guests) || 0,
        }));
        this.local.menu = (e.menu ?? []).map((m) => ({ ...m }));
        const cache: Record<string, number> = {};
        for (const m of this.local.menu) cache[m.dishId] = m.popularity ?? 1;
        this._pop.set(cache);
      });
    });

    // build dish info map once and keep it updated
    effect(() => {
      this.dishes$.subscribe((ds: (Dish & { id?: string })[]) => {
        const map: Record<string, { name: string; bpp: number; diet: string; kid?: boolean }> = {};
        for (const d of ds) {
          if (!d.id) continue;
          map[d.id] = {
            name: d.name ?? 'Dish',
            bpp: d.basePortionPerPerson ?? 1,
            diet: d.diet ?? 'meat',
            kid: d.kidFriendly ?? true,
          };
        }
        this._dishInfo.set(map);
      });
    });
  }

  // --- segments
  totalGuests() {
    return this.local.segments.reduce((sum, s) => sum + (Number(s.guests) || 0), 0);
  }

  addSegment(id: string) {
    this.local.segments = [...this.local.segments, { key: 'adult', guests: 0 }];
    this.onSegmentsChange(id);
  }

  removeSegment(id: string, key: string) {
    this.local.segments = this.local.segments.filter((s) => s.key !== key);
    this.onSegmentsChange(id);
  }

  onSegmentsChange(id: string) {
    this.local.segments = [...this.local.segments]; // bump ref
    this.events.setSegments(id, this.local.segments);
  }

  // --- menu / popularity
  hasDish(dishId: string) {
    return this.local.menu.some((m) => m.dishId === dishId);
  }

  toggleDish(id: string, dishId: string, on: boolean | null | undefined) {
    if (!on) {
      this.local.menu = this.local.menu.filter((m) => m.dishId !== dishId);
      const p = { ...this._pop() };
      delete p[dishId];
      this._pop.set(p);
      this.events.update(id, { menu: this.local.menu });
      return;
    }
    if (!this.hasDish(dishId)) {
      this.local.menu = [...this.local.menu, { dishId, popularity: this.localPopularity(dishId) }];
      this.events.update(id, { menu: this.local.menu });
    }
  }

  setLocalPopularity(dishId: string, value: number) {
    const p = Math.max(0.1, Math.min(3, Number(value) || 1));
    this._pop.set({ ...this._pop(), [dishId]: p });
  }

  // persist only when slider change "commits"
  persistPopularity(id: string, dishId: string) {
    const p = this.localPopularity(dishId);
    const next = this.local.menu.map((m) => (m.dishId === dishId ? { ...m, popularity: p } : m));
    this.local.menu = next;
    this.events.update(id, { menu: next });
  }

  computePortions(dishId: string, popularity: number) {
    const pop = Number(popularity) || 1;
    const bpp = this.bppOf(dishId);

    let totalPortions = 0;
    for (const s of this.local.segments) {
      const guests = Number(s.guests) || 0;
      const mult = this.segMultiplier(s.key);
      const ok = this.isSuitable(dishId, s.key) ? 1 : 0;
      totalPortions += guests * mult * ok;
    }
    return totalPortions * pop * bpp;
  }

  // --- misc
  saveName(id: string) {
    this.events.update(id, { name: this.local.name.trim() || 'Untitled Event' });
  }
  markDirty() {
    /* reserved for future UX */
  }

  private segMultiplier(segKey: string) {
    // need to tweak
    if (segKey.toLowerCase() === 'kid') return 0.6;
    return 1;
  }

  private isSuitable(dishId: string, segKey: 'adult' | 'kid' | 'vegan' | 'vegeterian') {
    const info = this._dishInfo()[dishId];
    if (!info) return true;

    const diet = (info.diet || 'meat') as 'vegan' | 'vegetarian' | 'pescetarian' | 'meat';

    if (segKey === 'vegan') {
      return diet === 'vegan';
    }
    if (segKey === 'vegeterian') {
      // Vegetarians eat no meat and no fish → allow only vegan or vegetarian dishes
      return diet === 'vegan' || diet === 'vegetarian';
    }
    if (segKey === 'kid') {
      return info.kid !== false; // exclude if explicitly not kid-friendly
    }
    // adult
    return true;
  }
}
