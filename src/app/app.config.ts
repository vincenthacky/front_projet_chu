import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { icons } from './icons-provider';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { fr_FR, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import fr from '@angular/common/locales/fr';
import { FormsModule } from '@angular/forms';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Import des interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { UnicodeDecodeInterceptor } from './interceptors/unicode-decode.interceptor';


// Import du service d'authentification
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
    provideHttpClient(),
    
    // Services
    AuthService,
    
    // Interceptors - L'ORDRE EST IMPORTANT !
    // 1. AuthInterceptor en premier (ajoute le token aux requêtes sortantes)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    
    // 2. UnicodeDecodeInterceptor en second (décode les réponses entrantes)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnicodeDecodeInterceptor,
      multi: true
    }
  ],
};