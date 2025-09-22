import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private http = inject(HttpClient);
  private dict$ = new BehaviorSubject<Record<string, string>>({});
  private lang = 'he';

  async load(lang = this.lang) {
    this.lang = lang;
    const data = await firstValueFrom(this.http.get<Record<string, string>>(`/assets/dictionary/${lang}.json`));
    this.dict$.next(data || {});
  }

  t(key: string, params?: Record<string, string | number>): string {
    const dict = this.dict$.value;
    let val = dict[key] ?? key; 
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        val = val.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
      }
    }
    return val;
  }

  watch() { return this.dict$.asObservable(); }
}


export function loadTransalation(translationService: TranslationService) {
  return () => translationService.load('he'); 
}