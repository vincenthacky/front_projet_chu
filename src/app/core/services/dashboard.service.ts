import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '@/environment';

// Interfaces pour les réponses API du dashboard
export interface DashboardStats {
  totalSouscriptions: number;
  souscriptionsActives: number;
  totalPaiements: number;
  paiementsEnRetard: number;
  totalReclamations: number;
  reclamationsEnCours: number;
  totalEvenements: number;
  evenementsEnCours: number;
  montantTotalCollecte: number;
  montantRestant: number;
}

export interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  tension?: number;
  fill?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  year?: number;
  total?: number;
  counts?: {
    [key: string]: number;
  };
}

export interface Activity {
  type: string;
  message: string;
  time: string;
  status: string;
}

export interface Alerte {
  type: string;
  message: string;
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  status_code: number;
  message: string;
  data: T;
}

export interface DashboardCompleteData {
  stats: DashboardStats;
  paiementsChart: ChartData;
  souscriptionsChart: ChartData;
  evenementsChart: ChartData;
  reclamationsChart: ChartData;
  recentActivities: Activity[];
  alertes: Alerte[];
  year: number;
  generated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
   private API_BASE_URL = `${environment.apiUrl}/dashboard`;
  //private readonly API_BASE_URL = 'http://192.168.252.75:8000/api/dashboard';

  // BehaviorSubjects pour maintenir l'état des données
  private statsSubject = new BehaviorSubject<DashboardStats | null>(null);
  public stats$ = this.statsSubject.asObservable();

  private paiementsChartSubject = new BehaviorSubject<ChartData | null>(null);
  public paiementsChart$ = this.paiementsChartSubject.asObservable();

  private souscriptionsChartSubject = new BehaviorSubject<ChartData | null>(null);
  public souscriptionsChart$ = this.souscriptionsChartSubject.asObservable();

  private evenementsChartSubject = new BehaviorSubject<ChartData | null>(null);
  public evenementsChart$ = this.evenementsChartSubject.asObservable();

  private reclamationsChartSubject = new BehaviorSubject<ChartData | null>(null);
  public reclamationsChart$ = this.reclamationsChartSubject.asObservable();

  private recentActivitiesSubject = new BehaviorSubject<Activity[]>([]);
  public recentActivities$ = this.recentActivitiesSubject.asObservable();

  private alertesSubject = new BehaviorSubject<Alerte[]>([]);
  public alertes$ = this.alertesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques générales du dashboard
   */
  getStats(): Observable<DashboardStats> {
    this.loadingSubject.next(true);

    return this.http.get<ApiResponse<DashboardStats>>(`${this.API_BASE_URL}/stats`)
      .pipe(
        map(response => {
          this.statsSubject.next(response.data);
          this.loadingSubject.next(false);
          return response.data;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors du chargement des statistiques:', error);
          return throwError(() => new Error('Erreur lors du chargement des statistiques'));
        })
      );
  }

  /**
   * Récupère les données pour le graphique des paiements
   * @param year Année pour filtrer les données (optionnel)
   */
  getPaiementsChart(year?: number): Observable<ChartData> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<ApiResponse<ChartData>>(`${this.API_BASE_URL}/paiements-chart`, { params })
      .pipe(
        map(response => {
          this.paiementsChartSubject.next(response.data);
          return response.data;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement du graphique des paiements:', error);
          return throwError(() => new Error('Erreur lors du chargement du graphique des paiements'));
        })
      );
  }

  /**
   * Récupère les données pour le graphique des souscriptions
   * @param year Année pour filtrer les données (optionnel)
   */
  getSouscriptionsChart(year?: number): Observable<ChartData> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<ApiResponse<ChartData>>(`${this.API_BASE_URL}/souscriptions-chart`, { params })
      .pipe(
        map(response => {
          this.souscriptionsChartSubject.next(response.data);
          return response.data;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement du graphique des souscriptions:', error);
          return throwError(() => new Error('Erreur lors du chargement du graphique des souscriptions'));
        })
      );
  }

  /**
   * Récupère les données pour le graphique des événements
   * @param year Année pour filtrer les données (optionnel)
   */
  getEvenementsChart(year?: number): Observable<ChartData> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<ApiResponse<ChartData>>(`${this.API_BASE_URL}/evenements-chart`, { params })
      .pipe(
        map(response => {
          this.evenementsChartSubject.next(response.data);
          return response.data;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement du graphique des événements:', error);
          return throwError(() => new Error('Erreur lors du chargement du graphique des événements'));
        })
      );
  }

  /**
   * Récupère les données pour le graphique des réclamations
   * @param year Année pour filtrer les données (optionnel)
   */
  getReclamationsChart(year?: number): Observable<ChartData> {
    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<ApiResponse<ChartData>>(`${this.API_BASE_URL}/reclamations-chart`, { params })
      .pipe(
        map(response => {
          this.reclamationsChartSubject.next(response.data);
          return response.data;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement du graphique des réclamations:', error);
          return throwError(() => new Error('Erreur lors du chargement du graphique des réclamations'));
        })
      );
  }

  /**
   * Récupère les activités récentes
   * @param limit Nombre d'activités à récupérer (optionnel)
   */
  getRecentActivities(limit?: number): Observable<Activity[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<ApiResponse<Activity[]>>(`${this.API_BASE_URL}/recent-activities`, { params })
      .pipe(
        map(response => {
          this.recentActivitiesSubject.next(response.data);
          return response.data;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des activités récentes:', error);
          return throwError(() => new Error('Erreur lors du chargement des activités récentes'));
        })
      );
  }

  /**
   * Récupère les alertes importantes
   */
  getAlertes(): Observable<Alerte[]> {
    return this.http.get<ApiResponse<Alerte[]>>(`${this.API_BASE_URL}/alertes`)
      .pipe(
        map(response => {
          this.alertesSubject.next(response.data);
          return response.data;
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des alertes:', error);
          return throwError(() => new Error('Erreur lors du chargement des alertes'));
        })
      );
  }

  /**
   * Récupère toutes les données du dashboard en une seule requête
   * @param year Année pour filtrer les données (optionnel)
   */
  getDashboardComplete(year?: number): Observable<DashboardCompleteData> {
    this.loadingSubject.next(true);

    let params = new HttpParams();
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<ApiResponse<DashboardCompleteData>>(`${this.API_BASE_URL}/complete`, { params })
      .pipe(
        map(response => {
          // Mettre à jour tous les subjects avec les données reçues
          this.statsSubject.next(response.data.stats);
          this.paiementsChartSubject.next(response.data.paiementsChart);
          this.souscriptionsChartSubject.next(response.data.souscriptionsChart);
          this.evenementsChartSubject.next(response.data.evenementsChart);
          this.reclamationsChartSubject.next(response.data.reclamationsChart);
          this.recentActivitiesSubject.next(response.data.recentActivities);
          this.alertesSubject.next(response.data.alertes);
          this.loadingSubject.next(false);
          return response.data;
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error('Erreur lors du chargement complet du dashboard:', error);
          return throwError(() => new Error('Erreur lors du chargement complet du dashboard'));
        })
      );
  }

  /**
   * Formate une valeur monétaire
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  }

  /**
   * Obtient la couleur selon le statut
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8'
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Réinitialise le state du service
   */
  resetState(): void {
    this.statsSubject.next(null);
    this.paiementsChartSubject.next(null);
    this.souscriptionsChartSubject.next(null);
    this.evenementsChartSubject.next(null);
    this.reclamationsChartSubject.next(null);
    this.recentActivitiesSubject.next([]);
    this.alertesSubject.next([]);
    this.loadingSubject.next(false);
  }

  /**
   * Actualise toutes les données du dashboard
   */
  refreshDashboard(year?: number): Observable<DashboardCompleteData> {
    return this.getDashboardComplete(year);
  }
}