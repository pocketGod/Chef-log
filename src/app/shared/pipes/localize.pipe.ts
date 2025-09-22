import { Pipe, PipeTransform, inject, ChangeDetectorRef } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({ name: 'localize', standalone: true, pure: false })
export class LocalizePipe implements PipeTransform {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private last: string = '';

  constructor() {
    this.translationService.watch().subscribe(() => this.cdr.markForCheck());
  }

  transform(key: string, params?: Record<string, string | number>): string {
    this.last = this.translationService.t(key, params);
    return this.last;
  }
}
