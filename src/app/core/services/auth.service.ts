import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, map, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from 'src/assets/environment/environment';
import { Inject, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { User, LoginResponse, LogoutResponse, ForgotPasswordResponse, ResetPasswordResponse, UserProfileResponse, UserUpdateResponse, UsersResponse } from '../models/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  private inactivityTimer?: number;
  private lastActivityTime: number = 0;
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  // ✅ CORRECTION : Stocker les références exactes des listeners
  private activityListeners: Array<{ event: string; listener: EventListener }> = [];
  
  private isBrowser: boolean;

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    if (this.isBrowser) {
      this.checkAuthStatus();
    }
  }

  private decodeUnicodeString(str: string): string {
    if (!str || typeof str !== 'string') return str;
    
    try {
      let decoded = str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
      });
      
      decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
        return String.fromCharCode(dec);
      });
      
      const htmlEntities: { [key: string]: string } = {
        '&eacute;': 'é',
        '&egrave;': 'è',
        '&ecirc;': 'ê',
        '&agrave;': 'à',
        '&acirc;': 'â',
        '&ccedil;': 'ç',
        '&ocirc;': 'ô',
        '&ugrave;': 'ù',
        '&ucirc;': 'û',
        '&icirc;': 'î',
        '&ntilde;': 'ñ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
      };
      
      for (const [entity, char] of Object.entries(htmlEntities)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), char);
      }
      
      try {
        if (decoded.includes('%')) {
          decoded = decodeURIComponent(decoded);
        }
      } catch (e) {
        console.warn('Erreur decodeURIComponent:', e);
      }
      
      return decoded;
    } catch (error) {
      console.warn('Erreur décodage Unicode pour:', str, error);
      return str;
    }
  }

  private decodeUnicodeInObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      return this.decodeUnicodeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.decodeUnicodeInObject(item));
    }
    
    if (typeof obj === 'object') {
      const decoded: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const decodedKey = this.decodeUnicodeString(key);
          decoded[decodedKey] = this.decodeUnicodeInObject(obj[key]);
        }
      }
      return decoded;
    }
    
    return obj;
  }

  public testDecoding(): void {
    const testStrings = [
      'Connexion r\\u00e9ussie',
      'D\\u00e9veloppeur',
      'D\\u00e9connexion effectu\\u00e9e avec succ\\u00e8s'
    ];
    
    console.log('🧪 Test de décodage Unicode:');
    testStrings.forEach(str => {
      const decoded = this.decodeUnicodeString(str);
      console.log(`   "${str}" → "${decoded}"`);
    });
  }

  login(credentials: { identifiant: string; mot_de_passe: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('📨 Réponse API brute:', response);
        }),
        map(response => {
          const decodedResponse = this.decodeUnicodeInObject(response) as LoginResponse;
          console.log('📨 Réponse API décodée:', decodedResponse);
          return decodedResponse;
        }),
        map(decodedResponse => {
          if (decodedResponse.success === true && decodedResponse.data && decodedResponse.data.user && decodedResponse.data.token) {
            const user = decodedResponse.data.user;
            if (user.type !== 'user' && user.type !== 'superAdmin') {
              console.error('❌ Rôle non autorisé:', user.type);
              throw new Error('Accès non authorisé');
            }
            if (user.statut_utilisateur.toLowerCase() !== 'actif') {
              console.error('❌ Statut non actif:', user.statut_utilisateur);
              throw new Error('Compte non actif');
            }
            return decodedResponse;
          } else {
            console.error('❌ Structure de réponse inattendue:', decodedResponse);
            throw new Error('Structure de réponse invalide');
          }
        }),
        tap(decodedResponse => {
          console.log('✅ Connexion réussie, stockage des données...');
          this.setAuthData(decodedResponse.data.user, decodedResponse.data.token);
        }),
        catchError(error => {
          console.error('❌ Erreur de connexion:', error);
          if (error.error) {
            error.error = this.decodeUnicodeInObject(error.error);
          }
          return throwError(error);
        })
      );
  }

  logout(): void {
    console.log('🚪 Déconnexion en cours...');
    
    const token = this.getToken();
    console.log('🔍 Token récupéré:', token ? 'Token présent (longueur: ' + token.length + ')' : 'Aucun token');
    
    if (this.isBrowser && token) {
      console.log('🔑 Token détecté, tentative de logout backend...');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      this.http.post<LogoutResponse>(`${this.API_URL}/logout`, {}, { headers }).pipe(
        map(response => this.decodeUnicodeInObject(response) as LogoutResponse)
      ).subscribe({
        next: (response: LogoutResponse) => {
          console.log('✅ SUCCÈS! Réponse backend décodée:', response);
          console.log('🎉 Message:', response.message);
          this.completeLogout();
        },
        error: (error: any) => {
          console.log('📊 ERREUR logout backend:', error);
          if (error.error) {
            error.error = this.decodeUnicodeInObject(error.error);
          }
          console.log('⚠️ Erreur backend, déconnexion locale quand même');
          this.completeLogout();
        }
      });
    } else {
      console.log('⚠️ Pas de token, déconnexion directe');
      this.completeLogout();
    }
  }

  private completeLogout(): void {
    this.stopInactivityDetection();
    
    if (this.isBrowser) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authExpiry');
    }

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    console.log('🚪 Déconnexion terminée');
    
    if (this.isBrowser) {
      this.router.navigate(['/authentification/login']);
    }
  }

  manualLogout(): void {
    this.logout();
  }

  forceLogout(): void {
    console.log('🚪 Déconnexion forcée (token invalide)');
    this.completeLogout();
  }

  resetUserState(): void {
    console.log('🔄 Réinitialisation de l\'état utilisateur sans redirection');
    this.stopInactivityDetection();
    
    if (this.isBrowser) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authExpiry');
    }

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  private setAuthData(user: User, token: string): void {
    if (!this.isBrowser) return;
    
    const decodedUser = this.decodeUnicodeInObject(user) as User;
    console.log('📝 Stockage utilisateur décodé:', decodedUser);
    
    const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    
    console.log('⏰ Expiration token prévue à:', new Date(expiryTime));
    
    localStorage.setItem('user', JSON.stringify(decodedUser));
    localStorage.setItem('token', token);
    localStorage.setItem('authExpiry', expiryTime.toString());

    this.currentUserSubject.next(decodedUser);
    this.isAuthenticatedSubject.next(true);
    
    // ✅ CORRECTION : Configuration ET démarrage
    this.setupInactivityDetection();
    this.startInactivityDetection();
  }

  private checkAuthStatus(): void {
    if (!this.isBrowser) return;
    
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('authExpiry');

    console.log('🔍 Vérification statut authentification:', { user: !!user, token: !!token, expiry: !!expiry });

    if (user && token && expiry) {
      const now = new Date().getTime();
      const expiryTime = parseInt(expiry, 10);

      if (now < expiryTime) {
        try {
          let userData: User = JSON.parse(user);
          userData = this.decodeUnicodeInObject(userData) as User;

          if (userData.type !== 'user' && userData.type !== 'superAdmin') {
            console.error('❌ Rôle non autorisé au chargement:', userData.type);
            this.forceLogout();
            return;
          }
          if (userData.statut_utilisateur.toLowerCase() !== 'actif') {
            console.error('❌ Statut non actif au chargement:', userData.statut_utilisateur);
            this.forceLogout();
            return;
          }

          console.log('✅ Session valide - Utilisateur connecté (décodé):', userData);
          this.currentUserSubject.next(userData);
          this.isAuthenticatedSubject.next(true);
          
          // ✅ CORRECTION : Configuration ET démarrage de la détection
          this.setupInactivityDetection();
          this.startInactivityDetection();
        } catch (error) {
          console.error('❌ Erreur lors du parsing des données utilisateur:', error);
          this.forceLogout();
        }
      } else {
        console.log('⏰ Token expiré au démarrage');
        this.forceLogout();
      }
    } else {
      console.log('🔍 Aucune session trouvée');
    }
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.API_URL}/password/send-token`, { email })
      .pipe(
        tap(response => {
          console.log('📧 Réponse brute envoi token:', response);
        }),
        map(response => {
          const decoded = this.decodeUnicodeInObject(response) as ForgotPasswordResponse;
          console.log('📧 Réponse décodée envoi token:', decoded);
          return decoded;
        }),
        catchError(error => {
          console.error('❌ Erreur envoi token:', error);
          if (error.error) {
            error.error = this.decodeUnicodeInObject(error.error);
          }
          return throwError(error);
        })
      );
  }

  resetPassword(token: string, password: string, password_confirmation: string): Observable<ResetPasswordResponse> {
    console.log('🔐 Service resetPassword appelé avec:');
    console.log('   - Token (longueur):', token ? token.length : 'null/undefined');
    
    const requestBody = {
      token_reset: token,
      mot_de_passe: password,
      mot_de_passe_confirmation: password_confirmation
    };
    
    return this.http.post<ResetPasswordResponse>(`${this.API_URL}/password/reset`, requestBody).pipe(
      tap(response => {
        console.log('🔐 Réponse brute réinitialisation:', response);
      }),
      map(response => {
        const decoded = this.decodeUnicodeInObject(response) as ResetPasswordResponse;
        console.log('🔐 Réponse décodée réinitialisation:', decoded);
        return decoded;
      }),
      catchError(error => {
        console.error('❌ Erreur réinitialisation mot de passe:', error);
        if (error.error) {
          error.error = this.decodeUnicodeInObject(error.error);
        }
        return throwError(error);
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.API_URL}/profile`, userData)
      .pipe(
        map(response => this.decodeUnicodeInObject(response) as { user: User }),
        tap(response => {
          if (response && response.user && this.isBrowser) {
            const currentUser = this.getCurrentUser();
            if (currentUser) {
              const updatedUser = { ...currentUser, ...response.user };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              this.currentUserSubject.next(updatedUser);
              console.log('👤 Profil personnel mis à jour (décodé):', updatedUser);
            }
          }
        }),
        catchError(error => {
          console.error('❌ Erreur mise à jour profil personnel:', error);
          if (error.error) {
            error.error = this.decodeUnicodeInObject(error.error);
          }
          return throwError(error);
        })
      );
  }

  updatePassword(data: {
    ancien_mot_de_passe: string;
    nouveau_mot_de_passe: string;
    nouveau_mot_de_passe_confirmation: string;
  }): Observable<any> {
    const token = this.getToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification trouvé');
      return throwError(() => new Error('Utilisateur non authentifié'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.API_URL}/password/update`, data, { headers }).pipe(
      tap(response => console.log('📨 Réponse brute mise à jour mot de passe:', response)),
      map(response => this.decodeUnicodeInObject(response)),
      catchError(error => {
        console.error('❌ Erreur mise à jour mot de passe:', error);
        if (error.error) {
          error.error = this.decodeUnicodeInObject(error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Erreur serveur'));
      })
    );
  }

  // ============================================
  // MÉCANISME D'INACTIVITÉ - CORRIGÉ
  // ============================================

  /**
   * ✅ CORRECTION : Configuration des listeners avec références exactes
   */
  private setupInactivityDetection(): void {
    if (!this.isBrowser) return;
    
    // Nettoyer les anciens listeners avant d'en ajouter de nouveaux
    this.stopInactivityDetection();
    
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'keydown'
    ];
    
    activityEvents.forEach(event => {
      const listener = () => this.resetInactivityTimer();
      
      // ✅ CORRECTION : Stocker la référence exacte pour pouvoir la supprimer
      this.activityListeners.push({ event, listener });
      document.addEventListener(event, listener, true);
    });
    
    console.log('👂 Détection d\'activité configurée avec', this.activityListeners.length, 'listeners');
  }

  /**
   * ✅ AMÉLIORATION : Vérifier la session au démarrage
   */
  private startInactivityDetection(): void {
    if (!this.isBrowser) return;
    
    // ✅ AMÉLIORATION : Vérifier si la session n'était pas déjà inactive
    const expiry = localStorage.getItem('authExpiry');
    if (expiry) {
      const expiryTime = parseInt(expiry, 10);
      const now = Date.now();
      
      if (now >= expiryTime) {
        console.log('⏰ Session déjà expirée au démarrage');
        this.forceLogout();
        return;
      }
    }
    
    this.lastActivityTime = Date.now();
    this.resetInactivityTimer();
    
    console.log('⏰ Surveillance d\'inactivité démarrée (30 minutes)');
    console.log('⏰ Prochaine déconnexion automatique à:', 
      new Date(Date.now() + this.INACTIVITY_TIMEOUT).toLocaleTimeString()
    );
  }

  /**
   * Réinitialise le timer d'inactivité à chaque activité détectée
   */
  private resetInactivityTimer(): void {
    if (!this.isBrowser || !this.isAuthenticated()) return;
    
    this.lastActivityTime = Date.now();
    
    // Nettoyer le timer existant
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    // Créer un nouveau timer
    this.inactivityTimer = window.setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * ✅ AMÉLIORATION : Logs plus informatifs
   */
  private handleInactivityTimeout(): void {
    const inactiveTime = Date.now() - this.lastActivityTime;
    const inactiveMinutes = Math.floor(inactiveTime / 60000);
    
    console.log(`⏰ Déconnexion pour inactivité (${inactiveMinutes} minutes sans activité)`);
    console.log('⏰ Dernière activité détectée à:', new Date(this.lastActivityTime).toLocaleTimeString());
    
    this.forceLogout();
  }

  /**
   * ✅ CORRECTION : Suppression correcte des listeners
   */
  private stopInactivityDetection(): void {
    if (!this.isBrowser) return;
    
    // Nettoyer le timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = undefined;
    }
    
    // ✅ CORRECTION : Supprimer avec les bonnes références
    this.activityListeners.forEach(({ event, listener }) => {
      document.removeEventListener(event, listener, true);
    });
    
    // Vider le tableau
    this.activityListeners = [];
    
    console.log('🛑 Surveillance d\'inactivité arrêtée');
  }

  /**
   * Obtient le temps restant avant déconnexion (en secondes)
   */
  public getTimeUntilInactivityLogout(): number {
    if (!this.isBrowser || !this.isAuthenticated()) return 0;
    
    const timeElapsed = Date.now() - this.lastActivityTime;
    const timeRemaining = this.INACTIVITY_TIMEOUT - timeElapsed;
    
    return Math.max(0, Math.ceil(timeRemaining / 1000));
  }

  /**
   * ✅ NOUVEAU : Obtenir le temps restant formaté
   */
  public getTimeUntilInactivityLogoutFormatted(): string {
    const seconds = this.getTimeUntilInactivityLogout();
    
    if (seconds === 0) return 'Expiré';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}min ${remainingSeconds}s`;
  }

  /**
   * ✅ NOUVEAU : Vérifier si proche de l'expiration (5 minutes)
   */
  public isCloseToInactivityLogout(): boolean {
    const seconds = this.getTimeUntilInactivityLogout();
    return seconds > 0 && seconds <= 300; // 5 minutes
  }

  // ============================================
  // FIN MÉCANISME D'INACTIVITÉ
  // ============================================

  public isSessionValid(): boolean {
    if (!this.isBrowser) return false;
    
    const expiry = localStorage.getItem('authExpiry');
    const token = localStorage.getItem('token');
    
    if (!expiry || !token) return false;
    
    const now = new Date().getTime();
    const expiryTime = parseInt(expiry, 10);
    
    return now < expiryTime;
  }

  getCurrentUser(): User | null {
    const user = this.currentUserSubject.value;
    console.log('🔍 Utilisateur connecté récupéré:', user);
    return user;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    const isAdmin = user.est_administrateur || 
                    user.type === 'superAdmin';
    console.log('🔍 Vérification admin:', { userId: user.id_utilisateur, isAdmin });
    return isAdmin;
  }

  isUser(): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    return !user.est_administrateur && 
           user.type !== 'superAdmin';
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('authExpiry');
    
    if (!token || !expiry) return null;
    
    const now = new Date().getTime();
    const expiryTime = parseInt(expiry, 10);
    
    if (now >= expiryTime) return null;
    
    return token;
  }

  redirectAfterLogin(): void {
    if (!this.isBrowser) return;
    
    const user = this.getCurrentUser();
    console.log('🔄 Redirection - Utilisateur complet:', user);
    
    if (user) {
      const isAdminUser = this.isAdmin();
      console.log('🔄 Est admin?', isAdminUser);
      
      setTimeout(() => {
        if (isAdminUser) {
          console.log('→ Redirection vers admin dashboard');
          this.router.navigate(['/dashboard/admin/details']);
        } else {
          console.log('→ Redirection vers user dashboard');
          this.router.navigate(['/dashboard/user/details']);
        }
      }, 100);
    } else {
      console.error('❌ Aucun utilisateur trouvé pour la redirection');
      this.router.navigate(['/authentification/login']);
    }
  }

  checkServerStatus(): Observable<any> {
    return this.http.get(`${this.API_URL}/status`)
      .pipe(
        catchError(error => {
          console.error('❌ Serveur inaccessible:', error);
          return throwError(error);
        })
      );
  }

  public diagnosticToken(): void {
    if (!this.isBrowser) {
      console.log('PAS CÔTÉ NAVIGATEUR');
      return;
    }

    console.log('=== DIAGNOSTIC TOKEN ===');
    
    console.log('Service state:');
    console.log('- isAuthenticated():', this.isAuthenticated());
    console.log('- isSessionValid():', this.isSessionValid());
    
    const rawToken = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    const rawExpiry = localStorage.getItem('authExpiry');
    
    console.log('LocalStorage:');
    console.log('- token présent:', !!rawToken);
    console.log('- token length:', rawToken?.length || 0);
    console.log('- user présent:', !!rawUser);
    console.log('- expiry présent:', !!rawExpiry);
    
    if (rawToken) {
      console.log('Token analysis:');
      console.log('- Premier 30 chars:', rawToken.substring(0, 30));
      console.log('- Format JWT (3 parties):', rawToken.split('.').length === 3);
      
      if (rawToken.split('.').length === 3) {
        try {
          const parts = rawToken.split('.');
          const header = JSON.parse(atob(parts[0]));
          const payload = JSON.parse(atob(parts[1]));
          console.log('- JWT header:', header);
          console.log('- JWT payload keys:', Object.keys(payload));
          
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            console.log('- Token expire le:', expDate.toISOString());
            console.log('- Token expiré:', now > expDate);
          }
        } catch (e) {
          console.log('- ERREUR décodage JWT:', e);
        }
      }
    }
    
    const serviceToken = this.getToken();
    console.log('getToken() result:', serviceToken ? 'TOKEN RETOURNÉ' : 'NULL');
    console.log('Tokens identiques:', rawToken === serviceToken);
    
    console.log('=== FIN DIAGNOSTIC ===');
  }

  getUserProfile(userId: number): Observable<UserProfileResponse> {
    const token = this.getToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification trouvé');
      return throwError(() => new Error('Utilisateur non authentifié'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<UserProfileResponse>(`${this.API_URL}/utilisateurs/${userId}`, { headers }).pipe(
      tap(response => {
        console.log('📨 Réponse brute récupération profil:', response);
      }),
      map(response => {
        const decoded = this.decodeUnicodeInObject(response) as UserProfileResponse;
        console.log('📨 Réponse décodée récupération profil:', decoded);
        return decoded;
      }),
      catchError(error => {
        console.error('❌ Erreur récupération profil utilisateur:', error);
        if (error.error) {
          error.error = this.decodeUnicodeInObject(error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Erreur serveur'));
      })
    );
  }

  updateUserProfile(userId: number, userData: Partial<User>): Observable<UserUpdateResponse> {
    const token = this.getToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification trouvé');
      return throwError(() => new Error('Utilisateur non authentifié'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    console.log('🔄 Mise à jour du profil utilisateur:', {
      userId,
      userData,
      url: `${this.API_URL}/utilisateurs/${userId}`
    });

    return this.http.put<UserUpdateResponse>(`${this.API_URL}/utilisateurs/${userId}`, userData, { headers }).pipe(
      tap(response => {
        console.log('📨 Réponse brute mise à jour profil:', response);
      }),
      map(response => {
        const decoded = this.decodeUnicodeInObject(response) as UserUpdateResponse;
        console.log('📨 Réponse décodée mise à jour profil:', decoded);
        return decoded;
      }),
      tap(decodedResponse => {
        if (decodedResponse.success && decodedResponse.data && this.isBrowser) {
          const currentUser = this.getCurrentUser();
          
          if (currentUser && currentUser.id_utilisateur === userId) {
            const updatedUser = { ...currentUser, ...decodedResponse.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.currentUserSubject.next(updatedUser);
            console.log('👤 Données utilisateur connecté mises à jour localement:', updatedUser);
          } else {
            console.log('👤 Modification d\'un autre utilisateur, pas de mise à jour locale');
          }
        }
      }),
      catchError(error => {
        console.error('❌ Erreur mise à jour profil utilisateur:', error);
        if (error.error) {
          error.error = this.decodeUnicodeInObject(error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Erreur serveur'));
      })
    );
  }

  updateUserWithFormData(userId: number, formData: FormData): Observable<UserUpdateResponse> {
    const token = this.getToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification trouvé');
      return throwError(() => new Error('Utilisateur non authentifié'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    console.log('🔄 Mise à jour du profil utilisateur avec FormData:', {
      userId,
      url: `${this.API_URL}/utilisateurs/${userId}/update`
    });

    return this.http.post<UserUpdateResponse>(`${this.API_URL}/utilisateurs/${userId}/update`, formData, { headers }).pipe(
      tap(response => {
        console.log('📨 Réponse brute mise à jour profil (POST):', response);
      }),
      map(response => {
        const decoded = this.decodeUnicodeInObject(response) as UserUpdateResponse;
        console.log('📨 Réponse décodée mise à jour profil (POST):', decoded);
        return decoded;
      }),
      tap(decodedResponse => {
        if (decodedResponse.success && decodedResponse.data && this.isBrowser) {
          const currentUser = this.getCurrentUser();
          
          if (currentUser && currentUser.id_utilisateur === userId) {
            const updatedUser = { ...currentUser, ...decodedResponse.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            this.currentUserSubject.next(updatedUser);
            console.log('👤 Données utilisateur connecté mises à jour localement (POST):', updatedUser);
          } else {
            console.log('👤 Modification d\'un autre utilisateur, pas de mise à jour locale');
          }
        }
      }),
      catchError(error => {
        console.error('❌ Erreur mise à jour profil utilisateur (POST):', error);
        if (error.error) {
          error.error = this.decodeUnicodeInObject(error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Erreur serveur'));
      })
    );
  }

  getAllUsers(): Observable<User[]> {
    const token = this.getToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification trouvé');
      return throwError(() => new Error('Utilisateur non authentifié'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const params = new HttpParams().set('per_page', '100000');

    return this.http.get<UsersResponse>(`${this.API_URL}/utilisateurs`, { headers, params }).pipe(
      tap(response => {
        console.log('📋 Réponse brute récupération utilisateurs:', response);
      }),
      map(response => {
        const decoded = this.decodeUnicodeInObject(response) as UsersResponse;
        console.log('📋 Réponse décodée récupération utilisateurs:', decoded);
        return decoded.data;
      }),
      catchError(error => {
        console.error('❌ Erreur récupération utilisateurs:', error);
        if (error.error) {
          error.error = this.decodeUnicodeInObject(error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Erreur serveur'));
      })
    );
  }

  createUser(userData: any): Observable<UserUpdateResponse> {
    const token = this.getToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification trouvé');
      return throwError(() => new Error('Utilisateur non authentifié'));
    }
  
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  
    console.log('🔄 Création d\'un nouvel utilisateur:', {
      userData,
      url: `${this.API_URL}/utilisateurs`
    });
  
    return this.http.post<UserUpdateResponse>(`${this.API_URL}/utilisateurs`, userData, { headers }).pipe(
      tap(response => {
        console.log('📨 Réponse brute création utilisateur:', response);
      }),
      map(response => {
        const decoded = this.decodeUnicodeInObject(response) as UserUpdateResponse;
        console.log('📨 Réponse décodée création utilisateur:', decoded);
        return decoded;
      }),
      catchError(error => {
        console.error('❌ Erreur création utilisateur:', error);
        if (error.error) {
          error.error = this.decodeUnicodeInObject(error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Erreur serveur'));
      })
    );
  }

  createUserWithFiles(formData: FormData): Observable<UserUpdateResponse> {
    const token = this.getToken();
    if (!token) {
      console.error('❌ Aucun token d\'authentification trouvé');
      return throwError(() => new Error('Utilisateur non authentifié'));
    }
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    console.log('🔄 Création d\'un nouvel utilisateur avec fichiers:', {
      url: `${this.API_URL}/utilisateurs`
    });
  
    return this.http.post<UserUpdateResponse>(`${this.API_URL}/utilisateurs`, formData, { headers }).pipe(
      tap(response => {
        console.log('📨 Réponse brute création utilisateur avec fichiers:', response);
      }),
      map(response => {
        const decoded = this.decodeUnicodeInObject(response) as UserUpdateResponse;
        console.log('📨 Réponse décodée création utilisateur avec fichiers:', decoded);
        return decoded;
      }),
      catchError(error => {
        console.error('❌ Erreur création utilisateur avec fichiers:', error);
        if (error.error) {
          error.error = this.decodeUnicodeInObject(error.error);
        }
        return throwError(() => new Error(error.error?.message || 'Erreur serveur'));
      })
    );
  }

  checkEmailExists(email: string): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Utilisateur non authentifié'));
    }
  
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get<{exists: boolean}>(`${this.API_URL}/check-email`, {
      headers,
      params: { email }
    }).pipe(
      map(response => response.exists),
      catchError(error => {
        console.error('❌ Erreur vérification email:', error);
        return of(false);
      })
    );
  }

  updateCurrentUser(data: User): void {
    if (this.isBrowser) {
      localStorage.setItem('user', JSON.stringify(data));
      this.currentUserSubject.next(data);
      console.log('👤 Utilisateur courant mis à jour:', data);
    }
  }

  /**
   * ✅ AMÉLIORATION : Nettoyage complet au destroy
   */
  ngOnDestroy(): void {
    this.stopInactivityDetection();
    
    // Compléter les observables
    this.currentUserSubject.complete();
    this.isAuthenticatedSubject.complete();
    
    console.log('🗑️ Service AuthService détruit, nettoyage effectué');
  }
}