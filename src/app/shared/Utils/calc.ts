import { TotalCalcRow } from "../models/calc.model";
import { Unit } from "../models/common.model";
import { Dish, DishIngredient } from "../models/dish.model";
import { EventDoc } from "../models/event.model";

export function totalGuests(evt: EventDoc): number {
  return (evt.segments ?? []).reduce((sum, s) => sum + (Number(s.guests) || 0), 0);
}

export function computeDishPortions(evt: EventDoc, dish: Dish, popularity: number): number {
  const guests = totalGuests(evt);
  const bpp = Number(dish.basePortionPerPerson ?? 1);
  const pop = Number(popularity) || 1;
  return guests * bpp * pop;
}

const unitBase: Record<Unit, { base: Unit; mul: number }> = {
  g:  { base: 'g',  mul: 1 },
  kg: { base: 'g',  mul: 1000 },
  ml: { base: 'ml', mul: 1 },
  l:  { base: 'ml', mul: 1000 },
  pcs:{ base: 'pcs',mul: 1 },
};

function baseKey(ing: DishIngredient): string {
  const idOrName = ing.ingredientId || ing.ingredientName || '';
  const baseU = unitBase[ing.unit].base;
  return `${idOrName}|${baseU}`;
}


function compactRow(row: TotalCalcRow): TotalCalcRow {
  if (row.unit === 'g' && row.qty >= 1000) return { ...row, unit: 'kg', qty: row.qty / 1000 };
  if (row.unit === 'ml' && row.qty >= 1000) return { ...row, unit: 'l',  qty: row.qty / 1000 };
  return row;
}



// add param with default
export function aggregateIngredients(
  dishes: Dish[],
  evt: EventDoc,
  nameById: Record<string, string> = {}
): TotalCalcRow[] {
  const byKey = new Map<string, { name: string; baseUnit: Unit; qtyBase: number }>();

  for (const m of (evt.menu ?? [])) {
    const dish = dishes.find((d) => d.id === m.dishId);
    if (!dish || !dish.ingredients?.length) continue;

    const portions = computeDishPortions(evt, dish, Number(m.popularity ?? 1));

    for (const ing of dish.ingredients) {
      if (!ing || (!ing.ingredientId && !ing.ingredientName)) continue;

      const base = unitBase[ing.unit];
      const addQtyBase = (Number(ing.qtyPerPortion) || 0) * portions * base.mul;
      const key = baseKey(ing);

      // 👇 prefer resolved name by id; fall back to any local name; else "Unnamed"
      const resolvedName =
        (ing.ingredientId && nameById[ing.ingredientId]) ||
        (ing.ingredientName || '').trim() ||
        'Unnamed';

      const prev = byKey.get(key);
      if (!prev) {
        byKey.set(key, { name: resolvedName, baseUnit: base.base, qtyBase: addQtyBase });
      } else {
        prev.qtyBase += addQtyBase;
      }
    }
  }

  const rows: TotalCalcRow[] = Array.from(byKey.values()).map((r) =>
    compactRow({ name: r.name, unit: r.baseUnit, qty: r.qtyBase })
  );
  rows.sort((a, b) => a.name.localeCompare(b.name) || a.unit.localeCompare(b.unit));
  return rows;
}
