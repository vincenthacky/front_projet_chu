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
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ApiSouscription } from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';

// Interface Payment améliorée
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
  statut: 'active' | 'suspendue' | 'terminee' | 'resillee' | 'en_attente' | 'rejete' | 'en_cour';
  progression: number;
  payments: Payment[];
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
    FormsModule,
  ],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent {
  @Input() placeholder: string = 'Sélectionner une souscription';
  @Input() allowClear: boolean = true;
  @Input() disabled: boolean = false;
  @Input() userId?: number;
  @Output() subscriptionSelected = new EventEmitter<ApiSouscription | null>();

  subscriptions: Subscription[] = [];
  demandesSouscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];

  // Mode d'affichage
  currentViewMode: 'souscriptions' | 'demandes' = 'souscriptions';
  
  // Compteurs
  souscriptionsCount = 0;
  demandesCount = 0;

  // Filtres
  searchTerm = '';
  statusFilter = '';
  terrainFilter = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // État de chargement
  loading = false;

  // Modal
  isVisible = false;
  selectedSubscriptionId: string | null = null;

  // Informations détaillées de la souscription sélectionnée
  selectedSubscriptionInfo: {
    terrain: string;
    surface: string;
    progression: number;
    montantPaye: number;
    resteAPayer: number;
    statut: string;
  } | null = null;

  // Paiements avec plus de détails
  lastFivePayments: {
    date: string;
    amount: number;
    numero_mensualite?: number;
    mode_paiement?: string;
    reference_paiement?: string | null;
    statut_versement?: string;
  }[] = [];

  // Statistiques globales
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
    console.log('🚀 Initialisation du composant subscription');
    this.loadSubscriptions();
    this.loadDemandesSouscriptions();
    this.loadGlobalStats();

    if (typeof window !== 'undefined') {
      (window as any).debugSubscriptions = () => this.debugCurrentState();
      console.log('🛠️ Méthode de debug disponible: debugSubscriptions()');
    }
  }

  // MÉTHODE DE DEBUG
  debugCurrentState(): void {
    console.log('🐛 === DEBUG STATE COMPLET ===');
    console.log('📊 Filtres actuels:', {
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      terrainFilter: this.terrainFilter
    });
    console.log('📋 Souscriptions brutes:', this.subscriptions.length);
    console.log('🔧 Souscriptions filtrées:', this.filteredSubscriptions.length);
    console.log('📄 Pagination:', {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      totalItems: this.totalItems
    });
    console.log('📈 Stats globales:', this.globalStats);
    console.log('⏳ Loading:', this.loading);

    if (this.subscriptions.length > 0) {
      console.log('🔍 Échantillon de données mappées:');
      this.subscriptions.slice(0, 2).forEach((sub, i) => {
        console.log(`   ${i + 1}.`, {
          id: sub.id,
          terrain: sub.terrain,
          surface: sub.surface,
          prixTotal: sub.prixTotal,
          montantPaye: sub.montantPaye,
          resteAPayer: sub.resteAPayer,
          prochainPaiement: sub.prochainPaiement,
          statut: sub.statut,
          progression: sub.progression,
          payments: sub.payments
        });
      });
    }

    console.log('🐛 === FIN DEBUG ===');
  }

  // AJOUT : Méthode loadGlobalStats pour charger les statistiques globales
  loadGlobalStats(): void {
    this.souscriptionService.getMesSouscriptions({
      per_page: 1000
    }).subscribe({
      next: (response) => {
        const allData = response.data as ApiSouscription[];
        const allSubscriptions = this.mapApiDataToSubscriptions(allData);

        this.globalStats = {
          totalAmount: allSubscriptions.reduce((sum, sub) => sum + sub.prixTotal, 0),
          totalPaid: allSubscriptions.reduce((sum, sub) => sum + sub.montantPaye, 0),
          totalRemaining: allSubscriptions.reduce((sum, sub) => sum + sub.resteAPayer, 0),
          totalSubscriptions: response.pagination.total
        };

        console.log('📊 Statistiques globales calculées:', this.globalStats);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  // Nouvelle méthode pour charger les demandes de souscriptions
  loadDemandesSouscriptions(): void {
    console.log('🚀 === CHARGEMENT DEMANDES SOUSCRIPTIONS ===');
    
    const apiFilters: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage
    };

    if (this.statusFilter) {
      apiFilters.statut_dynamique = this.statusFilter;
    }

    if (this.searchTerm) {
      apiFilters.search = this.searchTerm;
    }

    if (this.terrainFilter) {
      apiFilters.superficie = this.terrainFilter;
    }

    this.souscriptionService.getMesDemandesSouscriptions(apiFilters).subscribe({
      next: (response) => {
        console.log('📥 Réponse API demandes:', response);
        const demandes = response.data.map(demande => this.mapDemandeToSubscription(demande));
        this.demandesSouscriptions = demandes;
        this.demandesCount = response.pagination.total;
        console.log('✅ Demandes chargées:', demandes.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement demandes:', error);
        this.demandesSouscriptions = [];
        this.demandesCount = 0;
      }
    });
  }

  // Méthode pour mapper une demande vers le format Subscription
  private mapDemandeToSubscription(demande: any): Subscription {
    return {
      id: `DEM-${demande.id_souscription}`,
      terrain: demande.terrain?.libelle || 'Terrain inconnu',
      surface: demande.terrain?.superficie || '0',
      prixTotal: parseFloat(demande.montant_total_souscrit || '0'),
      montantPaye: 0, // Pas encore payé pour les demandes
      resteAPayer: parseFloat(demande.montant_total_souscrit || '0'),
      dateDebut: demande.date_debut_paiement || demande.date_souscription,
      prochainPaiement: demande.date_prochain || '',
      dateDemande: demande.date_souscription,
      dateCreation: demande.created_at,
      origine: demande.origine || 'utilisateur',
      statut: demande.statut_dynamique as any,
      progression: 0, // Pas de progression pour les demandes
      payments: []
    };
  }

  // Méthode pour basculer entre les modes
  switchViewMode(mode: 'souscriptions' | 'demandes'): void {
    console.log('🔄 Basculement vers:', mode);
    this.currentViewMode = mode;
    this.resetFilters();
    this.currentPage = 1;
    
    if (mode === 'souscriptions') {
      this.filteredSubscriptions = [...this.subscriptions];
      this.totalItems = this.souscriptionsCount;
    } else {
      this.filteredSubscriptions = [...this.demandesSouscriptions];
      this.totalItems = this.demandesCount;
    }
    
    this.updatePaginatedData();
  }

  loadSubscriptions(): void {
    console.log('🚀 === CHARGEMENT SOUSCRIPTIONS ===');
    this.loading = true;

    const apiFilters: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage
    };

    if (this.statusFilter) {
      apiFilters.statut = this.statusFilter;
      console.log('✅ Ajout filtre statut API:', apiFilters.statut);
    }

    if (this.searchTerm) {
      apiFilters.search = this.searchTerm;
      console.log('✅ Ajout filtre recherche API:', apiFilters.search);
    }

    if (this.terrainFilter) {
      apiFilters.superficie = this.terrainFilter;
      console.log('✅ Ajout filtre superficie API:', apiFilters.superficie);
    }

    console.log('📤 Paramètres envoyés à l\'API:', apiFilters);

    this.souscriptionService.getMesSouscriptions(apiFilters).subscribe({
      next: (response) => {
        console.log('📥 Réponse brute API:', response);
        const localData = response.data as ApiSouscription[];
        console.log('📋 Données extraites:', localData.length, 'éléments');

        let mappedSubscriptions = this.mapApiDataToSubscriptions(localData);
        console.log('🗺️ Données mappées:', mappedSubscriptions.length, 'éléments');

        mappedSubscriptions = this.applyClientSideFilters(mappedSubscriptions);
        console.log('🔧 Après filtrage client:', mappedSubscriptions.length, 'éléments');

        this.subscriptions = mappedSubscriptions;
        this.souscriptionsCount = response.pagination.total;
        
        // Mettre à jour les données affichées selon le mode actuel
        if (this.currentViewMode === 'souscriptions') {
          this.filteredSubscriptions = [...this.subscriptions];
          this.totalItems = this.souscriptionsCount;
        }
        
        this.loading = false;
        this.animateProgressBars();

        console.log('✅ === CHARGEMENT TERMINÉ ===');
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des souscriptions:', error);
        this.loading = false;
      }
    });
  }

  // AJOUT : Méthode applyClientSideFilters pour filtrer côté client
  private applyClientSideFilters(subscriptions: Subscription[]): Subscription[] {
    let filtered = [...subscriptions];
    console.log('🔍 Début filtrage:', subscriptions.length, 'éléments');

    if (this.statusFilter) {
      console.log('🎯 Filtrage par statut:', this.statusFilter);
      filtered = filtered.filter(sub => sub.statut === this.statusFilter);
      console.log('📊 Après filtre statut:', filtered.length, 'éléments');
    }

    if (this.terrainFilter) {
      console.log('🏔️ Filtrage par superficie:', this.terrainFilter);
      filtered = filtered.filter(sub => {
        const surfaceNumber = sub.surface.split('.')[0];
        const match = surfaceNumber === this.terrainFilter.toString();
        console.log(`🎯 Surface API: "${sub.surface}" -> Nettoyée: "${surfaceNumber}" vs Filtre: "${this.terrainFilter}" = ${match ? '✅' : '❌'}`);
        return match;
      });
      console.log('📊 Après filtre superficie:', filtered.length, 'éléments');
    }

    if (this.searchTerm) {
      console.log('🔎 Filtrage par recherche:', this.searchTerm);
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(sub =>
        sub.id.toLowerCase().includes(searchLower) ||
        sub.terrain.toLowerCase().includes(searchLower) ||
        sub.prixTotal.toString().includes(searchLower) ||
        sub.montantPaye.toString().includes(searchLower)
      );
      console.log('📊 Après filtre recherche:', filtered.length, 'éléments');
    }

    console.log(`✅ Filtrage terminé: ${subscriptions.length} -> ${filtered.length} résultats`);
    return filtered;
  }

  // CORRECTION : Suppression du filtre est_paye pour inclure tous les paiements
  private mapApiDataToSubscriptions(apiData: ApiSouscription[]): Subscription[] {
    console.log('🗺️ Mapping des données API:', apiData.length, 'éléments');

    const mapped = [];
    for (let index = 0; index < apiData.length; index++) {
      const item = apiData[index];

      // Si le statut est "rejete", ne pas inclure cette souscription  
      if (item.statut_dynamique === 'rejete') {
        console.log(`🚫 Souscription ${item.id_souscription} rejetée, ignorée`);
        continue;
      }

      const prixTotal = item.prix_total_terrain;
      const montantPaye = parseFloat(item.montant_paye);
      const resteAPayer = item.reste_a_payer;

      console.log(`📊 Données ${index + 1}:`, {
        id: item.id_souscription,
        surface: item.terrain.superficie,
        prixTotal: prixTotal,
        montantTotalSouscrit: item.montant_total_souscrit,
        montantPaye: montantPaye,
        resteAPICalcule: item.reste_a_payer,
        dateProchain: item.date_prochain,
        planpaiements: item.planpaiements
      });

      const progression = prixTotal > 0 ? ((montantPaye / prixTotal) * 100) : 0;

      console.log(`📊 Progression calculée avec décimales: ${progression.toFixed(2)}%`);

      // Logique pour le statut
      let statut = item.statut_dynamique;

      let prochainPaiement = '';
      if (item.date_prochain) {
        prochainPaiement = item.date_prochain;
        console.log(`📅 Prochain paiement depuis API: ${prochainPaiement}`);
      } else if (resteAPayer > 0) {
        const dateDebut = new Date(item.date_souscription);
        dateDebut.setMonth(dateDebut.getMonth() + 1);
        prochainPaiement = dateDebut.toISOString().split('T')[0];
        console.log(`📅 Prochain paiement calculé: ${prochainPaiement}`);
      }

      // CORRECTION : Inclure TOUS les paiements
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

      console.log(`💳 Paiements mappés pour souscription ${item.id_souscription}:`, payments);

      const result: Subscription = {
        id: `SUB${item.id_souscription.toString().padStart(3, '0')}`,
        terrain: item.terrain.libelle,
        surface: item.terrain.superficie,
        prixTotal: prixTotal,
        montantPaye: montantPaye,
        resteAPayer: resteAPayer,
        dateDebut: item.date_souscription,
        prochainPaiement: prochainPaiement,
        statut: statut as any,
        progression: progression,
        payments: payments
      };

      console.log(`✅ Résultat mapping ${index + 1}:`, {
        id: result.id,
        surface: result.surface,
        statut: result.statut,
        prochainPaiement: result.prochainPaiement,
        progression: result.progression,
        payments: result.payments
      });

      mapped.push(result);
    }
    return mapped;
  }

  private formatDateForPayment(dateString: string): string {
    if (!dateString) return 'Date non disponible';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date non disponible';
    }
  }

  showModal(subscription: Subscription): void {
    console.log('🔍 Ouverture modal pour:', subscription.id);
    console.log('💳 Paiements disponibles:', subscription.payments);

    if (subscription.payments && Array.isArray(subscription.payments)) {
      this.lastFivePayments = subscription.payments.slice(0, 5).map(payment => ({
        date: payment.date,
        amount: payment.amount,
        numero_mensualite: payment.numero_mensualite,
        mode_paiement: payment.mode_paiement,
        reference_paiement: payment.reference_paiement,
        statut_versement: payment.statut_versement
      }));

      console.log('📋 Paiements sélectionnés pour le modal:', this.lastFivePayments);
    } else {
      this.lastFivePayments = [];
      console.log('⚠️ Aucun paiement trouvé pour cette souscription');
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
      console.log('🔗 Navigation vers détails paiement:', numericId);
      this.router.navigate(['/dashboard/user/details/payement-details', numericId]);
    }
    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
    // Recharger les souscriptions après navigation vers détails (au cas où paiement effectué)
    this.loadSubscriptions();
  }

  handleCancel(): void {
    this.isVisible = false;
    this.lastFivePayments = [];
    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'blue';
      case 'en_cour': return 'green';
      case 'terminee': return 'green';
      case 'suspendue': return 'orange';
      case 'resillee': return 'gray';
      case 'en_attente': return 'cyan';
      case 'rejete': return 'red';
      default: return 'default';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paye_a_temps': return 'green';
      case 'paye_en_retard': return 'orange';
      case 'paiement_partiel': return 'blue';
      default: return 'default';
    }
  }

  trackByPayment(index: number, payment: any): string {
    return `${payment.date}-${payment.amount}-${payment.numero_mensualite}`;
  }

  formatPaymentMode(mode: string): string {
    const modes: { [key: string]: string } = {
      'cheque': 'Chèque',
      'especes': 'Espèces',
      'virement': 'Virement bancaire',
      'carte': 'Carte bancaire',
      'mobile': 'Paiement mobile',
      'mandat': 'Mandat',
      'autre': 'Autre'
    };
    return modes[mode?.toLowerCase()] || mode || 'Non spécifié';
  }

  formatPaymentStatus(status: string): string {
    const statuses: { [key: string]: string } = {
      'paye_a_temps': 'Payé à temps',
      'paye_en_retard': 'Payé en retard',
      'paiement_partiel': 'Paiement partiel',
    };
    return statuses[status?.toLowerCase()] || status || 'Statut inconnu';
  }

  trackByFn(index: number, item: Subscription): string {
    return item.id;
  }

  get Math() {
    return Math;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return 'fa-clock';
      case 'en_cour': return 'fa-clock';
      case 'terminee': return 'fa-check-circle';
      case 'suspendue': return 'fa-pause-circle';
      case 'resillee': return 'fa-times-circle';
      case 'en_attente': return 'fa-hourglass-half';
      case 'rejete': return 'fa-times';
      default: return 'fa-clock';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'en_cour': return 'En cours';
      case 'terminee': return 'Terminée';
      case 'suspendue': return 'Suspendue';
      case 'resillee': return 'Résiliée';
      case 'en_attente': return 'En attente';
      case 'rejete': return 'Rejetée';
      default: return 'Inconnu';
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.replace('_', '-')}`;
  }

  // Méthodes utilitaires pour le basculement
  resetFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.terrainFilter = '';
  }

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    // Cette méthode sera appelée automatiquement par la pagination ng-zorro
    console.log('📄 Mise à jour pagination:', { startIndex, endIndex, currentPage: this.currentPage });
  }

  filterData(): void {
    console.log('🔥 === DÉBUT FILTRAGE ===');
    console.log('🎯 Filtres actifs:', {
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      terrainFilter: this.terrainFilter,
      currentViewMode: this.currentViewMode
    });

    this.currentPage = 1;
    console.log('📄 Pagination remise à 1');
    
    // Charger les données selon le mode actuel
    if (this.currentViewMode === 'souscriptions') {
      this.loadSubscriptions();
    } else {
      this.loadDemandesSouscriptions();
    }
    console.log('🔥 === FIN FILTRAGE ===');
  }

  private searchTimeout: any;
  onSearchChange(): void {
    console.log('Recherche changée:', this.searchTerm);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filterData();
    }, 500);
  }

  onStatusFilterChange(): void {
    console.log('Filtre statut changé:', this.statusFilter);
    this.filterData();
  }

  onTerrainFilterChange(): void {
    console.log('Filtre terrain changé vers:', this.terrainFilter);
    this.filterData();
  }

  viewSubscription(subscription: Subscription): void {
    console.log('Voir souscription:', subscription);
  }

  viewDetails(subscription: Subscription): void {
    console.log('Voir détails:', subscription);
  }

  makePayment(subscription: Subscription): void {
    console.log('Effectuer paiement:', subscription);
  }

  downloadContract(subscription: Subscription): void {
    console.log('Télécharger contrat:', subscription);
  }

  // Nouvelle méthode pour afficher les détails d'une demande
  showDemandeInfo(demande: Subscription): void {
    console.log('📋 Affichage détails demande:', demande.id);
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
    console.log('🔄 ACTUALISATION COMPLÈTE DÉMARRÉE');
    this.loading = true;
    this.subscriptions = [];
    this.demandesSouscriptions = [];
    this.filteredSubscriptions = [];
    this.totalItems = 0;
    this.souscriptionsCount = 0;
    this.demandesCount = 0;
    this.globalStats = {
      totalAmount: 0,
      totalPaid: 0,
      totalRemaining: 0,
      totalSubscriptions: 0
    };
    this.currentPage = 1;

    console.log('🧹 Données vidées, rechargement depuis l\'API...');
    
    // Recharger les deux types de données
    this.loadSubscriptions();
    this.loadDemandesSouscriptions();

    const forceRefreshFilters: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage
    };

    if (this.statusFilter) {
      forceRefreshFilters.statut = this.statusFilter;
      console.log('🎯 Maintien du filtre statut:', this.statusFilter);
    }
    if (this.searchTerm) {
      forceRefreshFilters.search = this.searchTerm;
      console.log('🔍 Maintien de la recherche:', this.searchTerm);
    }
    if (this.terrainFilter) {
      forceRefreshFilters.superficie = this.terrainFilter;
      console.log('🏔️ Maintien du filtre superficie:', this.terrainFilter);
    }

    this.souscriptionService.getMesSouscriptions(forceRefreshFilters).subscribe({
      next: (response) => {
        console.log('✅ Données fraîches reçues de l\'API:', response);
        const localData = response.data as ApiSouscription[];
        let mappedSubscriptions = this.mapApiDataToSubscriptions(localData);
        mappedSubscriptions = this.applyClientSideFilters(mappedSubscriptions);

        this.subscriptions = mappedSubscriptions;
        this.filteredSubscriptions = [...this.subscriptions];
        this.totalItems = response.pagination.total;
        this.loading = false;
        this.animateProgressBars();

        console.log('🎉 ACTUALISATION TERMINÉE - Nouvelles données chargées');
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'actualisation forcée:', error);
        this.loading = false;
      }
    });

    this.loadGlobalStats();
    console.log('🚀 Processus d\'actualisation lancé');
  }

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

  get totalAmount(): number {
    return this.globalStats.totalAmount;
  }

  get totalPaid(): number {
    return this.globalStats.totalPaid;
  }

  get totalRemaining(): number {
    return this.globalStats.totalRemaining;
  }

  get totalSubscriptions(): number {
    return this.globalStats.totalSubscriptions;
  }

  get paginatedData(): Subscription[] {
    return this.filteredSubscriptions;
  }

  onPageChange(page: number): void {
    console.log('Changement de page:', page);
    this.currentPage = page;
    this.loadSubscriptions();
  }

  onPageSizeChange(size: number): void {
    console.log('Changement de taille de page:', size);
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.loadSubscriptions();
  }

  preventDefault(event: Event): void {
    event.stopPropagation();
  }

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
}