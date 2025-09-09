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
    
    console.log('🔍 INTERCEPTOR: Requête vers', request.url);

    // Vérifier si cette URL nécessite un token
    const requiresToken = this.shouldAddToken(request.url);
    
    if (!requiresToken) {
      console.log('⚪ INTERCEPTOR: Pas de token requis pour', request.url);
      return next.handle(request);
    }

    // CORRECTION MAJEURE: Vérifier d'abord si la session est valide
    if (!this.authService.isSessionValid()) {
      console.log('❌ INTERCEPTOR: Session expirée');
      this.authService.forceLogout();
      return next.handle(request);
    }

    // Récupérer le token via la méthode sécurisée
    const token = this.authService.getToken();

    if (!token) {
      console.log('❌ INTERCEPTOR: Aucun token valide disponible');
      this.authService.forceLogout();
      return next.handle(request);
    }

    console.log('✅ INTERCEPTOR: Token valide trouvé (longueur:', token.length, ')');
    
    // CORRECTION: Validation plus stricte du format JWT
    if (!this.isValidJWT(token)) {
      console.log('❌ INTERCEPTOR: Format JWT invalide');
      this.authService.forceLogout();
      return next.handle(request);
    }

    // CORRECTION CRITIQUE: Ne pas modifier Content-Type pour FormData
    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };

    // Ajouter Content-Type SEULEMENT si ce n'est pas FormData
    if (!(request.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Créer la requête avec les bons headers
    const authenticatedRequest = request.clone({
      setHeaders: headers
    });

    console.log('🔒 INTERCEPTOR: Headers d\'authentification ajoutés');

    return next.handle(authenticatedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('💥 INTERCEPTOR ERROR:', error.status, error.message);
        
        // Gestion spécifique de l'erreur de parsing du token
        if (error.status === 500 && error.error?.message?.includes('token could not be parsed')) {
          console.log('🔴 INTERCEPTOR: Erreur parsing token - token corrompu');
          this.authService.diagnosticToken(); // Debug
          this.authService.forceLogout();
          return throwError(() => new Error('Token invalide - Veuillez vous reconnecter'));
        }

        // Gestion des erreurs d'authentification
        if (error.status === 401) {
          console.log('🔴 INTERCEPTOR: Token expiré ou invalide (401)');
          this.authService.forceLogout();
          return throwError(() => new Error('Session expirée - Veuillez vous reconnecter'));
        }

        // Gestion des erreurs de permissions
        if (error.status === 403) {
          console.log('🔴 INTERCEPTOR: Accès refusé (403)');
          return throwError(() => new Error('Accès refusé'));
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Vérification stricte du format JWT
   */
  private isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Vérifier le format de base (3 parties séparées par des points)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Vérifier que chaque partie est une chaîne base64 valide
    try {
      for (const part of parts) {
        if (!part || part.length === 0) {
          return false;
        }
        // Tentative de décodage base64
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      }
      return true;
    } catch (error) {
      console.log('❌ INTERCEPTOR: Erreur validation JWT:', error);
      return false;
    }
  }

  /**
   * Détermine si une URL nécessite un token d'authentification
   */
  private shouldAddToken(url: string): boolean {
    const excluded = this.EXCLUDED_URLS.some(excludedUrl => url.includes(excludedUrl));
    return !excluded;
  }
}