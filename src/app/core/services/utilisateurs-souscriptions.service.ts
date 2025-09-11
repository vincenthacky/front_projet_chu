import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Interfaces pour les utilisateurs avec souscriptions
export interface PlanPaiement {
  id_plan_paiement: number;
  id_souscription: number;
  numero_mensualite: number;
  montant_versement_prevu: string;
  date_limite_versement: string;
  date_paiement_effectif: string | null;
  montant_paye: string;
  mode_paiement: string;
  reference_paiement: string | null;
  est_paye: boolean;
  penalite_appliquee: string;
  statut_versement: string;
  commentaire_paiement: string | null;
  date_saisie: string | null;
  created_at: string;
  updated_at: string;
}

export interface SouscriptionWithPlans {
  id_souscription: number;
  id_utilisateur: number;
  id_terrain: number;
  id_admin: number;
  origine: string;
  date_souscription: string;
  nombre_terrains: number;
  montant_mensuel: string;
  nombre_mensualites: number;
  montant_total_souscrit: string;
  date_debut_paiement: string;
  date_fin_prevue: string;
  statut_souscription: string;
  groupe_souscription: string | null;
  notes_admin: string | null;
  created_at: string;
  updated_at: string;
  planpaiements: PlanPaiement[];
}

export interface UtilisateurWithSouscriptions {
  id_utilisateur: number;
  matricule: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  type: string;
  service: string;
  date_inscription: string;
  derniere_connexion: string | null;
  est_administrateur: boolean;
  statut_utilisateur: string;
  created_at: string;
  updated_at: string;
  souscriptions: SouscriptionWithPlans[];
}

export interface UtilisateursSouscriptionsApiResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: UtilisateurWithSouscriptions[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UtilisateursSouscriptionsService {
  private readonly API_BASE_URL = 'http://192.168.252.75:8000/api';
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