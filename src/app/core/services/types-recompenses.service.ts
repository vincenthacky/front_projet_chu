import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Interface pour les types de récompenses
export interface TypeRecompenseResponse {
  id_type_recompense: number;
  libelle_type_recompense: string;
  description_type: string;
  valeur_monetaire: string | null;
  est_monetaire: boolean;
  conditions_attribution: string;
  created_at: string;
  updated_at: string;
}

export interface TypesRecompensesApiResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: TypeRecompenseResponse[];
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
export class TypesRecompensesService {
  private readonly API_BASE_URL = 'http://192.168.252.75:8000/api';
  private readonly TYPES_RECOMPENSES_ENDPOINT = `${this.API_BASE_URL}/type-recompenses`;

  // BehaviorSubject pour maintenir l'état des données
  private typesRecompensesSubject = new BehaviorSubject<TypeRecompenseResponse[]>([]);
  public typesRecompenses$ = this.typesRecompensesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des types de récompenses avec pagination
   * @param page Numéro de page (défaut: 1)
   * @param perPage Nombre d'éléments par page (défaut: 15)
   */
  getTypesRecompenses(
    page: number = 1, 
    perPage: number = 15
  ): Observable<TypesRecompensesApiResponse> {
    this.loadingSubject.next(true);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<TypesRecompensesApiResponse>(this.TYPES_RECOMPENSES_ENDPOINT, { params })
      .pipe(
        map(response => {
          this.typesRecompensesSubject.next(response.data);
          this.loadingSubject.next(false);
          return response;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors du chargement des types de récompenses:', error);
          return throwError(() => new Error('Erreur lors du chargement des types de récompenses'));
        })
      );
  }

  /**
   * Récupère tous les types de récompenses (sans pagination)
   */
  getAllTypesRecompenses(): Observable<TypeRecompenseResponse[]> {
    return this.getTypesRecompenses(1, 1000).pipe(
      map(response => response.data)
    );
  }

  /**
   * Récupère un type de récompense spécifique par son ID
   * @param id ID du type de récompense
   */
  getTypeRecompenseById(id: number): Observable<TypeRecompenseResponse> {
    return this.http.get<{data: TypeRecompenseResponse}>(`${this.TYPES_RECOMPENSES_ENDPOINT}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Erreur lors du chargement du type de récompense:', error);
          return throwError(() => new Error('Type de récompense non trouvé'));
        })
      );
  }

  /**
   * Réinitialise le state du service
   */
  resetState(): void {
    this.typesRecompensesSubject.next([]);
    this.loadingSubject.next(false);
  }
}