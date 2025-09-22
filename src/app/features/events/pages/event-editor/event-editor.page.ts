import { Component, effect, inject, signal, computed } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventsService } from '../../events.service';
import { DishesService } from '../../../dishes/dishes.service';
import { EventMenuItem, EventSegment } from '../../../../shared/models/event.model';
import { Dish } from '../../../../shared/models/dish.model';
import { Diet, GuestTypes } from '../../../../shared/models/common.model';
import { TotalCalcRow } from '../../../../shared/models/calc.model';
import { aggregateIngredients } from '../../../../shared/Utils/calc';
import { IngredientsService } from '../../../dishes/ingredient.service';
import { CheckComponent } from '../../../../shared/components/checkbox/check.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-event-editor',
  standalone: true,
  imports: [AsyncPipe, FormsModule, CommonModule, RouterLink, CheckComponent, LoaderComponent],
  templateUrl: 'event-editor.page.html',
  styleUrl:'event-editor.page.scss'
})
export class EventEditorPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private events = inject(EventsService);
  private dishesSvc = inject(DishesService);
  private ingSvc = inject(IngredientsService);

  // route
  eventId = this.route.snapshot.paramMap.get('id')!;
  event$ = this.events.get$(this.eventId);
  dishes$ = this.dishesSvc.list$();
  GuestTypes: GuestTypes[] = ['adult', 'kid', 'vegan', 'vegeterian'];

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
  displayTotals: Array<{ name: string; amount: string }> = [];

  // local popularity cache to keep slider smooth
  private _pop = signal<Record<string, number>>({}); // dishId -> popularity
  localPopularity = (dishId: string) => this._pop()[dishId] ?? 1;

  // totals (ingredients)
  totals: TotalCalcRow[] = [];
  isCalcBusy = false;

  constructor() {
    // hydrate local from event once and on updates
    effect(() => {
      this.event$.subscribe((e) => {
        if (!e) return;
        this.local.name = e.name;
        // normalize any old keys to the new union
        const normalize = (k: string): GuestTypes => {
          const t = (k || '').toLowerCase().trim();
          if (t === 'adult' || t === 'adults') return 'adult';
          if (t === 'kid' || t === 'kids') return 'kid';
          if (t === 'vegan' || t === 'vegans') return 'vegan';
          if (t === 'vegeterian' || t === 'veg') return 'vegeterian';
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

        // recalc totals when event loads/changes
        this.recalcTotals();
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

  remainingTypes(): GuestTypes[] {
    const used = new Set(this.local.segments.map((s) => s.key));
    return this.GuestTypes.filter((t) => !used.has(t));
  }

  allowedTypesFor(s: EventSegment): GuestTypes[] {
    const usedOther = new Set(this.local.segments.filter((x) => x !== s).map((x) => x.key));
    return this.GuestTypes.filter((t) => t === s.key || !usedOther.has(t));
  }

  addSegment(id: string) {
    const avail = this.remainingTypes();
    if (!avail.length) return; // nothing left to add
    this.local.segments = [...this.local.segments, { key: avail[0], guests: 0 }];
    this.onSegmentsChange(id);
  }

  removeSegment(id: string, key: string) {
    this.local.segments = this.local.segments.filter((s) => s.key !== key);
    this.onSegmentsChange(id);
  }

  onSegmentsChange(id: string) {
    this.local.segments = [...this.local.segments]; // bump ref
    this.events.setSegments(id, this.local.segments);
    this.recalcTotals();
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
      this.recalcTotals();
      return;
    }
    if (!this.hasDish(dishId)) {
      this.local.menu = [...this.local.menu, { dishId, popularity: this.localPopularity(dishId) }];
      this.events.update(id, { menu: this.local.menu });
      this.recalcTotals();
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
    this.recalcTotals();
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

  async recalcTotals() {
    const ids = (this.local.menu ?? []).map((m) => m.dishId);
    if (!ids.length) {
      this.totals = [];
      return;
    }
    this.isCalcBusy = true;
    try {
      const dishes = await this.dishesSvc.getMany(ids);

      // collect unique ingredient ids from these dishes
      const ingIds = Array.from(
        new Set(
          dishes.flatMap(
            (d) => (d.ingredients ?? []).map((r) => r.ingredientId).filter(Boolean) as string[]
          )
        )
      );

      const nameById: Record<string, string> = {};
      for (const id of ingIds) {
        const doc = await this.ingSvc.getById(id);
        if (doc) nameById[id] = (doc as any).name || '';
      }

      const evtLike = {
        segments: this.local.segments,
        menu: this.local.menu.map((m) => ({
          dishId: m.dishId,
          popularity: this.localPopularity(m.dishId),
        })),
      } as any;

      this.totals = aggregateIngredients(dishes as any, evtLike, nameById);
      (this as any).displayTotals = this.toDisplayTotals(this.totals);
    } finally {
      this.isCalcBusy = false;
    }
  }

  saveName(id: string) {
    this.events.update(id, { name: this.local.name.trim() || 'Untitled Event' });
  }
  markDirty() {
    /* reserved for future UX */
  }

  private toDisplayTotals(rows: TotalCalcRow[]) {
    // group by name, sum per base family
    const byName: Record<string, { g: number; ml: number; pcs: number }> = {};

    for (const r of rows) {
      const k = r.name || 'Unnamed';
      byName[k] ||= { g: 0, ml: 0, pcs: 0 };

      switch (r.unit) {
        case 'kg':
          byName[k].g += r.qty * 1000;
          break;
        case 'g':
          byName[k].g += r.qty;
          break;
        case 'l':
          byName[k].ml += r.qty * 1000;
          break;
        case 'ml':
          byName[k].ml += r.qty;
          break;
        case 'pcs':
          byName[k].pcs += r.qty;
          break;
      }
    }

    // compact and build display string
    const out = Object.entries(byName).map(([name, sums]) => {
      const parts: string[] = [];

      if (sums.pcs > 0) parts.push(`${this.formatNum(sums.pcs)} pcs`);
      if (sums.g > 0)
        parts.push(
          sums.g >= 1000 ? `${this.formatNum(sums.g / 1000)} kg` : `${this.formatNum(sums.g)} g`
        );
      if (sums.ml > 0)
        parts.push(
          sums.ml >= 1000 ? `${this.formatNum(sums.ml / 1000)} l` : `${this.formatNum(sums.ml)} ml`
        );

      return { name, amount: parts.join(' + ') || '—' };
    });

    // stable order
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  // tiny number formatter to match your table pipe
  private formatNum(n: number) {
    return Number.isFinite(n) ? Number(n.toFixed(2)).toString().replace(/\.00$/, '') : '0';
  }

  private segMultiplier(segKey: string) {
    // need to tweak
    if (segKey.toLowerCase() === 'kid') return 0.6;
    return 1;
  }

  private isSuitable(dishId: string, segKey: GuestTypes) {
    const info = this._dishInfo()[dishId];
    if (!info) return true;

    const diet = (info.diet || 'meat') as Diet;

    if (segKey === 'vegan') {
      return diet === 'vegan';
    }
    if (segKey === 'vegeterian') {
      return diet === 'vegan' || diet === 'vegeterian' || diet === 'seafood';
    }
    if (segKey === 'kid') {
      return info.kid !== false; // exclude if explicitly not kid-friendly
    }
    // adult
    return true;
  }
}
