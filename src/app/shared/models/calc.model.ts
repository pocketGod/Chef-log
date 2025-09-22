import { Unit } from "./common.model";

export interface TotalCalcRow {
  name: string;   // ingredient display name
  unit: Unit;     // compacted unit for display
  qty: number;    // total quantity across the whole event
}