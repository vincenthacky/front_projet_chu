// guards/auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        console.log('🔒 Guard - Vérification accès pour:', state.url);
        console.log('🔒 Guard - Utilisateur authentifié:', isAuthenticated);
        
        const url = state.url;
        
        // NOUVEAU : Gérer les routes d'authentification
        if (this.isAuthRoute(url)) {
          if (isAuthenticated) {
            // Si déjà connecté et qu'on va sur login, rediriger vers dashboard
            console.log('🔄 Guard - Déjà connecté, redirection depuis login vers dashboard');
            this.redirectToDashboard();
            return false;
          } else {
            // Pas connecté, autoriser l'accès aux pages d'auth
            console.log('✅ Guard - Accès autorisé aux pages d\'authentification');
            return true;
          }
        }

        // Pour toutes les autres routes, vérifier l'authentification
        if (!isAuthenticated) {
          console.log('❌ Guard - Non authentifié, redirection vers login');
          this.router.navigate(['/authentification/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        }

        // Utilisateur connecté - vérifier les permissions
        const user = this.authService.getCurrentUser();
        if (!user) {
          console.log('❌ Guard - Pas d\'utilisateur, redirection vers login');
          this.router.navigate(['/authentification/login']);
          return false;
        }

        // Vérification supplémentaire du rôle (au cas où)
        if (user.type !== 'user' && user.type !== 'superAdmin') {
          console.error('❌ Guard - Rôle non autorisé:', user.type);
          this.authService.forceLogout();
          return false;
        }

        console.log('👤 Guard - Utilisateur:', {
          nom: user.nom,
          type: user.type,
          est_administrateur: user.est_administrateur
        });

        const isAdminUser = this.authService.isAdmin();
        console.log('🛡️ Guard - Est admin?', isAdminUser);

        // Routes admin - réservées aux administrateurs
        if (url.includes('/dashboard/admin')) {
          if (isAdminUser) {
            console.log('✅ Guard - Accès admin autorisé');
            return true;
          } else {
            console.log('🔄 Guard - Pas admin, redirection vers user dashboard');
            this.router.navigate(['/dashboard/user/details']);
            return false;
          }
        }

        // Routes user - réservées aux utilisateurs standards
        if (url.includes('/dashboard/user')) {
          if (!isAdminUser) {
            console.log('✅ Guard - Accès user autorisé');
            return true;
          } else {
            console.log('🔄 Guard - Admin détecté, redirection vers admin dashboard');
            this.router.navigate(['/dashboard/admin/details']);
            return false;
          }
        }

        // Route dashboard générale - rediriger selon le rôle
        if (url === '/dashboard' || url === '/dashboard/') {
          this.redirectToDashboard();
          return false;
        }

        // Autres routes protégées
        console.log('✅ Guard - Accès général autorisé');
        return true;
      })
    );
  }

  /**
   * Vérifier si c'est une route d'authentification
   */
  private isAuthRoute(url: string): boolean {
    const authRoutes = [
      '/authentification/login',
      '/authentification/register',
      '/authentification/forgot-password',
      '/authentification/reset-password'
    ];
    
    return authRoutes.some(route => url.startsWith(route));
  }

  /**
   * Rediriger vers le dashboard approprié selon le rôle
   */
  private redirectToDashboard(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      const isAdminUser = this.authService.isAdmin();
      if (isAdminUser) {
        console.log('🔄 Guard - Admin, redirection vers admin dashboard');
        this.router.navigate(['/dashboard/admin/details']);
      } else {
        console.log('🔄 Guard - User, redirection vers user dashboard');
        this.router.navigate(['/dashboard/user/details']);
      }
    }
  }
}