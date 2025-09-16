import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Recompense, ApiPagination, RecompensesFilter, RecompensesApiResponse, TypeRecompense } from '../models/recompenses';
import { environment } from '@/environment';


@Injectable({
  providedIn: 'root'
})
export class RecompensesService {
  private readonly API_BASE_URL = environment.apiUrl;
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
   * Récupère les récompenses de l'utilisateur connecté
   * @param page Numéro de page (défaut: 1)
   * @param perPage Nombre d'éléments par page (défaut: 15)
   * @param filters Filtres optionnels
   */
  getUserRecompenses(
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

    return this.http.get<RecompensesApiResponse>(`${this.RECOMPENSES_ENDPOINT}/utilisateur`, { params })
      .pipe(
        map(response => {
          this.recompensesSubject.next(response.data);
          this.paginationSubject.next(response.pagination);
          this.loadingSubject.next(false);
          return response;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors du chargement des récompenses utilisateur:', error);
          return throwError(() => new Error('Erreur lors du chargement des récompenses'));
        })
      );
  }

  /**
   * Récupère la liste de toutes les récompenses (pour admin) avec pagination
   * @param page Numéro de page (défaut: 1)
   * @param perPage Nombre d'éléments par page (défaut: 15)
   * @param filters Filtres optionnels
   */
  getAllRecompenses(
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
   * Méthode de compatibilité - utilise getUserRecompenses par défaut
   * Vous devrez passer l'ID utilisateur depuis votre composant
   */
  getRecompenses(
    page: number = 1, 
    perPage: number = 15, 
    filters?: RecompensesFilter,
    userId?: number
  ): Observable<RecompensesApiResponse> {
    if (userId) {
      // Si un userId est fourni, utiliser l'endpoint utilisateur spécifique
      return this.getUserRecompenses(page, perPage, filters);
    } else {
      // Si pas d'userId fourni, récupérer toutes les récompenses (pour admin)
      return this.getAllRecompenses(page, perPage, filters);
    }
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
  updateStatutRecompense(id: number, statut: 'due' | 'attribuee' | 'annulee'): Observable<Recompense> {
    this.loadingSubject.next(true);

    const payload = { statut_recompense: statut };

    return this.http.patch<{data: Recompense}>(`${this.RECOMPENSES_ENDPOINT}/${id}/statut`, payload)
      .pipe(
        map(response => {
          this.loadingSubject.next(false);
          return response.data;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors de la mise à jour du statut:', error);
          return throwError(() => new Error('Erreur lors de la mise à jour du statut'));
        })
      );
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
      'attribuee': 'Attribuée',
      'annulee': 'Annulée'
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