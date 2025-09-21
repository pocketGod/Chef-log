import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DishesService } from '../dishes.service';
import { Dish, DishIngredient } from '../../../shared/models/dish.model';
import { Diet, Unit } from '../../../shared/models/common.model';

@Component({
  selector: 'app-dish-editor',
  standalone: true,
  imports: [AsyncPipe, FormsModule, RouterLink],
  templateUrl:'dish-editor.page.html'
})
export class DishEditorPage {
  private route = inject(ActivatedRoute);
  private svc = inject(DishesService);

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

  constructor() {
    this.dish$.subscribe((d) => {
      if (!d) return;
      this.local = {
        name: d.name,
        description: d.description ?? '',
        basePortionPerPerson: d.basePortionPerPerson ?? 1,
        ingredients: (d.ingredients ?? []).map((x) => ({ ...x })),
        diet: (d.diet as Diet) ?? 'meat',
        kidFriendly: d.kidFriendly ?? true,
      };
    });
  }

  addIng() {
    (this.local.ingredients ||= []).push({
      name: '',
      unit: 'g',
      qtyPerPortion: 0,
    } as DishIngredient);
  }

  removeIng(ing: DishIngredient) {
    this.local.ingredients = (this.local.ingredients || []).filter((i) => i !== ing);
  }

  async save() {
    const patch: Partial<Dish> = {
      name: (this.local.name || '').trim(),
      description: (this.local.description || '').trim(),
      basePortionPerPerson: Number(this.local.basePortionPerPerson) || 1,
      ingredients: (this.local.ingredients || []).map((i) => ({
        name: i.name.trim(),
        unit: i.unit as Unit,
        qtyPerPortion: Number(i.qtyPerPortion) || 0,
      })),
      diet: (this.local.diet as Diet) ?? 'meat',
      kidFriendly: this.local.kidFriendly ?? true,
    };
    await this.svc.update(this.id, patch);
  }

  markDirty() {
    /* reserved for UX */
  }
}
