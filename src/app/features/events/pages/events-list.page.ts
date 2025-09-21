import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FirestoreService, WithId } from '../../../core/data/firestore.service';
import { EventDoc } from '../../../shared/models/event.model';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink],
  template: `
    <h1>Events</h1>

    <button (click)="create()">Create Event</button>

    @if (events$ | async; as events) {
      @if (events.length > 0) {
        <ul>
          @for (e of events; track e.id) {
            <li>
              <strong>{{ e.name }}</strong>
              <small> — {{ e.createdAt | date:'medium' }}</small>
              <br />
              <span>Segments:
                @for (s of e.segments; track s.key) {
                  {{s.key}}:{{s.guests}}{{$last ? '' : ', '}}
                }
              </span>
              <br />
              <a [routerLink]="['/events', e.id]">Open</a>
              &nbsp;|&nbsp;
              <button (click)="remove(e.id!)">Delete</button>
            </li>
          }
        </ul>
      } @else {
        <p>No events yet. Click “Create Event”.</p>
      }
    }
  `
})
export class EventsListPage {
  private db = inject(FirestoreService);
  private router = inject(Router);
  // live list from Firestore, newest first
  events$ = this.db.list$<EventDoc>('events', this.db.orderBy('createdAt', 'desc')) as ReturnType<typeof this.db.list$<EventDoc>>;

  async create() {
    const now = Date.now();
    const defaults: EventDoc['segments'] = [
      { key: 'adult', guests: 0 },
      { key: 'kid',   guests: 0 },
      { key: 'vegan', guests: 0 },
      { key: 'vegeterian', guests: 0 },
    ];
    const id = await this.db.add<EventDoc>('events', {
      name: `New Event ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      segments: defaults,
      menu: [],
    });
    this.router.navigate(['/events', id]);
  }

  async remove(id: string) {
    await this.db.remove(`events/${id}`);
  }
}
