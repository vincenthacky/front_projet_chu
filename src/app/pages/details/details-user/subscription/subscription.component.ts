import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApiSouscription, EtatPaiement } from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';

interface Payment {
  date: string;
  amount: number;
  numero_mensualite: number;
  mode_paiement: string;
  reference_paiement?: string | null;
  statut_versement: string;
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
  dateDemande?: string;
  dateCreation?: string;
  origine?: string;
  statut: string;
  progression: number;
  payments: Payment[];
  etat_paiement?: EtatPaiement;
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [
    CommonModule,
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
    NzPaginationModule,
    NzToolTipModule,
    FormsModule,
  ],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent {
  subscriptions: Subscription[] = [];
  demandesSouscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];

  currentViewMode: 'souscriptions' | 'demandes' = 'souscriptions';
  
  souscriptionsCount = 0;
  demandesCount = 0;

  searchTerm = '';

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  loading = false;

  isVisible = false;
  selectedSubscriptionId: string | null = null;

  selectedSubscriptionInfo: {
    terrain: string;
    surface: string;
    progression: number;
    montantPaye: number;
    resteAPayer: number;
    statut: string;
  } | null = null;

  lastFivePayments: {
    date: string;
    amount: number;
    numero_mensualite?: number;
    mode_paiement?: string;
    reference_paiement?: string | null;
    statut_versement?: string;
  }[] = [];

  globalStats = {
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
    totalSubscriptions: 0
  };

  constructor(
    private router: Router,
    private modal: NzModalService,
    private souscriptionService: SouscriptionService
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
    this.loadDemandesSouscriptions();
    this.loadGlobalStats();
  }

  loadGlobalStats(): void {
    this.souscriptionService.getMesSouscriptions({ per_page: 1000 }).subscribe({
      next: (response) => {
        const allData = response.data as ApiSouscription[];
        const allSubscriptions = this.mapApiDataToSubscriptions(allData);

        this.globalStats = {
          totalAmount: allSubscriptions.reduce((sum, sub) => sum + sub.prixTotal, 0),
          totalPaid: allSubscriptions.reduce((sum, sub) => sum + sub.montantPaye, 0),
          totalRemaining: allSubscriptions.reduce((sum, sub) => sum + sub.resteAPayer, 0),
          totalSubscriptions: response.pagination.total
        };
      },
      error: (error) => console.error('Erreur stats:', error)
    });
  }

  loadDemandesSouscriptions(): void {
    this.loading = true;
    
    const apiFilters: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage
    };

    if (this.searchTerm) {
      apiFilters.search = this.searchTerm;
    }

    this.souscriptionService.getMesDemandesSouscriptions(apiFilters).subscribe({
      next: (response) => {
        const demandes = response.data.map(demande => this.mapDemandeToSubscription(demande));
        this.demandesSouscriptions = demandes;
        this.demandesCount = response.pagination.total;
        
        if (this.currentViewMode === 'demandes') {
          this.filteredSubscriptions = [...this.demandesSouscriptions];
          this.totalItems = this.demandesCount;
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur demandes:', error);
        this.demandesSouscriptions = [];
        this.demandesCount = 0;
        this.loading = false;
      }
    });
  }

  private mapDemandeToSubscription(demande: any): Subscription {
    return {
      id: `DEM-${demande.id_souscription}`,
      terrain: demande.terrain?.libelle || 'Terrain inconnu',
      surface: demande.terrain?.superficie || '0',
      prixTotal: parseFloat(demande.montant_total_souscrit || '0'),
      montantPaye: 0,
      resteAPayer: parseFloat(demande.montant_total_souscrit || '0'),
      dateDebut: demande.date_debut_paiement || demande.date_souscription,
      prochainPaiement: demande.date_prochain || '',
      dateDemande: demande.date_souscription,
      dateCreation: demande.created_at,
      origine: demande.origine || 'utilisateur',
      statut: demande.statut_souscription,
      progression: 0,
      payments: [],
      etat_paiement: undefined
    };
  }

  switchViewMode(mode: 'souscriptions' | 'demandes'): void {
    this.currentViewMode = mode;
    this.searchTerm = '';
    this.currentPage = 1;
    
    if (mode === 'souscriptions') {
      this.filteredSubscriptions = [...this.subscriptions];
      this.totalItems = this.souscriptionsCount;
    } else {
      this.filteredSubscriptions = [...this.demandesSouscriptions];
      this.totalItems = this.demandesCount;
    }
  }

  loadSubscriptions(): void {
    this.loading = true;

    const apiFilters: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage
    };

    if (this.searchTerm) {
      apiFilters.search = this.searchTerm;
    }

    this.souscriptionService.getMesSouscriptions(apiFilters).subscribe({
      next: (response) => {
        const localData = response.data as ApiSouscription[];
        let mappedSubscriptions = this.mapApiDataToSubscriptions(localData);

        this.subscriptions = mappedSubscriptions;
        this.souscriptionsCount = response.pagination.total;
        
        if (this.currentViewMode === 'souscriptions') {
          this.filteredSubscriptions = [...this.subscriptions];
          this.totalItems = this.souscriptionsCount;
        }
        
        this.loading = false;
        this.animateProgressBars();
      },
      error: (error) => {
        console.error('Erreur souscriptions:', error);
        this.loading = false;
      }
    });
  }

  private mapApiDataToSubscriptions(apiData: ApiSouscription[]): Subscription[] {
    const mapped = [];
    for (let item of apiData) {
      if (item.statut_dynamique === 'rejete') continue;

      const prixTotal = item.prix_total_terrain;
      const montantPaye = parseFloat(item.montant_paye);
      const resteAPayer = item.reste_a_payer;
      const progression = prixTotal > 0 ? ((montantPaye / prixTotal) * 100) : 0;

      let prochainPaiement = '';
      if (item.date_prochain) {
        prochainPaiement = item.date_prochain;
      } else if (resteAPayer > 0) {
        const dateDebut = new Date(item.date_souscription);
        dateDebut.setMonth(dateDebut.getMonth() + 1);
        prochainPaiement = dateDebut.toISOString().split('T')[0];
      }

      const payments: Payment[] = item.planpaiements
        .map(plan => ({
          date: this.formatDateForPayment(plan.date_paiement_effectif),
          amount: parseFloat(plan.montant_paye),
          numero_mensualite: plan.numero_mensualite,
          mode_paiement: plan.mode_paiement || 'Non spécifié',
          reference_paiement: plan.reference_paiement,
          statut_versement: plan.statut_versement
        }))
        .sort((a, b) => b.numero_mensualite - a.numero_mensualite);

      mapped.push({
        id: `SUB${item.id_souscription.toString().padStart(3, '0')}`,
        terrain: item.terrain.libelle,
        surface: item.terrain.superficie,
        prixTotal, montantPaye, resteAPayer,
        dateDebut: item.date_souscription,
        prochainPaiement,
        statut: item.statut_dynamique,
        progression,
        payments,
        etat_paiement: item.etat_paiement
      });
    }
    return mapped;
  }

  private formatDateForPayment(dateString: string): string {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return 'Date non disponible'; }
  }

  showModal(subscription: Subscription): void {
    if (subscription.payments && Array.isArray(subscription.payments)) {
      this.lastFivePayments = subscription.payments.slice(0, 5).map(payment => ({
        date: payment.date,
        amount: payment.amount,
        numero_mensualite: payment.numero_mensualite,
        mode_paiement: payment.mode_paiement,
        reference_paiement: payment.reference_paiement,
        statut_versement: payment.statut_versement
      }));
    } else {
      this.lastFivePayments = [];
    }

    this.selectedSubscriptionId = subscription.id;
    this.selectedSubscriptionInfo = {
      terrain: subscription.terrain,
      surface: subscription.surface,
      progression: subscription.progression,
      montantPaye: subscription.montantPaye,
      resteAPayer: subscription.resteAPayer,
      statut: subscription.statut
    };

    this.isVisible = true;
  }

  handleOk(): void {
    this.isVisible = false;
    this.lastFivePayments = [];
    if (this.selectedSubscriptionId) {
      const numericId = this.selectedSubscriptionId.replace('SUB', '').replace(/^0+/, '');
      this.router.navigate(['/dashboard/user/details/payement-details', numericId]);
    }
    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
    this.loadSubscriptions();
  }

  handleCancel(): void {
    this.isVisible = false;
    this.lastFivePayments = [];
    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'active': 'blue', 'en_cour': 'green', 'terminee': 'green',
      'suspendue': 'orange', 'resillee': 'gray', 'en_attente': 'cyan',
      'approuve': 'green', 'rejete': 'red'
    };
    return colors[status] || 'default';
  }

  getPaymentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'paye_a_temps':
        return 'green';
      case 'paye_en_retard':
        return 'orange';
      case 'paiement_partiel':
        return 'blue';
      default:
        return 'default';
    }
  }

  getPaymentStatusDisplay(subscription: Subscription): { 
    statut: string; 
    montant: number; 
    label: string; 
    color: string;
    tooltip: string;
  } {
    const etatPaiement = subscription.etat_paiement;
    
    if (!etatPaiement) {
      return { 
        statut: 'inconnu', 
        montant: 0, 
        label: 'Non défini', 
        color: 'default',
        tooltip: 'État de paiement non disponible'
      };
    }

    const statut = etatPaiement.statut?.toLowerCase() || '';

    switch(statut) {
      case 'en_avance':
        const montantAvance = etatPaiement.avance?.montant_en_avance || 0;
        const moisAvance = etatPaiement.avance?.mois_en_avance || 0;
        return {
          statut: 'en_avance',
          montant: montantAvance,
          label: `En avance de ${moisAvance} mois`,
          color: 'green',
          tooltip: `${moisAvance} mois d'avance • Avance de ${this.formatAmount(montantAvance)}`
        };

      case 'en_retard':
        const montantRetard = etatPaiement.retard?.montant_en_retard || 0;
        const moisRetard = etatPaiement.retard?.mois_en_retard || 0;
        return {
          statut: 'en_retard',
          montant: montantRetard,
          label:  `En retard de ${moisRetard} mois`,
          color: 'red',
          tooltip: moisRetard > 0 
            ? `${moisRetard} mois de retard • Montant en retard: ${this.formatAmount(montantRetard)}`
            : `Montant en retard: ${this.formatAmount(montantRetard)}`
        };

      case 'a_jour':
        return {
          statut: 'a_jour',
          montant: 0,
          label: 'À jour',
          color: 'blue',
          tooltip: 'Paiements à jour selon l\'échéancier'
        };

      default:
        return {
          statut: 'inconnu',
          montant: 0,
          label: statut || 'Non défini',
          color: 'default',
          tooltip: 'État de paiement: ' + (statut || 'inconnu')
        };
    }
  }

  trackByPayment(index: number, payment: any): string {
    return `${payment.date}-${payment.amount}-${payment.numero_mensualite}`;
  }

  formatPaymentMode(mode: string): string {
    const modes: any = {
      'cheque': 'Chèque', 'especes': 'Espèces', 'virement': 'Virement bancaire',
      'carte': 'Carte bancaire', 'mobile_money': 'Paiement mobile', 'mandat': 'Mandat', 'autre': 'Autre'
    };
    return modes[mode?.toLowerCase()] || mode || 'Non spécifié';
  }

  formatPaymentStatus(status: string): string {
    const statuses: any = {
      'paye_a_temps': 'Payé à temps', 'paye_en_retard': 'Payé en retard', 'paiement_partiel': 'Paiement partiel'
    };
    return statuses[status?.toLowerCase()] || status || 'Statut inconnu';
  }

  trackByFn(index: number, item: Subscription): string { return item.id; }
  get Math() { return Math; }
  
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      'active': 'fa-clock', 'en_cour': 'fa-clock', 'terminee': 'fa-check-circle',
      'suspendue': 'fa-pause-circle', 'resillee': 'fa-times-circle', 'en_attente': 'fa-hourglass-half',
      'approuve': 'fa-check-circle', 'rejete': 'fa-times'
    };
    return icons[status] || 'fa-clock';
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'active': 'Active', 'en_cour': 'En cours', 'terminee': 'Terminée',
      'suspendue': 'Suspendue', 'resillee': 'Résiliée', 'en_attente': 'En attente',
      'approuve': 'Approuvé', 'rejete': 'Rejetée'
    };
    return labels[status] || 'Inconnu';
  }

  getStatusClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  updatePaginatedData(): void {}

  filterData(): void {
    this.currentPage = 1;
    
    if (this.currentViewMode === 'souscriptions') {
      this.loadSubscriptions();
    } else {
      this.loadDemandesSouscriptions();
    }
  }

  private searchTimeout: any;
  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.filterData(), 500);
  }

  showDemandeInfo(demande: Subscription): void {
    this.modal.info({
      nzTitle: 'Détails de la demande',
      nzContent: `
        <div class="demande-details">
          <p><strong>ID:</strong> ${demande.id}</p>
          <p><strong>Terrain:</strong> ${demande.terrain}</p>
          <p><strong>Surface:</strong> ${demande.surface} m²</p>
          <p><strong>Prix total:</strong> ${this.formatAmount(demande.prixTotal)}</p>
          <p><strong>Date demande:</strong> ${this.formatDate(demande.dateDemande || '')}</p>
          <p><strong>Statut:</strong> ${this.getStatusLabel(demande.statut)}</p>
          <p><strong>Origine:</strong> ${demande.origine || 'Utilisateur'}</p>
        </div>
      `,
      nzWidth: 500
    });
  }

  refreshData(): void {
    this.loading = true;
    this.currentPage = 1;

    this.loadSubscriptions();
    this.loadDemandesSouscriptions();
    this.loadGlobalStats();
  }

  private animateProgressBars(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    setTimeout(() => {
      const progressBars = document.querySelectorAll('.progress-fill');
      progressBars.forEach((bar, index) => {
        setTimeout(() => {
          const element = bar as HTMLElement;
          const width = element.style.width;
          element.style.width = '0%';
          setTimeout(() => { element.style.width = width; }, 100);
        }, index * 100);
      });
    }, 200);
  }

  get totalAmount(): number { return this.globalStats.totalAmount; }
  get totalPaid(): number { return this.globalStats.totalPaid; }
  get totalRemaining(): number { return this.globalStats.totalRemaining; }
  get totalSubscriptions(): number { return this.globalStats.totalSubscriptions; }
  get paginatedData(): Subscription[] { return this.filteredSubscriptions; }

  onPageChange(page: number): void {
    this.currentPage = page;
    
    if (this.currentViewMode === 'souscriptions') {
      this.loadSubscriptions();
    } else {
      this.loadDemandesSouscriptions();
    }
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
    
    if (this.currentViewMode === 'souscriptions') {
      this.loadSubscriptions();
    } else {
      this.loadDemandesSouscriptions();
    }
  }
}