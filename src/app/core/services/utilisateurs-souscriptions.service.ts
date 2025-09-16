import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { UtilisateurWithSouscriptions, UtilisateursSouscriptionsApiResponse, SouscriptionWithPlans } from '../models/utilisateur';
import { environment } from '@/environment';

@Injectable({
  providedIn: 'root'
})
export class UtilisateursSouscriptionsService {
  private readonly API_BASE_URL = environment.apiUrl;
  private readonly UTILISATEURS_SOUSCRIPTIONS_ENDPOINT = `${this.API_BASE_URL}/utilisateurs-souscriptions`;

  // BehaviorSubject pour maintenir l'état des données
  private utilisateursSouscriptionsSubject = new BehaviorSubject<UtilisateurWithSouscriptions[]>([]);
  public utilisateursSouscriptions$ = this.utilisateursSouscriptionsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des utilisateurs avec leurs souscriptions avec pagination
   * @param page Numéro de page (défaut: 1)
   * @param perPage Nombre d'éléments par page (défaut: 15)
   */
  getUtilisateursSouscriptions(
    page: number = 1, 
    perPage: number = 15
  ): Observable<UtilisateursSouscriptionsApiResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<UtilisateursSouscriptionsApiResponse>(this.UTILISATEURS_SOUSCRIPTIONS_ENDPOINT, { params })
      .pipe(
        map(response => {
          this.utilisateursSouscriptionsSubject.next(response.data);
          this.loadingSubject.next(false);
          return response;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors du chargement des utilisateurs avec souscriptions:', error);
          return throwError(() => new Error('Erreur lors du chargement des utilisateurs avec souscriptions'));
        })
      );
  }

  /**
   * Récupère tous les utilisateurs avec souscriptions (sans pagination)
   */
  getAllUtilisateursSouscriptions(): Observable<UtilisateurWithSouscriptions[]> {
    return this.getUtilisateursSouscriptions(1, 1000).pipe(
      map(response => response.data)
    );
  }

  /**
   * Récupère un utilisateur spécifique avec ses souscriptions par son ID
   * @param id ID de l'utilisateur
   */
  getUtilisateurSouscriptionsById(id: number): Observable<UtilisateurWithSouscriptions> {
    return this.http.get<{data: UtilisateurWithSouscriptions}>(`${this.UTILISATEURS_SOUSCRIPTIONS_ENDPOINT}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Erreur lors du chargement de l\'utilisateur avec souscriptions:', error);
          return throwError(() => new Error('Utilisateur non trouvé'));
        })
      );
  }

  /**
   * Récupère les souscriptions d'un utilisateur spécifique
   * @param utilisateurId ID de l'utilisateur
   */
  getSouscriptionsByUtilisateur(utilisateurId: number): Observable<SouscriptionWithPlans[]> {
    return this.getAllUtilisateursSouscriptions().pipe(
      map(utilisateurs => {
        const utilisateur = utilisateurs.find(u => u.id_utilisateur === utilisateurId);
        return utilisateur ? utilisateur.souscriptions : [];
      })
    );
  }

  /**
   * Formate le nom complet d'un utilisateur
   */
  getFullName(utilisateur: UtilisateurWithSouscriptions): string {
    return `${utilisateur.prenom} ${utilisateur.nom}`;
  }

  /**
   * Formate l'affichage d'une souscription
   */
  formatSouscription(souscription: SouscriptionWithPlans): string {
    return `#${souscription.id_souscription} - ${souscription.nombre_terrains} terrain(s) - ${this.formatCurrency(souscription.montant_mensuel)}/mois`;
  }

  /**
   * Formate une valeur monétaire
   */
  private formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(numAmount);
  }

  /**
   * Réinitialise le state du service
   */
  resetState(): void {
    this.utilisateursSouscriptionsSubject.next([]);
    this.loadingSubject.next(false);
  }
}