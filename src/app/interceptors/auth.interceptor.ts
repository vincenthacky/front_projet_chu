// src/app/core/interceptors/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  // URLs qui ne nécessitent PAS de token d'authentification
  private readonly EXCLUDED_URLS = [
    '/api/login',
    '/api/register',
    '/api/password/send-token',
    '/api/password/reset',
    '/api/status'
  ];

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    
    console.log('🌐 Interceptor - Requête vers:', request.url);

    // Vérifier si cette URL nécessite un token
    const requiresToken = this.shouldAddToken(request.url);
    
    if (!requiresToken) {
      console.log('🔓 Interceptor - Requête sans authentification:', request.url);
      return next.handle(request);
    }

    // Vérifier si la session est encore valide avant d'ajouter le token
    if (!this.authService.isSessionValid()) {
      console.log('⏰ Interceptor - Session expirée détectée');
      
      // Si la session a expiré, déconnecter l'utilisateur
      if (this.authService.isAuthenticated()) {
        console.log('🚪 Interceptor - Déconnexion automatique pour session expirée');
        this.authService.forceLogout(); // Utiliser forceLogout pour éviter la boucle
      }
      
      // Continuer la requête sans token (elle échouera probablement avec 401)
      return next.handle(request);
    }

    // Ajouter le token d'authentification si disponible et valide
    const token = this.authService.getToken();

    if (token) {
      console.log('🔑 Interceptor - Ajout du token à la requête');
      console.log('🔑 Interceptor - Token length:', token.length);
      
      request = request.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    } else {
      console.log('🔑 Interceptor - Aucun token disponible pour requête authentifiée');
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('❌ Interceptor - Erreur HTTP:', {
          status: error.status,
          url: error.url,
          message: error.message
        });

        // Gérer les erreurs d'authentification
        if (error.status === 401) {
          console.log('🚫 Interceptor - Erreur 401: Token invalide ou expiré');
          // Token expiré ou invalide - utiliser forceLogout pour éviter la boucle
          this.authService.forceLogout();
        }

        // Gérer les erreurs de permission
        if (error.status === 403) {
          console.error('🚫 Interceptor - Erreur 403: Accès refusé');
        }

        // Gérer les erreurs serveur
        if (error.status >= 500) {
          console.error('🔧 Interceptor - Erreur serveur:', error.status);
        }

        // Gérer les erreurs de connexion
        if (error.status === 0) {
          console.error('🌐 Interceptor - Erreur de connexion: Serveur inaccessible');
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Détermine si une URL nécessite un token d'authentification
   */
  private shouldAddToken(url: string): boolean {
    // Vérifier si l'URL est dans la liste des exclusions
    return !this.EXCLUDED_URLS.some(excludedUrl => url.includes(excludedUrl));
  }
}