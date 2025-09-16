import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { icons } from './icons-provider';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { fr_FR, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import fr from '@angular/common/locales/fr';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// CORRECTION: Imports avec les bons chemins


// Import du service d'authentification avec le bon chemin

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { UnicodeDecodeInterceptor } from './interceptors/unicode-decode.interceptor';
import { AuthService } from './core/services/auth.service';

registerLocaleData(fr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideClientHydration(), 
    provideNzIcons(icons), 
    provideNzI18n(fr_FR), 
    importProvidersFrom(FormsModule), 
    provideAnimationsAsync(), 
    
    // CORRECTION: Configuration HTTP avec support des interceptors
    provideHttpClient(withInterceptorsFromDi()),
    
    // Services
    AuthService,
    
    // CORRECTION: Ordre des interceptors - CRITIQUE pour le bon fonctionnement
    // 1. AuthInterceptor (ajoute le token Authorization aux requêtes sortantes)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    
    // 2. UnicodeDecodeInterceptor (décode les réponses Unicode entrantes) 
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnicodeDecodeInterceptor,
      multi: true
    }
  ],
};