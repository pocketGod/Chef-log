import { Dish } from '../models/dish.model';
import { EventDoc } from '../models/event.model';

export function totalGuests(evt: EventDoc): number {
  return (evt.segments ?? []).reduce((sum, s) => sum + (Number(s.guests) || 0), 0);
}

export function computeDishPortions(evt: EventDoc, dish: Dish, popularity: number): number {
  const guests = totalGuests(evt);
  const bpp = dish.basePortionPerPerson ?? 1;
  const pop = Number(popularity) || 1;
  return guests * bpp * pop;
}

export function aggregateIngredients(dishes: Dish[], evt: EventDoc) {
  const byKey = new Map<string, { name: string; unit: string; qty: number }>();

  for (const m of evt.menu ?? []) {
    const dish = dishes.find(d => d.id === m.dishId);
    if (!dish || !dish.ingredients?.length) continue;

    const portions = computeDishPortions(evt, dish, m.popularity ?? 1);
    for (const ing of dish.ingredients) {
      const key = `${ing.name}|${ing.unit}`;
      const prev = byKey.get(key)?.qty ?? 0;
      byKey.set(key, { name: ing.name, unit: ing.unit, qty: prev + portions * ing.qtyPerPortion });
    }
  }
  return Array.from(byKey.values()); // [{name, unit, qty}]
}
