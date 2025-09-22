import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs/operators';

import { DishesService } from '../../dishes.service';
import { Dish, DishIngredient } from '../../../../shared/models/dish.model';
import { Diet, Unit } from '../../../../shared/models/common.model';
import { IngredientsService } from '../../ingredient.service';
import { CheckComponent } from '../../../../shared/components/checkbox/check.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { LocalizePipe } from '../../../../shared/pipes/localize.pipe';

@Component({
  selector: 'app-dish-editor',
  standalone: true,
  imports: [AsyncPipe, FormsModule, RouterLink, CheckComponent, LoaderComponent, LocalizePipe],
  templateUrl: 'dish-editor.page.html',
  styleUrls: ['./dish-editor.page.scss'],
})
export class DishEditorPage {
  private route = inject(ActivatedRoute);
  private svc = inject(DishesService);
  private ingSvc = inject(IngredientsService);

  id = this.route.snapshot.paramMap.get('id')!;
  dish$ = this.svc.get$(this.id);

  local: Partial<Dish> = {
    name: '',
    description: '',
    basePortionPerPerson: 1,
    ingredients: [],
    diet: 'meat',
    kidFriendly: true,
  };

  // Autocomplete state
  openSuggestFor?: DishIngredient;
  suggest: Array<{ id: string; name: string; defaultUnit?: Unit }> = [];
  draftTerm = '';
  private search$ = new Subject<string>();

  constructor() {
    // Load dish into local state + hydrate ingredient names by id
    this.dish$.subscribe(async (d) => {
      if (!d) return;

      // clone so we can mutate local safely
      const ingredients = (d.ingredients ?? []).map((x) => ({ ...x } as DishIngredient));

      // HYDRATE: if an ingredient has only ingredientId, resolve its name from /ingredients
      const ids = ingredients.map((r) => r.ingredientId).filter(Boolean) as string[];
      if (ids.length) {
        const nameMap = await this.loadIngredientNames(ids); // id -> name
        for (const row of ingredients) {
          if (row.ingredientId && !row.ingredientName) {
            row.ingredientName = nameMap[row.ingredientId] || '';
          }
        }
      }

      this.local = {
        name: d.name,
        description: d.description ?? '',
        basePortionPerPerson: d.basePortionPerPerson ?? 1,
        ingredients,
        diet: (d.diet as Diet) ?? 'meat',
        kidFriendly: d.kidFriendly ?? true,
      };
    });

    // Wire autocomplete search stream
    this.search$
      .pipe(
        map((s) => (s || '').trim().toLowerCase()),
        debounceTime(160),
        distinctUntilChanged(),
        switchMap((t) => this.ingSvc.searchByPrefix$(t))
      )
      .subscribe((rows: any[]) => {
        this.suggest = (rows || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          defaultUnit: r.defaultUnit as Unit | undefined,
        }));
      });
  }

  setKidFriendly(v: boolean) {
    this.local.kidFriendly = v;
    this.save();
  }

  private async loadIngredientNames(ids: string[]) {
    const out: Record<string, string> = {};
    for (const id of ids) {
      const doc = await this.ingSvc.getById(id);
      if (doc) out[id] = (doc as any).name || '';
    }
    return out;
  }

  addIng() {
    (this.local.ingredients ||= []).push({
      ingredientId: undefined,
      ingredientName: '',
      unit: 'g',
      qtyPerPortion: 0,
    } as DishIngredient);
  }

  removeIng(ing: DishIngredient) {
    this.local.ingredients = (this.local.ingredients || []).filter((i) => i !== ing);
  }

  async onIngNameChange(ing: DishIngredient, term: string) {
    ing.ingredientId = undefined;
    ing.ingredientName = (term || '').trim();
    if ((ing.ingredientName || '').length >= 2) this.search$.next(ing.ingredientName);
  }

  async closeSuggestLater() {
    setTimeout(async () => {
      if (this.openSuggestFor && this.openSuggestFor.ingredientName) {
        const match = await this.ingSvc.findByExactNameLc(this.openSuggestFor.ingredientName);
        if (match) {
          this.openSuggestFor.ingredientId = match.id;
          this.openSuggestFor.ingredientName = match.name;
        }
      }
      this.openSuggestFor = undefined;
    }, 150);
  }

  pickIngredient(ing: DishIngredient, opt: { id: string; name: string; defaultUnit?: Unit }) {
    ing.ingredientId = opt.id;
    ing.ingredientName = opt.name;
    if (!ing.unit && opt.defaultUnit) ing.unit = opt.defaultUnit;
    this.openSuggestFor = undefined;
    this.markDirty();
  }

  async createAndPick(ing: DishIngredient) {
    const name = (this.draftTerm || '').trim();
    if (!name) return;
    const id = await this.ingSvc.upsertByName(name);
    const created = await this.ingSvc.getById(id);
    if (created) {
      this.pickIngredient(ing, {
        id,
        name: (created as any).name,
        defaultUnit: (created as any).defaultUnit as Unit | undefined,
      });
    }
  }

  private async ensureIngredientId(row: DishIngredient): Promise<string | undefined> {
    if (row.ingredientId) return row.ingredientId;

    const name =
      (row as any).ingredientName?.toString().trim() || (row as any).name?.toString().trim() || '';
    if (!name) return undefined;

    const id = await this.ingSvc.upsertByName(name);
    return id;
  }

  async save() {
    const finalRows: Array<{ ingredientId: string; unit: Unit; qtyPerPortion: number }> = [];

    for (const i of this.local.ingredients || []) {
      const nameLike =
        (i as any).ingredientName?.toString().trim() || (i as any).name?.toString().trim() || '';
      // skip completely empty rows
      if (!i.ingredientId && !nameLike) continue;

      const id = await this.ensureIngredientId(i);
      if (!id) continue;

      finalRows.push({
        ingredientId: id,
        unit: (i.unit as Unit) || 'g',
        qtyPerPortion: Number(i.qtyPerPortion) || 0,
      });
    }

    const patch = {
      name: (this.local.name || '').trim(),
      description: (this.local.description || '').trim(),
      basePortionPerPerson: Number(this.local.basePortionPerPerson) || 1,
      ingredients: finalRows, // only refs now
      diet: (this.local.diet as any) ?? 'meat',
      kidFriendly: this.local.kidFriendly ?? true,
    };

    await this.svc.update(this.id, patch);
  }

  markDirty() {
    /* TODO */
  }
}
