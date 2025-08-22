import { Component } from '@angular/core';
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
import { SouscriptionService } from 'src/app/core/services/souscription.service';

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
  payments: Payment[];
}

// Interface locale pour éviter les conflits
interface LocalApiSouscription {
  id_souscription: number;
  montant_total_souscrit: string;
  montant_paye: string;
  reste_a_payer: number;
  date_souscription: string;
  date_prochain: string | null;
  statut_souscription: string;
  terrain: {
    libelle: string;
    superficie: string;
  };
  planpaiements: Array<{
    date_paiement_effectif: string;
    montant_paye: string;
    est_paye: boolean;
  }>;
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
  
  subscriptions: Subscription[] = [];
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

  // Modal
  isVisible = false;
  lastFivePayments: { date: string; amount: number }[] = [];
  selectedSubscriptionId: string | null = null;

  // Statistiques globales (non paginées)
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
    this.loadGlobalStats();
    
    // Exposer la méthode de debug pour la console
    if (typeof window !== 'undefined') {
      (window as any).debugSubscriptions = () => this.debugCurrentState();
      console.log('🛠️ Méthode de debug disponible: debugSubscriptions()');
    }
  }

  // MÉTHODE DE DEBUG - à appeler depuis la console du navigateur
  debugCurrentState(): void {
    console.log('🐛 === DEBUG STATE ===');
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
      console.log('🔍 Échantillon de données:');
      this.subscriptions.slice(0, 2).forEach((sub, i) => {
        console.log(`   ${i + 1}.`, {
          id: sub.id,
          terrain: sub.terrain,
          surface: sub.surface,
          statut: sub.statut
        });
      });
    }
    console.log('🐛 === FIN DEBUG ===');
  }

  loadSubscriptions(): void {
    console.log('🚀 === CHARGEMENT SOUSCRIPTIONS ===');
    this.loading = true;
    
    // Mapper les filtres pour l'API
    const apiFilters: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage
    };

    // CORRECTION: Mapper correctement le statut pour l'API
    if (this.statusFilter) {
      apiFilters.statut_souscription = this.statusFilter;
      console.log('✅ Ajout filtre statut API:', apiFilters.statut_souscription);
    }

    // CORRECTION: Mapper la recherche (inclut le terrain)
    if (this.searchTerm) {
      apiFilters.search = this.searchTerm;
      console.log('✅ Ajout filtre recherche API:', apiFilters.search);
    }

    // CORRECTION: Mapper le filtre terrain par superficie
    if (this.terrainFilter) {
      apiFilters.superficie = this.terrainFilter;
      console.log('✅ Ajout filtre superficie API:', apiFilters.superficie);
    }
    
    console.log('📤 Paramètres envoyés à l\'API:', apiFilters);
    
    this.souscriptionService.getMesSouscriptions(apiFilters).subscribe({
      next: (response) => {
        console.log('📥 Réponse brute API:', response);
        const localData = response.data as LocalApiSouscription[];
        console.log('📋 Données extraites:', localData.length, 'éléments');
        
        // Debug des surfaces dans les données API
        if (localData.length > 0) {
          console.log('🔍 Échantillon des surfaces reçues:');
          localData.slice(0, 3).forEach((item, i) => {
            console.log(`   ${i + 1}. "${item.terrain.superficie}" (${typeof item.terrain.superficie})`);
          });
        }
        
        // Mapper les données
        let mappedSubscriptions = this.mapApiDataToSubscriptions(localData);
        console.log('🗺️ Données mappées:', mappedSubscriptions.length, 'éléments');
        
        // CORRECTION: Appliquer les filtres côté client si l'API ne les gère pas
        mappedSubscriptions = this.applyClientSideFilters(mappedSubscriptions);
        console.log('🔧 Après filtrage client:', mappedSubscriptions.length, 'éléments');
        
        this.subscriptions = mappedSubscriptions;
        this.filteredSubscriptions = [...this.subscriptions];
        this.totalItems = response.pagination.total;
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

  // CORRECTION: Filtrage côté client pour compléter le filtrage API
  private applyClientSideFilters(subscriptions: Subscription[]): Subscription[] {
    let filtered = [...subscriptions];
    console.log('🔍 Début filtrage:', subscriptions.length, 'éléments');

    // Filtre par statut
    if (this.statusFilter) {
      console.log('🎯 Filtrage par statut:', this.statusFilter);
      filtered = filtered.filter(sub => sub.statut === this.statusFilter);
      console.log('📊 Après filtre statut:', filtered.length, 'éléments');
    }

    // CORRECTION: Filtre par superficie exacte avec debug complet
    if (this.terrainFilter) {
      console.log('🏔️ Filtrage par superficie:', this.terrainFilter);
      console.log('🔍 Avant filtrage superficie:', filtered.map(s => ({ id: s.id, surface: s.surface })));
      
      filtered = filtered.filter(sub => {
        // Nettoyer et normaliser la surface de l'API
        let surfaceFromAPI = sub.surface.toString();
        
        // Supprimer tous les caractères non numériques sauf les chiffres
        const surfaceNumber = surfaceFromAPI.replace(/[^\d]/g, '');
        
        // Comparer exactement avec le filtre
        const match = surfaceNumber === this.terrainFilter.toString();
        
        console.log(`🎯 Surface API: "${sub.surface}" -> Nettoyée: "${surfaceNumber}" vs Filtre: "${this.terrainFilter}" = ${match ? '✅' : '❌'}`);
        return match;
      });
      console.log('📊 Après filtre superficie:', filtered.length, 'éléments');
    }

    // Filtre par recherche (si pas géré par l'API)
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

  // CORRECTION: Charger les statistiques globales sans filtres
  loadGlobalStats(): void {
    // Charger toutes les données sans filtres pour les statistiques
    this.souscriptionService.getMesSouscriptions({
      per_page: 1000 // Récupérer un maximum de données
    }).subscribe({
      next: (response) => {
        const allData = response.data as LocalApiSouscription[];
        const allSubscriptions = this.mapApiDataToSubscriptions(allData);
        
        this.globalStats = {
          totalAmount: allSubscriptions.reduce((sum, sub) => sum + sub.prixTotal, 0),
          totalPaid: allSubscriptions.reduce((sum, sub) => sum + sub.montantPaye, 0),
          totalRemaining: allSubscriptions.reduce((sum, sub) => sum + sub.resteAPayer, 0),
          totalSubscriptions: response.pagination.total
        };
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  private mapApiDataToSubscriptions(apiData: LocalApiSouscription[]): Subscription[] {
    console.log('🗺️ Mapping des données API:', apiData.length, 'éléments');
    
    return apiData.map((item, index) => {
      const prixTotal = parseFloat(item.montant_total_souscrit);
      const montantPaye = parseFloat(item.montant_paye);
      
      // Debug complet des surfaces reçues
      console.log(`📏 Surface ${index + 1}:`, {
        raw: item.terrain.superficie,
        type: typeof item.terrain.superficie,
        length: item.terrain.superficie?.length
      });
      
      // CORRECTION: Reste à payer = Prix total - Montant payé
      const resteAPayer = prixTotal - montantPaye;
      const progression = prixTotal > 0 ? Math.round((montantPaye / prixTotal) * 100) : 0;
      
      // CORRECTION: Logique des statuts
      let statut: 'en-cours' | 'en-retard' | 'termine' = 'en-cours';
      
      // Si totalement payé → Terminé
      if (resteAPayer <= 0) {
        statut = 'termine';
      } else {
        // Vérifier s'il y a des paiements effectués
        const paiementsEffectues = item.planpaiements.filter(p => p.est_paye);
        
        if (paiementsEffectues.length === 0) {
          // Aucun paiement → En retard
          statut = 'en-retard';
        } else {
          // Des paiements ont été effectués → En cours
          statut = 'en-cours';
        }
      }

      // CORRECTION: Prochain paiement
      let prochainPaiement = '';
      if (resteAPayer > 0) {
        // Trouver le dernier paiement effectué
        const paiementsEffectues = item.planpaiements
          .filter(p => p.est_paye && p.date_paiement_effectif)
          .sort((a, b) => new Date(b.date_paiement_effectif).getTime() - new Date(a.date_paiement_effectif).getTime());
        
        if (paiementsEffectues.length > 0) {
          // Ajouter 1 mois au dernier paiement
          const dernierPaiement = new Date(paiementsEffectues[0].date_paiement_effectif);
          const prochaineDatePaiement = new Date(dernierPaiement);
          prochaineDatePaiement.setMonth(prochaineDatePaiement.getMonth() + 1);
          prochainPaiement = prochaineDatePaiement.toISOString().split('T')[0];
        } else {
          // Aucun paiement, utiliser la date de début + 1 mois
          const dateDebut = new Date(item.date_souscription);
          dateDebut.setMonth(dateDebut.getMonth() + 1);
          prochainPaiement = dateDebut.toISOString().split('T')[0];
        }
      }

      // Mapper les paiements pour le modal
      const payments: Payment[] = item.planpaiements
        .filter(plan => plan.est_paye)
        .map(plan => ({
          date: this.formatDateForPayment(plan.date_paiement_effectif),
          amount: parseFloat(plan.montant_paye)
        }));

      return {
        id: `SUB${item.id_souscription.toString().padStart(3, '0')}`,
        terrain: item.terrain.libelle,
        surface: item.terrain.superficie, // Garder tel quel depuis l'API
        prixTotal: prixTotal,
        montantPaye: montantPaye,
        resteAPayer: resteAPayer,
        dateDebut: item.date_souscription,
        prochainPaiement: prochainPaiement,
        statut: statut,
        progression: progression,
        payments: payments
      };
    });
  }

  private formatDateForPayment(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  showModal(subscription: Subscription): void {
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
    this.selectedSubscriptionId = subscription.id;
    this.isVisible = true;
  }

  handleOk(): void {
    this.isVisible = false;
    this.lastFivePayments = [];
    if (this.selectedSubscriptionId) {
      this.router.navigate(['/dashboard/user/details/payement-details', this.selectedSubscriptionId]);
    }
  }

  handleCancel(): void {
    this.isVisible = false;
    this.lastFivePayments = [];
  }

  trackByFn(index: number, item: Subscription): string {
    return item.id;
  }
  
  // Fonction Math pour le template
  get Math() {
    return Math;
  }

  // Formatage des montants
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  // Formatage des dates
  formatDate(dateString: string): string {
    if (!dateString) return '';
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

  // CORRECTION: Filtrage des données avec debug complet
  filterData(): void {
    console.log('🔥 === DÉBUT FILTRAGE ===');
    console.log('🎯 Filtres actifs:', {
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter,
      terrainFilter: this.terrainFilter,
      types: {
        searchTerm: typeof this.searchTerm,
        statusFilter: typeof this.statusFilter,
        terrainFilter: typeof this.terrainFilter
      }
    });
    
    // Réinitialiser la pagination
    this.currentPage = 1;
    console.log('📄 Pagination remise à 1');
    
    // Recharger depuis l'API
    console.log('🌐 Rechargement depuis l\'API...');
    this.loadSubscriptions();
    
    console.log('🔥 === FIN FILTRAGE ===');
  }

  // CORRECTION: Gestionnaires d'événements avec logging
  private searchTimeout: any;
  onSearchChange(): void {
    console.log('Recherche changée:', this.searchTerm);
    // Debounce pour éviter trop de requêtes
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

  // Actions sur les souscriptions
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

  // CORRECTION: Actualisation complète et forcée de toutes les données
  refreshData(): void {
    console.log('🔄 ACTUALISATION COMPLÈTE DÉMARRÉE');
    
    // 1. Forcer l'état de chargement
    this.loading = true;
    
    // 2. Vider complètement toutes les données
    this.subscriptions = [];
    this.filteredSubscriptions = [];
    this.totalItems = 0;
    
    // 3. Réinitialiser les stats
    this.globalStats = {
      totalAmount: 0,
      totalPaid: 0,
      totalRemaining: 0,
      totalSubscriptions: 0
    };
    
    // 4. Réinitialiser la pagination
    this.currentPage = 1;
    
    console.log('🧹 Données vidées, rechargement depuis l\'API...');
    
    // 5. Forcer un rechargement complet depuis l'API
    const forceRefreshFilters: any = {
      page: this.currentPage,
      per_page: this.itemsPerPage
    };
    
    // Appliquer les filtres actuels s'ils existent
    if (this.statusFilter) {
      forceRefreshFilters.statut_souscription = this.statusFilter;
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
    
    // 6. Appel API forcé
    this.souscriptionService.getMesSouscriptions(forceRefreshFilters).subscribe({
      next: (response) => {
        console.log('✅ Données fraîches reçues de l\'API:', response);
        
        const localData = response.data as LocalApiSouscription[];
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
    
    // 7. Recharger aussi les statistiques globales fraîches
    this.souscriptionService.getMesSouscriptions({
      per_page: 1000
    }).subscribe({
      next: (response) => {
        const allData = response.data as LocalApiSouscription[];
        const allSubscriptions = this.mapApiDataToSubscriptions(allData);
        
        this.globalStats = {
          totalAmount: allSubscriptions.reduce((sum, sub) => sum + sub.prixTotal, 0),
          totalPaid: allSubscriptions.reduce((sum, sub) => sum + sub.montantPaye, 0),
          totalRemaining: allSubscriptions.reduce((sum, sub) => sum + sub.resteAPayer, 0),
          totalSubscriptions: response.pagination.total
        };
        
        console.log('📊 Statistiques globales actualisées:', this.globalStats);
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'actualisation des stats:', error);
      }
    });
    
    console.log('🚀 Processus d\'actualisation lancé');
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

  // CORRECTION: Statistiques globales (non paginées)
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

  // Pagination ng-zorro
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

  // CORRECTION: Réinitialiser les filtres
  resetFilters(): void {
    console.log('Réinitialisation des filtres');
    this.searchTerm = '';
    this.statusFilter = '';
    this.terrainFilter = '';
    this.currentPage = 1;
    this.loadSubscriptions();
    this.loadGlobalStats();
  }
}