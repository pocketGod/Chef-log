import { GuestTypes } from "./common.model";

export interface Event {
  id?: string;
  name: string;
  date?: number;                  // Date.now()
  segments: EventSegment[]; // default rows: adults/kids/vegans
  menu: EventMenuItem[]; // per-event
  createdAt: number;
  ownerId?: string;
}


export interface EventSegment {
  key: GuestTypes;
  guests: number;
}

export interface EventMenuItem {
  dishId: string;
  popularity: number; // 0.1–3.0 per-event-per-dish
}

export interface EventDoc {
  id?: string;
  name: string;
  createdAt: number;  // Date.now()
  date?: number;
  segments: EventSegment[];
  menu: EventMenuItem[];
  context?: { serviceStyle?: 'buffet' | 'plated'; };
  ownerId?: string;
}
