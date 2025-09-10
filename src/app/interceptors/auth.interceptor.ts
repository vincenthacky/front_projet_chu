import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  private readonly EXCLUDED_URLS = [
    '/api/login',
    '/api/register',
    '/api/password/send-token',
    '/api/password/reset',
    '/api/status'
  ];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('🔍 INTERCEPTOR: Requête vers', request.url);

    const requiresToken = this.shouldAddToken(request.url);
    
    if (!requiresToken) {
      console.log('⚪ INTERCEPTOR: Pas de token requis pour', request.url);
      return next.handle(request);
    }

    if (!this.authService.isSessionValid()) {
      console.log('❌ INTERCEPTOR: Session expirée');
      this.authService.forceLogout();
      return next.handle(request);
    }

    const token = this.authService.getToken();
    console.log('🔍 INTERCEPTOR: Valeur du token:', token || 'Aucun token');

    if (!token) {
      console.log('❌ INTERCEPTOR: Aucun token valide disponible');
      this.authService.forceLogout();
      return next.handle(request);
    }

    console.log('✅ INTERCEPTOR: Token valide trouvé (longueur:', token.length, ')');
    
    if (!this.isValidJWT(token)) {
      console.log('❌ INTERCEPTOR: Format JWT invalide');
      this.authService.forceLogout();
      return next.handle(request);
    }

    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };

    if (!(request.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const authenticatedRequest = request.clone({
      setHeaders: headers
    });

    console.log('🔒 INTERCEPTOR: Headers d\'authentification ajoutés');

    return next.handle(authenticatedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('💥 INTERCEPTOR ERROR:', error.status, error.message);
        
        if (error.status === 500 && error.error?.message?.includes('token could not be parsed')) {
          console.log('🔴 INTERCEPTOR: Erreur parsing token - token corrompu');
          this.authService.diagnosticToken();
          this.authService.forceLogout();
          return throwError(() => new Error('Token invalide - Veuillez vous reconnecter'));
        }

        if (error.status === 401) {
          console.log('🔴 INTERCEPTOR: Token expiré ou invalide (401)');
          this.authService.forceLogout();
          return throwError(() => new Error('Session expirée - Veuillez vous reconnecter'));
        }

        if (error.status === 403) {
          console.log('🔴 INTERCEPTOR: Accès refusé (403)');
          return throwError(() => new Error('Accès refusé'));
        }

        return throwError(() => error);
      })
    );
  }

  private isValidJWT(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      for (const part of parts) {
        if (!part || part.length === 0) {
          return false;
        }
        atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      }
      return true;
    } catch (error) {
      console.log('❌ INTERCEPTOR: Erreur validation JWT:', error);
      return false;
    }
  }

  private shouldAddToken(url: string): boolean {
    const excluded = this.EXCLUDED_URLS.some(excludedUrl => url.includes(excludedUrl));
    return !excluded;
  }
}