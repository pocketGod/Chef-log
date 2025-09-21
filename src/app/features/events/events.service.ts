// features/events/events.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService, WithId } from '../../core/data/firestore.service';
import { EventDoc, EventMenuItem, EventSegment } from '../../shared/models/event.model';

@Injectable({ providedIn: 'root' })
export class EventsService {
    private db = inject(FirestoreService);

    list$(): Observable<WithId<EventDoc>[]> {
        return this.db.list$<EventDoc>('events', this.db.orderBy('createdAt', 'desc'));
    }

    get$(id: string) {
        return this.db.doc$<EventDoc>(`events/${id}`);
    }

    add(e: Omit<EventDoc, 'id'>) {
        return this.db.add<EventDoc>('events', e);
    }

    update(id: string, patch: Partial<EventDoc>) {
        return this.db.update(`events/${id}`, patch); 
    }


    remove(id: string) {
        return this.db.remove(`events/${id}`);
    }

    upsertMenuItem(id: string, dishId: string, popularity: number, existing: EventMenuItem[]) {
        const next = [...existing];
        const idx = next.findIndex(m => m.dishId === dishId);
        if (idx >= 0) next[idx] = { dishId, popularity };
        else next.push({ dishId, popularity });
        return this.update(id, { menu: next });
    }

    setSegments(id: string, segments: EventSegment[]) {
        return this.update(id, { segments });
    }
}
