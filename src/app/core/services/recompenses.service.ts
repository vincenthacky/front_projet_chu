import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Interfaces
export interface TypeRecompense {
  id_type_recompense: number;
  libelle_type_recompense: string;
  description_type: string;
  valeur_monetaire: string;
  est_monetaire: boolean;
  conditions_attribution: string;
  created_at: string;
  updated_at: string;
}

export interface Utilisateur {
  id_utilisateur: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  type: string;
  service: string;
  date_inscription: string;
  derniere_connexion: string;
  est_administrateur: boolean;
  statut_utilisateur: string;
  created_at: string;
  updated_at: string;
}

export interface Souscription {
  id_souscription: number;
  id_utilisateur: number;
  id_terrain: number;
  id_admin: number;
  date_souscription: string;
  nombre_terrains: number;
  montant_mensuel: string;
  nombre_mensualites: number;
  montant_total_souscrit: string;
  date_debut_paiement: string;
  date_fin_prevue: string;
  statut_souscription: string;
  groupe_souscription: string;
  notes_admin: string;
  created_at: string;
  updated_at: string;
  utilisateur: Utilisateur;
}

export interface Recompense {
  id_recompense: number;
  id_souscription: number;
  id_type_recompense: number;
  description: string;
  motif_recompense: string;
  periode_merite: string;
  valeur_recompense: string;
  statut_recompense: 'due' | 'payee' | 'en_attente';
  date_attribution: string;
  date_attribution_effective: string | null;
  commentaire_admin: string;
  created_at: string;
  updated_at: string;
  souscription: Souscription;
  type_recompense: TypeRecompense;
}

export interface ApiPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

export interface RecompensesApiResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Recompense[];
  pagination: ApiPagination;
}

export interface RecompensesFilter {
  statut?: string;
  type_recompense?: number;
  utilisateur?: number;
  periode?: string;
  date_debut?: string;
  date_fin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecompensesService {
  private readonly API_BASE_URL = 'http://192.168.252.75:8000/api'; // À remplacer par votre URL d'API
  private readonly RECOMPENSES_ENDPOINT = `${this.API_BASE_URL}/recompenses`;

  // BehaviorSubject pour maintenir l'état des données
  private recompensesSubject = new BehaviorSubject<Recompense[]>([]);
  public recompenses$ = this.recompensesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private paginationSubject = new BehaviorSubject<ApiPagination | null>(null);
  public pagination$ = this.paginationSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des récompenses avec pagination
   * @param page Numéro de page (défaut: 1)
   * @param perPage Nombre d'éléments par page (défaut: 15)
   * @param filters Filtres optionnels
   */
  getRecompenses(
    page: number = 1, 
    perPage: number = 15, 
    filters?: RecompensesFilter
  ): Observable<RecompensesApiResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    // Ajouter les filtres s'ils existent
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<RecompensesApiResponse>(this.RECOMPENSES_ENDPOINT, { params })
      .pipe(
        map(response => {
          this.recompensesSubject.next(response.data);
          this.paginationSubject.next(response.pagination);
          this.loadingSubject.next(false);
          return response;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors du chargement des récompenses:', error);
          return throwError(() => new Error('Erreur lors du chargement des récompenses'));
        })
      );
  }

  /**
   * Récupère une récompense spécifique par son ID
   * @param id ID de la récompense
   */
  getRecompenseById(id: number): Observable<Recompense> {
    return this.http.get<{data: Recompense}>(`${this.RECOMPENSES_ENDPOINT}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Erreur lors du chargement de la récompense:', error);
          return throwError(() => new Error('Récompense non trouvée'));
        })
      );
  }

  /**
   * Crée une nouvelle récompense
   * @param recompense Données de la récompense à créer
   */
  createRecompense(recompense: Partial<Recompense>): Observable<Recompense> {
    this.loadingSubject.next(true);

    return this.http.post<{data: Recompense}>(this.RECOMPENSES_ENDPOINT, recompense)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response.data;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors de la création de la récompense:', error);
          return throwError(() => new Error('Erreur lors de la création de la récompense'));
        })
      );
  }

  /**
   * Met à jour une récompense existante
   * @param id ID de la récompense
   * @param recompense Données mises à jour
   */
  updateRecompense(id: number, recompense: Partial<Recompense>): Observable<Recompense> {
    this.loadingSubject.next(true);

    return this.http.put<{data: Recompense}>(`${this.RECOMPENSES_ENDPOINT}/${id}`, recompense)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response.data;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors de la mise à jour de la récompense:', error);
          return throwError(() => new Error('Erreur lors de la mise à jour de la récompense'));
        })
      );
  }

  /**
   * Supprime une récompense
   * @param id ID de la récompense à supprimer
   */
  deleteRecompense(id: number): Observable<boolean> {
    this.loadingSubject.next(true);

    return this.http.delete<{success: boolean}>(`${this.RECOMPENSES_ENDPOINT}/${id}`)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response.success;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors de la suppression de la récompense:', error);
          return throwError(() => new Error('Erreur lors de la suppression de la récompense'));
        })
      );
  }

  /**
   * Met à jour le statut d'une récompense
   * @param id ID de la récompense
   * @param statut Nouveau statut
   */
  updateStatutRecompense(id: number, statut: 'due' | 'payee' | 'en_attente'): Observable<Recompense> {
    return this.updateRecompense(id, { statut_recompense: statut });
  }

  /**
   * Récupère les statistiques des récompenses
   */
  getRecompensesStats(): Observable<any> {
    return this.http.get<any>(`${this.RECOMPENSES_ENDPOINT}/stats`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des statistiques:', error);
          return throwError(() => new Error('Erreur lors du chargement des statistiques'));
        })
      );
  }

  /**
   * Récupère les types de récompenses disponibles
   */
  getTypesRecompenses(): Observable<TypeRecompense[]> {
    return this.http.get<{data: TypeRecompense[]}>(`${this.API_BASE_URL}/types-recompenses`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Erreur lors du chargement des types de récompenses:', error);
          return throwError(() => new Error('Erreur lors du chargement des types de récompenses'));
        })
      );
  }

  /**
   * Exporte les récompenses au format CSV
   * @param filters Filtres optionnels pour l'export
   */
  exportRecompenses(filters?: RecompensesFilter): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.RECOMPENSES_ENDPOINT}/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'export des récompenses:', error);
        return throwError(() => new Error('Erreur lors de l\'export des récompenses'));
      })
    );
  }

  /**
   * Traitement en lot des récompenses
   * @param ids Liste des IDs des récompenses
   * @param action Action à effectuer ('approve', 'reject', 'pay')
   */
  bulkAction(ids: number[], action: 'approve' | 'reject' | 'pay'): Observable<boolean> {
    this.loadingSubject.next(true);

    const payload = { ids, action };

    return this.http.post<{success: boolean}>(`${this.RECOMPENSES_ENDPOINT}/bulk-action`, payload)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response.success;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors de l\'action en lot:', error);
          return throwError(() => new Error('Erreur lors de l\'action en lot'));
        })
      );
  }

  /**
   * Méthodes utilitaires pour le formatage
   */
  formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(numAmount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  getStatusLabel(status: string): string {
    const labels: {[key: string]: string} = {
      'due': 'Due',
      'payee': 'Payée',
      'en_attente': 'En attente'
    };
    return labels[status] || status;
  }

  /**
   * Réinitialise le state du service
   */
  resetState(): void {
    this.recompensesSubject.next([]);
    this.paginationSubject.next(null);
    this.loadingSubject.next(false);
  }
}