import { Diet, Unit } from "./common.model";



export interface Dish {
  id?: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  createdAt: number;     // Date.now()
  ownerId?: string;

  basePortionPerPerson?: number;     // default 1 if undefined
  ingredients?: DishIngredient[];    // empty for now 

  diet: Diet;              // 'meat' for kebab, 'vegan' for salad, etc...
  kidFriendly?: boolean;   // default true if null
}


export interface DishIngredient {
  name: string;
  unit: Unit;
  qtyPerPortion: number;
}


