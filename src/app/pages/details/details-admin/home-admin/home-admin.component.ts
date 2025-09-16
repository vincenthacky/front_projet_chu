import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { registerables } from 'chart.js';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// Import du service dashboard
import { 
  DashboardService, 
  DashboardStats, 
  ChartData, 
  Activity, 
  Alerte 
} from 'src/app/core/services/dashboard.service';

Chart.register(...registerables);

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.css']
})
export class HomeAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('paiementsChart') paiementsChartRef!: ElementRef;
  @ViewChild('souscriptionsChart') souscriptionsChartRef!: ElementRef;
  @ViewChild('evenementsChart') evenementsChartRef!: ElementRef;
  @ViewChild('reclamationsChart') reclamationsChartRef!: ElementRef;

  private destroy$ = new Subject<void>();

  // Statistiques générales
  stats: DashboardStats = {
    totalSouscriptions: 0,
    souscriptionsActives: 0,
    totalPaiements: 0,
    paiementsEnRetard: 0,
    totalReclamations: 0,
    reclamationsEnCours: 0,
    totalEvenements: 0,
    evenementsEnCours: 0,
    montantTotalCollecte: 0,
    montantRestant: 0
  };

  // Données pour les graphiques
  paiementsChart!: Chart;
  souscriptionsChart!: Chart;
  evenementsChart!: Chart;
  reclamationsChart!: Chart;

  // Données des graphiques
  paiementsChartData: ChartData | null = null;
  souscriptionsChartData: ChartData | null = null;
  evenementsChartData: ChartData | null = null;
  reclamationsChartData: ChartData | null = null;

  // Activités récentes
  recentActivities: Activity[] = [];

  // Alertes importantes
  alertes: Alerte[] = [];

  // État de chargement
  loading = false;

  // Année sélectionnée pour les graphiques
  selectedYear = new Date().getFullYear();

  constructor(
    private router: Router,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.subscribeToData();
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Les graphiques seront initialisés quand les données seront disponibles
    setTimeout(() => {
      this.initChartsIfDataAvailable();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Détruire les graphiques
    this.destroyCharts();
  }

  /**
   * S'abonner aux observables du service
   */
  subscribeToData() {
    // Statistiques
    this.dashboardService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        if (stats) {
          this.stats = stats;
        }
      });

    // Données des graphiques
    this.dashboardService.paiementsChart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.paiementsChartData = data;
        this.updatePaiementsChart();
      });

    this.dashboardService.souscriptionsChart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.souscriptionsChartData = data;
        this.updateSouscriptionsChart();
      });

    this.dashboardService.evenementsChart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.evenementsChartData = data;
        this.updateEvenementsChart();
      });

    this.dashboardService.reclamationsChart$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.reclamationsChartData = data;
        this.updateReclamationsChart();
      });

    // Activités récentes
    this.dashboardService.recentActivities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(activities => {
        this.recentActivities = activities;
      });

    // Alertes
    this.dashboardService.alertes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alertes => {
        this.alertes = alertes;
      });

    // État de chargement
    this.dashboardService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });
  }

  /**
   * Charge toutes les données du dashboard
   */
  loadDashboardData() {
    this.dashboardService.getDashboardComplete(this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('Dashboard data loaded successfully', data);
          // Les données sont automatiquement mises à jour via les observables
          setTimeout(() => {
            this.initChartsIfDataAvailable();
          }, 100);
        },
        error: (error) => {
          console.error('Erreur lors du chargement du dashboard:', error);
          // Charger les données par méthodes individuelles en cas d'échec
          this.loadDataIndividually();
        }
      });
  }

  /**
   * Charge les données individuellement si le endpoint complet échoue
   */
  loadDataIndividually() {
    const requests = [
      this.dashboardService.getStats(),
      this.dashboardService.getPaiementsChart(this.selectedYear),
      this.dashboardService.getSouscriptionsChart(this.selectedYear),
      this.dashboardService.getEvenementsChart(this.selectedYear),
      this.dashboardService.getReclamationsChart(this.selectedYear),
      this.dashboardService.getRecentActivities(10),
      this.dashboardService.getAlertes()
    ];

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Toutes les données individuelles chargées');
          setTimeout(() => {
            this.initChartsIfDataAvailable();
          }, 100);
        },
        error: (error) => {
          console.error('Erreur lors du chargement individuel:', error);
        }
      });
  }

  /**
   * Initialise les graphiques si les données sont disponibles
   */
  initChartsIfDataAvailable() {
    if (this.paiementsChartData && this.paiementsChartRef) {
      this.initPaiementsChart();
    }
    if (this.souscriptionsChartData && this.souscriptionsChartRef) {
      this.initSouscriptionsChart();
    }
    if (this.evenementsChartData && this.evenementsChartRef) {
      this.initEvenementsChart();
    }
    if (this.reclamationsChartData && this.reclamationsChartRef) {
      this.initReclamationsChart();
    }
  }

  /**
   * Initialise le graphique des paiements
   */
  initPaiementsChart() {
    if (!this.paiementsChartData || !this.paiementsChartRef) return;

    const ctx = this.paiementsChartRef.nativeElement.getContext('2d');
    
    if (this.paiementsChart) {
      this.paiementsChart.destroy();
    }

    this.paiementsChart = new Chart(ctx, {
      type: 'doughnut' as ChartType,
      data: {
        labels: this.paiementsChartData.labels,
        datasets: this.paiementsChartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'État des Paiements'
          }
        }
      }
    });
  }

  /**
   * Initialise le graphique des souscriptions
   */
  initSouscriptionsChart() {
    if (!this.souscriptionsChartData || !this.souscriptionsChartRef) return;

    const ctx = this.souscriptionsChartRef.nativeElement.getContext('2d');
    
    if (this.souscriptionsChart) {
      this.souscriptionsChart.destroy();
    }

    this.souscriptionsChart = new Chart(ctx, {
      type: 'bar' as ChartType,
      data: {
        labels: this.souscriptionsChartData.labels,
        datasets: this.souscriptionsChartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Évolution des Souscriptions'
          }
        }
      }
    });
  }

  /**
   * Initialise le graphique des événements
   */
  initEvenementsChart() {
    if (!this.evenementsChartData || !this.evenementsChartRef) return;

    const ctx = this.evenementsChartRef.nativeElement.getContext('2d');
    
    if (this.evenementsChart) {
      this.evenementsChart.destroy();
    }

    this.evenementsChart = new Chart(ctx, {
      type: 'line' as ChartType,
      data: {
        labels: this.evenementsChartData.labels,
        datasets: this.evenementsChartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Progression des Événements'
          }
        }
      }
    });
  }

  /**
   * Initialise le graphique des réclamations
   */
  initReclamationsChart() {
    if (!this.reclamationsChartData || !this.reclamationsChartRef) return;

    const ctx = this.reclamationsChartRef.nativeElement.getContext('2d');
    
    if (this.reclamationsChart) {
      this.reclamationsChart.destroy();
    }

    this.reclamationsChart = new Chart(ctx, {
      type: 'pie' as ChartType,
      data: {
        labels: this.reclamationsChartData.labels,
        datasets: this.reclamationsChartData.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Statut des Réclamations'
          }
        }
      }
    });
  }

  /**
   * Met à jour le graphique des paiements
   */
  updatePaiementsChart() {
    if (this.paiementsChart && this.paiementsChartData) {
      this.paiementsChart.data.labels = this.paiementsChartData.labels;
      this.paiementsChart.data.datasets = this.paiementsChartData.datasets;
      this.paiementsChart.update();
    } else if (this.paiementsChartData && this.paiementsChartRef) {
      this.initPaiementsChart();
    }
  }

  /**
   * Met à jour le graphique des souscriptions
   */
  updateSouscriptionsChart() {
    if (this.souscriptionsChart && this.souscriptionsChartData) {
      this.souscriptionsChart.data.labels = this.souscriptionsChartData.labels;
      this.souscriptionsChart.data.datasets = this.souscriptionsChartData.datasets;
      this.souscriptionsChart.update();
    } else if (this.souscriptionsChartData && this.souscriptionsChartRef) {
      this.initSouscriptionsChart();
    }
  }

  /**
   * Met à jour le graphique des événements
   */
  updateEvenementsChart() {
    if (this.evenementsChart && this.evenementsChartData) {
      this.evenementsChart.data.labels = this.evenementsChartData.labels;
      this.evenementsChart.data.datasets = this.evenementsChartData.datasets;
      this.evenementsChart.update();
    } else if (this.evenementsChartData && this.evenementsChartRef) {
      this.initEvenementsChart();
    }
  }

  /**
   * Met à jour le graphique des réclamations
   */
  updateReclamationsChart() {
    if (this.reclamationsChart && this.reclamationsChartData) {
      this.reclamationsChart.data.labels = this.reclamationsChartData.labels;
      this.reclamationsChart.data.datasets = this.reclamationsChartData.datasets;
      this.reclamationsChart.update();
    } else if (this.reclamationsChartData && this.reclamationsChartRef) {
      this.initReclamationsChart();
    }
  }

  /**
   * Détruit tous les graphiques
   */
  destroyCharts() {
    if (this.paiementsChart) {
      this.paiementsChart.destroy();
    }
    if (this.souscriptionsChart) {
      this.souscriptionsChart.destroy();
    }
    if (this.evenementsChart) {
      this.evenementsChart.destroy();
    }
    if (this.reclamationsChart) {
      this.reclamationsChart.destroy();
    }
  }

  /**
   * Formate une valeur monétaire
   */
  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  /**
   * Obtient la couleur selon le statut
   */
  getStatusColor(status: string): string {
    return this.dashboardService.getStatusColor(status);
  }

  /**
   * Actualise le dashboard
   */
  refreshDashboard() {
    this.loadDashboardData();
  }

  /**
   * Change l'année et recharge les données
   */
  changeYear(year: number) {
    this.selectedYear = year;
    this.loadDashboardData();
  }

  // Méthodes de navigation
  goToNewPayements() {
    this.router.navigate(['/dashboard/admin/details/new-payment-admin']);
  }

  goToNewEvents() {
    this.router.navigate(['/dashboard/admin/details/new-event-admin']);
  }

  goToDocuments() {
    this.router.navigate(['/dashboard/admin/details/new-document-admin']);
  }

  goToNewReclamations() {
    this.router.navigate(['/dashboard/admin/details/complaints-admin']);
  }

  goToNewUser() {
    this.router.navigate(['/dashboard/admin/details/new-user-admin']);
  }
}