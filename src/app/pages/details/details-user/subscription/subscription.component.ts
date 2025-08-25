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

// ✅ Interface Payment améliorée
interface Payment {
  date: string;
  amount: number;
  numero_mensualite: number;
  mode_paiement: string;
  reference_paiement?: string;
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
  statut: 'en-cours' | 'en-retard' | 'termine';
  progression: number;
  payments: Payment[];
}

// Interface locale pour éviter les conflits - MISE À JOUR complète avec tous les champs API
interface LocalApiSouscription {
  id_souscription: number;
  montant_total_souscrit: string;
  montant_paye: string;
  reste_a_payer: number; // ← Champ calculé par l'API
  date_souscription: string;
  date_prochain: string | null; // ← Date fournie par l'API
  statut_souscription: string;
  prix_total_terrain: number; // ← AJOUT du vrai prix total du terrain
  terrain: {
    libelle: string;
    superficie: string;
  };
  planpaiements: Array<{
    id_plan_paiement: number;
    numero_mensualite: number;
    date_paiement_effectif: string;
    montant_paye: string;
    mode_paiement: string;
    reference_paiement: string | null;
    est_paye: boolean;
    statut_versement: string;
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

  // ✅ Modal amélioré
  isVisible = false;
  selectedSubscriptionId: string | null = null;
  
  // ✅ Informations détaillées de la souscription sélectionnée
  selectedSubscriptionInfo: {
    terrain: string;
    surface: string;
    progression: number;
    montantPaye: number;
    resteAPayer: number;
    statut: string;
  } | null = null;

  // ✅ Paiements avec plus de détails
  lastFivePayments: {
    date: string;
    amount: number;
    numero_mensualite?: number;
    mode_paiement?: string;
    reference_paiement?: string;
    statut_versement?: string;
  }[] = [];

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
          prixTotal: sub.prixTotal, // ← Devrait être ~263M (prix_total_terrain)
          montantPaye: sub.montantPaye, // ← Devrait être ~8M (montant_paye)
          resteAPayer: sub.resteAPayer, // ← Devrait être ~255M (reste_a_payer)
          prochainPaiement: sub.prochainPaiement,
          statut: sub.statut,
          progression: sub.progression, // ← Devrait être ~3% (8M/263M)
          payments: sub.payments.length, // ← Nombre de paiements
          'Prix formaté': this.formatAmount(sub.prixTotal),
          'Payé formaté': this.formatAmount(sub.montantPaye),
          'Reste formaté': this.formatAmount(sub.resteAPayer)
        });
      });
    }
    
    // Debug spécial pour les surfaces
    if (this.terrainFilter) {
      console.log('🏔️ DEBUG FILTRE SUPERFICIE:');
      console.log('Filtre actuel:', this.terrainFilter);
      this.subscriptions.forEach((sub, i) => {
        const surfaceNumber = sub.surface.split('.')[0]; // ✅ CORRECTION
        const match = surfaceNumber === this.terrainFilter.toString();
        console.log(`${i + 1}. Surface: "${sub.surface}" -> "${surfaceNumber}" = ${match ? '✅' : '❌'}`);
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

  // ✅ CORRECTION: Filtrage côté client pour compléter le filtrage API
  private applyClientSideFilters(subscriptions: Subscription[]): Subscription[] {
    let filtered = [...subscriptions];
    console.log('🔍 Début filtrage:', subscriptions.length, 'éléments');

    // Filtre par statut
    if (this.statusFilter) {
      console.log('🎯 Filtrage par statut:', this.statusFilter);
      filtered = filtered.filter(sub => sub.statut === this.statusFilter);
      console.log('📊 Après filtre statut:', filtered.length, 'éléments');
    }

    // ✅ CORRECTION: Filtre par superficie avec nettoyage correct
    if (this.terrainFilter) {
      console.log('🏔️ Filtrage par superficie:', this.terrainFilter);
      console.log('🔍 Avant filtrage superficie:', filtered.map(s => ({ id: s.id, surface: s.surface })));
      
      filtered = filtered.filter(sub => {
        // ✅ CORRECTION: Nettoyer la superficie correctement
        let surfaceFromAPI = sub.surface.toString();
        
        // Supprimer les points décimaux et caractères non numériques, mais garder seulement la partie entière
        const surfaceNumber = surfaceFromAPI.split('.')[0]; // ✅ Récupère "250" de "250.00"
        
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

  // CORRECTION: Charger les statistiques globales sans filtres avec les bons montants
  loadGlobalStats(): void {
    // Charger toutes les données sans filtres pour les statistiques
    this.souscriptionService.getMesSouscriptions({
      per_page: 1000 // Récupérer un maximum de données
    }).subscribe({
      next: (response) => {
        const allData = response.data as LocalApiSouscription[];
        const allSubscriptions = this.mapApiDataToSubscriptions(allData);
        
        // CORRECTION: Utiliser les montants corrects mappés
        this.globalStats = {
          totalAmount: allSubscriptions.reduce((sum, sub) => sum + sub.prixTotal, 0), // ← prix_total_terrain
          totalPaid: allSubscriptions.reduce((sum, sub) => sum + sub.montantPaye, 0), // ← montant_paye
          totalRemaining: allSubscriptions.reduce((sum, sub) => sum + sub.resteAPayer, 0), // ← reste_a_payer
          totalSubscriptions: response.pagination.total
        };
        
        console.log('📊 Statistiques globales calculées:', {
          totalAmount: this.globalStats.totalAmount, // ← Somme des prix_total_terrain
          totalPaid: this.globalStats.totalPaid,
          totalRemaining: this.globalStats.totalRemaining,
          totalSubscriptions: this.globalStats.totalSubscriptions
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }

  // ✅ CORRECTION COMPLÈTE: Mapping avec logique des statuts et paiements corrigés
  private mapApiDataToSubscriptions(apiData: LocalApiSouscription[]): Subscription[] {
    console.log('🗺️ Mapping des données API:', apiData.length, 'éléments');
    
    return apiData.map((item, index) => {
      // CORRECTION: Utiliser prix_total_terrain au lieu de montant_total_souscrit
      const prixTotal = item.prix_total_terrain; // ← 263782400 (vrai prix du terrain)
      const montantPaye = parseFloat(item.montant_paye); // ← 8243200 (montant déjà payé)
      const resteAPayer = item.reste_a_payer; // ← Utiliser directement la valeur de l'API
      
      // Debug complet des données reçues
      console.log(`📊 Données ${index + 1}:`, {
        id: item.id_souscription,
        surface: item.terrain.superficie,
        prixTotal: prixTotal,
        montantTotalSouscrit: item.montant_total_souscrit,
        montantPaye: montantPaye,
        resteAPICalcule: item.reste_a_payer,
        dateProchain: item.date_prochain,
        planpaiements: item.planpaiements.length
      });
      
      const progression = prixTotal > 0 ? Math.round((montantPaye / prixTotal) * 100) : 0;
      
      // ✅ CORRECTION COMPLÈTE: Nouvelle logique des statuts selon vos règles métier
      let statut: 'en-cours' | 'en-retard' | 'termine' = 'en-cours'; // ← Défaut "en-cours" au lieu de "en-retard"
      
      console.log(`🔍 Analyse statut pour souscription ${item.id_souscription}:`, {
        resteAPayer,
        montantPaye,
        dateProchain: item.date_prochain,
        planpaiements: item.planpaiements.length
      });
      
      // 1. Si totalement payé → Terminé
      if (resteAPayer <= 0) {
        statut = 'termine';
        console.log(`✅ Statut: TERMINÉ (reste_a_payer = ${resteAPayer})`);
      } 
      // 2. Si date_prochain est passée → En retard
      else if (item.date_prochain) {
        const today = new Date();
        const dateProchain = new Date(item.date_prochain);
        
        console.log(`📅 Comparaison dates: Aujourd'hui = ${today.toISOString().split('T')[0]} vs Prochain = ${item.date_prochain}`);
        
        if (dateProchain < today) {
          statut = 'en-retard';
          console.log(`⚠️ Statut: EN RETARD (date ${item.date_prochain} dépassée)`);
        } else {
          // Date pas encore dépassée
          if (montantPaye > 0) {
            statut = 'en-cours';
            console.log(`🔄 Statut: EN COURS (paiement effectué: ${montantPaye}, date pas dépassée)`);
          } else {
            // Aucun paiement mais date pas dépassée → en cours
            statut = 'en-cours';
            console.log(`🔄 Statut: EN COURS (aucun paiement mais date pas dépassée)`);
          }
        }
      }
      // 3. Pas de date_prochain mais montant payé > 0 → En cours
      else if (montantPaye > 0) {
        statut = 'en-cours';
        console.log(`🔄 Statut: EN COURS (montant payé: ${montantPaye}, pas de date_prochain)`);
      }
      // 4. Aucun paiement et pas de date_prochain → En cours (nouvelle souscription)
      else {
        statut = 'en-cours';
        console.log(`🔄 Statut: EN COURS (nouvelle souscription, pas de paiement ni date_prochain)`);
      }

      // CORRECTION: Utiliser directement date_prochain de l'API
      let prochainPaiement = '';
      if (item.date_prochain) {
        // L'API fournit déjà la date du prochain paiement
        prochainPaiement = item.date_prochain;
        console.log(`📅 Prochain paiement depuis API: ${prochainPaiement}`);
      } else if (resteAPayer > 0) {
        // Fallback: calculer seulement si l'API ne fournit pas la date
        const dateDebut = new Date(item.date_souscription);
        dateDebut.setMonth(dateDebut.getMonth() + 1);
        prochainPaiement = dateDebut.toISOString().split('T')[0];
        console.log(`📅 Prochain paiement calculé: ${prochainPaiement}`);
      }

      // ✅ CORRECTION: Mapper TOUS les paiements avec plus de détails
      const payments: Payment[] = item.planpaiements
        .filter(plan => plan.est_paye) // Seulement les paiements effectués
        .map(plan => ({
          date: this.formatDateForPayment(plan.date_paiement_effectif),
          amount: parseFloat(plan.montant_paye),
          numero_mensualite: plan.numero_mensualite,
          mode_paiement: plan.mode_paiement || 'Non spécifié',
          reference_paiement: plan.reference_paiement || undefined,
          statut_versement: plan.statut_versement
        }))
        .sort((a, b) => {
          // Trier par numéro de mensualité décroissant (plus récent en premier)
          return b.numero_mensualite - a.numero_mensualite;
        });

      console.log(`💳 Paiements mappés pour souscription ${item.id_souscription}:`, payments.length, 'paiements');

      const result = {
        id: `SUB${item.id_souscription.toString().padStart(3, '0')}`,
        terrain: item.terrain.libelle,
        surface: item.terrain.superficie, // ← Garder "250.00" tel quel depuis l'API
        prixTotal: prixTotal, // ← 263782400 (prix total du terrain)
        montantPaye: montantPaye, // ← 8243200 (montant payé)
        resteAPayer: resteAPayer, // ← 255539200 (reste à payer)
        dateDebut: item.date_souscription,
        prochainPaiement: prochainPaiement, // ← Valeur directe ou calculée de l'API
        statut: statut, // ← Statut corrigé selon la logique métier
        progression: progression,
        payments: payments // ✅ Paiements avec plus de détails
      };

      console.log(`✅ Résultat mapping ${index + 1}:`, {
        id: result.id,
        surface: result.surface, // ← "250.00"
        statut: result.statut, // ← Statut correct
        prochainPaiement: result.prochainPaiement,
        paymentsCount: result.payments.length // ← Nombre de paiements
      });

      return result;
    });
  }

  // ✅ Méthode améliorée pour formater les dates avec gestion d'erreurs
  private formatDateForPayment(dateString: string): string {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
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

  // ✅ Modal amélioré avec debug complet et informations détaillées
  showModal(subscription: Subscription): void {
    console.log('🔍 Ouverture modal pour:', subscription.id);
    console.log('💳 Paiements disponibles:', subscription.payments);
    
    if (subscription.payments && Array.isArray(subscription.payments)) {
      // Prendre les 5 derniers paiements (déjà triés par numéro de mensualité décroissant)
      this.lastFivePayments = subscription.payments.slice(0, 5).map(payment => ({
        date: payment.date,
        amount: payment.amount,
        numero_mensualite: payment.numero_mensualite,
        mode_paiement: payment.mode_paiement,
        reference_paiement: payment.reference_paiement,
        statut_versement: payment.statut_versement
      }));
      
      console.log('📋 5 derniers paiements sélectionnés:', this.lastFivePayments);
    } else {
      this.lastFivePayments = [];
      console.log('⚠️ Aucun paiement trouvé pour cette souscription');
    }
    
    // Stocker les informations de la souscription pour l'affichage
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

  // ✅ Amélioration handleOk avec navigation correcte
  handleOk(): void {
    this.isVisible = false;
    this.lastFivePayments = [];
    
    if (this.selectedSubscriptionId) {
      // Extraire l'ID numérique de la souscription
      const numericId = this.selectedSubscriptionId.replace('SUB', '').replace(/^0+/, '');
      console.log('🔗 Navigation vers détails paiement:', numericId);
      
      this.router.navigate(['/dashboard/user/details/payement-details', numericId]);
    }
    
    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
  }

  // ✅ Amélioration handleCancel avec nettoyage complet
  handleCancel(): void {
    this.isVisible = false;
    this.lastFivePayments = [];
    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
  }

  // ✅ Méthodes utilitaires pour le modal

  // Méthode pour obtenir la couleur du statut de souscription
  getStatusColor(status: string): string {
    switch(status) {
      case 'en-cours': return 'blue';
      case 'en-retard': return 'red'; 
      case 'termine': return 'green';
      case 'suspendu': return 'orange';
      case 'annule': return 'default';
      default: return 'default';
    }
  }

  // Méthode pour obtenir la couleur du statut de paiement
  getPaymentStatusColor(status: string): string {
    switch(status) {
      case 'paye_a_temps': return 'green';
      case 'paye_en_retard': return 'orange';
      case 'en_attente': return 'blue';
      case 'annule': return 'red';
      default: return 'default';
    }
  }

  // Méthode de tracking pour la performance des listes
  trackByPayment(index: number, payment: any): string {
    return `${payment.date}-${payment.amount}-${payment.numero_mensualite}`;
  }

  // Méthode pour formater le mode de paiement
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

  // Méthode pour formater le statut de versement
  formatPaymentStatus(status: string): string {
    const statuses: { [key: string]: string } = {
      'paye_a_temps': 'Payé à temps',
      'paye_en_retard': 'Payé en retard', 
      'en_attente': 'En attente',
      'annule': 'Annulé',
      'refuse': 'Refusé',
      'en_cours': 'En cours'
    };
    return statuses[status?.toLowerCase()] || status || 'Statut inconnu';
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
    
    // 7. Recharger aussi les statistiques globales fraîches avec les bons montants
    this.souscriptionService.getMesSouscriptions({
      per_page: 1000
    }).subscribe({
      next: (response) => {
        const allData = response.data as LocalApiSouscription[];
        const allSubscriptions = this.mapApiDataToSubscriptions(allData);
        
        // CORRECTION: Utiliser les montants corrects (prix_total_terrain)
        this.globalStats = {
          totalAmount: allSubscriptions.reduce((sum, sub) => sum + sub.prixTotal, 0), // ← prix_total_terrain
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