import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { FirestoreService, WithId } from '../../../../core/data/firestore.service';
import { EventDoc } from '../../../../shared/models/event.model';
import { Router, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { LocalizePipe } from '../../../../shared/pipes/localize.pipe';


@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [AsyncPipe, DatePipe, RouterLink, CommonModule, LoaderComponent, LocalizePipe],
  templateUrl:'events-list.page.html',
  styleUrl:'events-list.page.scss'
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
