import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ModalService } from '../core/services/modal.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);
  private modalService = inject(ModalService);

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
          
          // Vérifier si c'est une réponse avec status_code et message d'inactivité
          if (error.error?.status_code === 403 && 
              error.error?.success === false &&
              error.error?.message?.includes('inactif ou suspendu')) {
            console.log('🔴 INTERCEPTOR: Compte inactif/suspendu détecté - Déconnexion forcée');
            this.handleAccountSuspension();
            return throwError(() => new Error('Votre compte est inactif ou suspendu. Veuillez contacter l\'administrateur.'));
          }
          
          return throwError(() => new Error('Accès refusé'));
        }

        // Gestion des erreurs de connexion API (0, timeout, network errors)
        if (error.status === 0 || 
            error.message?.includes('Network') ||
            error.message?.includes('timeout') ||
            error.message?.includes('connection') ||
            error.error instanceof ProgressEvent) {
          console.log('🔴 INTERCEPTOR: Erreur de connexion API détectée');
          this.handleConnectionError();
          return throwError(() => new Error('Connexion au serveur impossible. Veuillez vérifier votre connexion réseau.'));
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

  private handleAccountSuspension(): void {
    console.log('🚨 INTERCEPTOR: Gestion de la suspension de compte');
    
    // Réinitialiser l'état utilisateur via AuthService (sans redirection)
    this.authService.resetUserState();
    
    // Afficher le modal de suspension
    this.modalService.showAccountSuspendedModal();
    
    // Rediriger vers la page de login après 4 secondes
    setTimeout(() => {
      this.modalService.hideModal();
      this.router.navigate(['/authentification/login']);
      console.log('🔄 INTERCEPTOR: Redirection vers /authentification/login');
    }, 4000);
  }

  private handleConnectionError(): void {
    console.log('🚨 INTERCEPTOR: Gestion des erreurs de connexion API');
    
    // Réinitialiser l'état utilisateur via AuthService (sans redirection)
    this.authService.resetUserState();
    
    // Afficher le modal d'erreur de connexion
    this.modalService.showConnectionErrorModal();
    
    // Rediriger vers la page de login après 4 secondes
    setTimeout(() => {
      this.modalService.hideModal();
      this.router.navigate(['/authentification/login']);
      console.log('🔄 INTERCEPTOR: Redirection vers /authentification/login après erreur de connexion');
    }, 4000);
  }
}