import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';

interface Payment {
  date: string;
  amount: number;
}

interface Subscription {
  id: string;
  terrain: string;
  surface: string;
  prixTotal: number;
  montantPaye: number;
  resteAPayer: number;
  dateDebut: string;
  prochainPaiement: string;
  statut: 'en-cours' | 'en-retard' | 'termine';
  progression: number;
  payments: Payment[]; // Changé de payments?: à payments: pour s'assurer qu'il existe toujours
}

export interface SubscriptionStats {
  total: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  enCours: number;
  enRetard: number;
  termine: number;
}

export interface FilterOptions {
  search: string;
  status: string;
  terrain: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface SortOptions {
  field: keyof Subscription;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-admin-souscription',
  standalone: true,
  imports: [CommonModule, FormsModule, CommonModule,
    NzLayoutModule,
    NzCardModule,
    NzGridModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzMessageModule,
    NzStatisticModule,
    CommonModule,
    FormsModule,],
  templateUrl: './admin-souscription.component.html',
  styleUrl: './admin-souscription.component.css'
})
export class AdminSouscriptionComponent implements OnInit {

  subscriptions: Subscription[] = [
    {
      id: 'Hien sylvain',
      terrain: 'Terrain 250m²',
      surface: '250',
      prixTotal: 2500000,
      montantPaye: 1250000,
      resteAPayer: 1250000,
      dateDebut: '2024-01-15',
      prochainPaiement: '2024-04-15',
      statut: 'en-cours',
      progression: 50,
      payments: [
        { date: '15/03/2024', amount: 250000 },
        { date: '15/02/2024', amount: 250000 },
        { date: '15/01/2024', amount: 250000 },
        { date: '15/12/2023', amount: 250000 },
        { date: '15/11/2023', amount: 250000 },
      ]
    },
    {
      id: 'Asso le salo',
      terrain: 'Terrain 500m²',
      surface: '500',
      prixTotal: 3000000,
      montantPaye: 1500000,
      resteAPayer: 1500000,
      dateDebut: '2024-02-20',
      prochainPaiement: '2024-05-20',
      statut: 'en-cours',
      progression: 50,
      payments: [
        { date: '20/03/2024', amount: 500000 },
        { date: '20/02/2024', amount: 500000 },
        { date: '20/01/2024', amount: 500000 },
      ]
    },
    {
      id: 'Da sylva ',
      terrain: 'Terrain 250m²',
      surface: '250',
      prixTotal: 1500000,
      montantPaye: 750000,
      resteAPayer: 750000,
      dateDebut: '2024-01-10',
      prochainPaiement: '2024-04-10',
      statut: 'en-retard',
      progression: 25,
      payments: [
        { date: '10/03/2024', amount: 300000 },
        { date: '10/02/2024', amount: 250000 },
        { date: '10/01/2024', amount: 200000 },
      ]
    }
  ];

  filteredSubscriptions: Subscription[] = [];
  
  // Filtres
  searchTerm = '';
  statusFilter = '';
  terrainFilter = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Loading state
  loading = false;

  isVisible = false;
  lastFivePayments: { date: string; amount: number }[] = [];
  selectedSubscription: Subscription | null = null;
  newPaymentDate: string = '';
  newPaymentAmount: number = 0;

  showModal(subscription: Subscription): void {
    this.selectedSubscription = subscription;
    if (subscription.payments && Array.isArray(subscription.payments)) {
      const sorted = [...subscription.payments].sort((a, b) => {
        const [da, ma, ya] = a.date.split('/').map(Number);
        const [db, mb, yb] = b.date.split('/').map(Number);
        const dateA = new Date(ya, ma - 1, da);
        const dateB = new Date(yb, mb - 1, db);
        return dateB.getTime() - dateA.getTime();
      });
      this.lastFivePayments = sorted.slice(0, 5);
    } else {
      this.lastFivePayments = [];
    }
    this.isVisible = true;
  }

  handleOk(): void {
    if (this.selectedSubscription && this.newPaymentDate && this.newPaymentAmount > 0) {
      const [year, month, day] = this.newPaymentDate.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      this.selectedSubscription.payments.push({ date: formattedDate, amount: this.newPaymentAmount });
      this.selectedSubscription.montantPaye += this.newPaymentAmount;
      this.selectedSubscription.resteAPayer -= this.newPaymentAmount;
      this.selectedSubscription.progression = (this.selectedSubscription.montantPaye / this.selectedSubscription.prixTotal) * 100;
      if (this.selectedSubscription.resteAPayer <= 0) {
        this.selectedSubscription.statut = 'termine';
      }
      this.filterData();
    }
    this.isVisible = false;
    this.lastFivePayments = [];
    this.newPaymentDate = '';
    this.newPaymentAmount = 0;
    this.selectedSubscription = null;
  }

  handleCancel(): void {
    this.isVisible = false;
    this.lastFivePayments = [];
    this.newPaymentDate = '';
    this.newPaymentAmount = 0;
    this.selectedSubscription = null;
  }

  constructor(private router: Router, private modal: NzModalService) {}

  trackByFn(index: number, item: Subscription): string {
    return item.id;
  }
  
  // Fonction Math pour le template
  get Math() {
    return Math;
  }

  ngOnInit(): void {
    this.filteredSubscriptions = [...this.subscriptions];
    this.totalItems = this.subscriptions.length;
    this.animateProgressBars();
  }

  // Formatage des montants
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  // Formatage des dates
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  // Obtenir l'icône du statut
  getStatusIcon(status: string): string {
    switch(status) {
      case 'en-cours': return 'fa-clock';
      case 'en-retard': return 'fa-exclamation-triangle';
      case 'termine': return 'fa-check-circle';
      default: return 'fa-clock';
    }
  }

  // Obtenir le label du statut
  getStatusLabel(status: string): string {
    switch(status) {
      case 'en-cours': return 'En cours';
      case 'en-retard': return 'En retard';
      case 'termine': return 'Terminé';
      default: return 'Inconnu';
    }
  }

  // Obtenir la classe CSS du statut
  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  // Obtenir la classe de progression
  getProgressClass(progression: number, status: string): string {
    if (status === 'en-retard') return 'danger';
    if (progression < 50) return 'warning';
    return '';
  }

  // Filtrage des données
  filterData(): void {
    this.filteredSubscriptions = this.subscriptions.filter(sub => {
      const matchesSearch = 
        sub.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sub.terrain.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        sub.prixTotal.toString().includes(this.searchTerm);
      
      const matchesStatus = !this.statusFilter || sub.statut === this.statusFilter;
      const matchesTerrain = !this.terrainFilter || sub.surface === this.terrainFilter;

      return matchesSearch && matchesStatus && matchesTerrain;
    });

    this.totalItems = this.filteredSubscriptions.length;
    this.currentPage = 1; // Reset to first page
  }

  // Gestionnaires d'événements
  onSearchChange(): void {
    this.filterData();
  }

  onStatusFilterChange(): void {
    this.filterData();
  }

  onTerrainFilterChange(): void {
    this.filterData();
  }

  // Actions sur les souscriptions
  viewSubscription(subscription: Subscription): void {
    console.log('Voir souscription:', subscription);
    // Naviguer vers la page de détails ou ouvrir un modal
  }

  viewDetails(subscription: Subscription): void {
    console.log('Voir détails:', subscription);
    // Afficher plus de détails
  }

  makePayment(subscription: Subscription): void {
    console.log('Effectuer paiement:', subscription);
    // Rediriger vers la page de paiement
  }

  downloadContract(subscription: Subscription): void {
    console.log('Télécharger contrat:', subscription);
    // Télécharger le PDF du contrat
  }

  // Actualisation des données
  refreshData(): void {
    this.loading = true;
    console.log('Actualisation des données...');
    
    // Simuler un appel API
    setTimeout(() => {
      // Ici, vous feriez un vrai appel à votre service
      // this.subscriptionService.getSubscriptions().subscribe(...)
      
      this.filteredSubscriptions = [...this.subscriptions];
      this.totalItems = this.subscriptions.length;
      this.loading = false;
      this.animateProgressBars();
    }, 1500);
  }

  // Animation des barres de progression
  private animateProgressBars(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    setTimeout(() => {
      const progressBars = document.querySelectorAll('.progress-fill');
      progressBars.forEach((bar, index) => {
        setTimeout(() => {
          const element = bar as HTMLElement;
          const width = element.style.width;
          element.style.width = '0%';
          setTimeout(() => {
            element.style.width = width;
          }, 100);
        }, index * 100);
      });
    }, 200);
  }

  // Statistiques calculées
  get totalAmount(): number {
    return this.subscriptions.reduce((sum, sub) => sum + sub.prixTotal, 0);
  }

  get totalPaid(): number {
    return this.subscriptions.reduce((sum, sub) => sum + sub.montantPaye, 0);
  }

  get totalRemaining(): number {
    return this.subscriptions.reduce((sum, sub) => sum + sub.resteAPayer, 0);
  }

  get totalSubscriptions(): number {
    return this.subscriptions.length;
  }

  // Pagination
  get paginatedData(): Subscription[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredSubscriptions.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Méthodes utilitaires
  preventDefault(event: Event): void {
    event.stopPropagation();
  }

  // Tri des données
  sortBy(field: keyof Subscription, direction: 'asc' | 'desc' = 'asc'): void {
    this.filteredSubscriptions.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }
      
      return 0;
    });
  }

  // Export des données
  exportToCSV(): void {
    const headers = ['ID', 'Terrain', 'Prix Total', 'Montant Payé', 'Reste à Payer', 'Date Début', 'Prochain Paiement', 'Statut'];
    const csvContent = [
      headers.join(','),
      ...this.filteredSubscriptions.map(sub => [
        sub.id,
        sub.terrain,
        sub.prixTotal,
        sub.montantPaye,
        sub.resteAPayer,
        sub.dateDebut,
        sub.prochainPaiement,
        sub.statut
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mes-souscriptions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  AddNewSouscription(): void {
    this.router.navigate(['/dashboard/admin/details/create-souscription-admin']);
  }
}