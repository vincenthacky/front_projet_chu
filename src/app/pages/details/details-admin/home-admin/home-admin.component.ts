import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { registerables } from 'chart.js';
import { Router, RouterModule } from '@angular/router';

Chart.register(...registerables);

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [CommonModule,RouterModule],
  templateUrl: './home-admin.component.html',
  styleUrls: ['./home-admin.component.css']
})
export class HomeAdminComponent implements OnInit, AfterViewInit {
  @ViewChild('paiementsChart') paiementsChartRef!: ElementRef;
  @ViewChild('souscriptionsChart') souscriptionsChartRef!: ElementRef;
  @ViewChild('evenementsChart') evenementsChartRef!: ElementRef;
  @ViewChild('reclamationsChart') reclamationsChartRef!: ElementRef;

  constructor(private router: Router) {}
  // Statistiques générales
  stats = {
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

  // Données récentes
  recentActivities = [
    {
      type: 'paiement',
      message: 'Nouveau paiement reçu de M. KOUASSI Jean',
      time: 'Il y a 2 heures',
      status: 'success'
    },
    {
      type: 'reclamation',
      message: 'Réclamation de Mme TRAORE Fatou',
      time: 'Il y a 4 heures',
      status: 'warning'
    },
    {
      type: 'evenement',
      message: 'Nouvel événement: Bornage des terrains',
      time: 'Il y a 1 jour',
      status: 'info'
    },
    {
      type: 'souscription',
      message: 'Nouvelle souscription de M. YAO Kouassi',
      time: 'Il y a 2 jours',
      status: 'success'
    }
  ];

  // Alertes importantes
  alertes = [
    {
      type: 'danger',
      message: '15 paiements en retard nécessitent une attention',
      count: 15
    },
    {
      type: 'warning',
      message: '8 réclamations en attente de traitement',
      count: 8
    },
    {
      type: 'info',
      message: '3 événements prévus cette semaine',
      count: 3
    }
  ];

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  loadStats() {
    // Simulation des données basées sur la base de données
    this.stats = {
      totalSouscriptions: 156,
      souscriptionsActives: 142,
      totalPaiements: 2847,
      paiementsEnRetard: 15,
      totalReclamations: 23,
      reclamationsEnCours: 8,
      totalEvenements: 12,
      evenementsEnCours: 3,
      montantTotalCollecte: 183456000,
      montantRestant: 456789000
    };
  }

  initCharts() {
    this.initPaiementsChart();
    this.initSouscriptionsChart();
    this.initEvenementsChart();
    this.initReclamationsChart();
  }

  initPaiementsChart() {
    const ctx = this.paiementsChartRef.nativeElement.getContext('2d');
    this.paiementsChart = new Chart(ctx, {
      type: 'doughnut' as ChartType,
      data: {
        labels: ['Payés à temps', 'Payés en retard', 'En attente', 'Non payés'],
        datasets: [{
          data: [85, 5, 8, 2],
          backgroundColor: [
            '#28a745',
            '#ffc107',
            '#17a2b8',
            '#dc3545'
          ],
          borderWidth: 2
        }]
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

  initSouscriptionsChart() {
    const ctx = this.souscriptionsChartRef.nativeElement.getContext('2d');
    this.souscriptionsChart = new Chart(ctx, {
      type: 'bar' as ChartType,
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [{
          label: 'Nouvelles souscriptions',
          data: [12, 19, 15, 25, 22, 18],
          backgroundColor: '#007bff',
          borderColor: '#0056b3',
          borderWidth: 1
        }]
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

  initEvenementsChart() {
    const ctx = this.evenementsChartRef.nativeElement.getContext('2d');
    this.evenementsChart = new Chart(ctx, {
      type: 'line' as ChartType,
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [{
          label: 'Événements réalisés',
          data: [2, 3, 1, 4, 2, 3],
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4
        }]
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

  initReclamationsChart() {
    const ctx = this.reclamationsChartRef.nativeElement.getContext('2d');
    this.reclamationsChart = new Chart(ctx, {
      type: 'pie' as ChartType,
      data: {
        labels: ['Résolues', 'En cours', 'En attente', 'Rejetées'],
        datasets: [{
          data: [12, 8, 3, 0],
          backgroundColor: [
            '#28a745',
            '#ffc107',
            '#17a2b8',
            '#dc3545'
          ],
          borderWidth: 2
        }]
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8'
    };
    return colors[status] || '#6c757d';
  }

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