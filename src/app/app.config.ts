import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { firebaseProviders } from './core/firebase/firebase.providers';
import { loadTransalation, TranslationService } from './shared/services/translation.service';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    ...firebaseProviders,
    { provide: APP_INITIALIZER, useFactory: loadTransalation, deps: [TranslationService], multi: true }
 
  ]
};
