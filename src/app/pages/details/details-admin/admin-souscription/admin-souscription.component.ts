import { Component, OnInit, OnDestroy, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Imports Ng-Zorro
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { Router } from '@angular/router';
import { PayementsService } from 'src/app/core/services/payements.service';
import { 
  ApiSouscription, 
  SouscriptionFilters, 
  UtilisateurAvecSouscriptions,
  SouscriptionsGroupeesParUtilisateurResponse,
  StatistiquesGlobales
} from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';
import { PaymentData, PaymentCreationResponse } from 'src/app/core/models/paiments';

// Interface pour le modal de détails
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

interface Payment {
  date: string;
  amount: number;
  numero_mensualite?: number;
  mode_paiement?: string;
  reference_paiement?: string | null;
  statut_versement?: string;
}

interface SelectedSubscriptionInfo {
  terrain: string;
  surface: string;
  progression: number;
  montantPaye: number;
  resteAPayer: number;
  statut: string;
}

@Component({
  selector: 'app-admin-souscription',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCollapseModule,
    NzAvatarModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzModalModule,
    NzSpaceModule,
    NzDropDownModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSpinModule,
    NzPaginationModule,
    NzToolTipModule
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './admin-souscription.component.html',
  styleUrls: ['./admin-souscription.component.scss']
})
export class AdminSouscriptionComponent implements OnInit, OnDestroy {
  // Propriétés pour les données groupées
  groupedUsers: UtilisateurAvecSouscriptions[] = [];
  statistiquesGlobales?: StatistiquesGlobales;
  isLoading = false;
  error: string | null = null;

  // Propriétés pour la pagination
  currentPage = 1;
  perPage = 10;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 30, 40, 50, 100];

  // Propriétés pour les filtres
  filters: SouscriptionFilters = {
    page: 1,
    per_page: 10
  };

  // Variables pour les filtres du template
  searchTerm = '';
  statusFilter = '';
  surfaceFilter: number | '' = '';
  dateDebut: string = '';
  dateFin: string = '';

  // Propriétés pour le modal de détails
  isVisible = false;
  selectedSubscriptionId: string | null = null;
  selectedSubscriptionInfo: SelectedSubscriptionInfo | null = null;
  lastFivePayments: Payment[] = [];

  // Propriétés pour le modal de paiement
  isPaymentModalVisible = false;
  selectedSouscriptionForPayment: ApiSouscription | null = null;
  paymentForm: PaymentData = {
    id_souscription: 0,
    mode_paiement: '',
    montant_paye: 0,
    date_paiement_effectif: '',
    reference_paiement: '',
    commentaire_paiement: ''
  };
  isProcessingPayment = false;

  // Propriété pour utiliser Math dans le template
  Math = Math;

  // Pour le debounce de recherche
  private searchTimeout: any;

  constructor(
    private souscriptionService: SouscriptionService,
    private payementsService: PayementsService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadSouscriptionsGroupees();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * NOUVELLE MÉTHODE : Chargement des souscriptions groupées par utilisateur
   */
  loadSouscriptionsGroupees(filters?: SouscriptionFilters): void {
    console.log('🔄 CHARGEMENT DES SOUSCRIPTIONS GROUPÉES');
    this.isLoading = true;
    this.error = null;

    const apiFilters: SouscriptionFilters = {
      page: this.currentPage,
      per_page: this.perPage,
      ...filters
    };

    if (this.statusFilter) {
      apiFilters.statut = this.statusFilter;
    }

    if (this.searchTerm) {
      apiFilters.search = this.searchTerm;
    }

    if (this.surfaceFilter) {
      apiFilters.superficie = this.surfaceFilter;
    }

    if (this.dateDebut) {
      apiFilters.date_debut = this.dateDebut;
    }

    if (this.dateFin) {
      apiFilters.date_fin = this.dateFin;
    }

    console.log('📤 Filtres envoyés:', apiFilters);

    this.souscriptionService.getSouscriptionsGroupeesParUtilisateur(apiFilters).subscribe({
      next: (response: SouscriptionsGroupeesParUtilisateurResponse) => {
        console.log('📡 Réponse API groupée:', response);

        if (response.success) {
          this.groupedUsers = response.data;
          this.statistiquesGlobales = response.statistiques_globales;
          this.totalItems = response.pagination.total;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.last_page;

          console.log('✅ Utilisateurs chargés:', this.groupedUsers.length);
          console.log('📊 Stats globales:', this.statistiquesGlobales);
        } else {
          this.error = response.message || 'Erreur lors du chargement';
        }
      },
      error: (error) => {
        console.error('🚨 Erreur:', error);
        this.error = 'Impossible de charger les données';
        this.groupedUsers = [];
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Service de paiements
   */
  private async effectuerPaiement(paymentData: PaymentData): Promise<PaymentCreationResponse> {
    try {
      const response = await this.payementsService.createPaiement(paymentData).toPromise();
      if (!response) {
        throw new Error('Réponse de l\'API non définie');
      }
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'appel API:', error);
      throw error;
    }
  }

  private validatePaymentData(paymentData: PaymentData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!paymentData.id_souscription || paymentData.id_souscription <= 0) {
      errors.push('ID de souscription invalide');
    }

    if (!paymentData.mode_paiement || paymentData.mode_paiement.trim() === '') {
      errors.push('Mode de paiement requis');
    }

    if (!paymentData.montant_paye || paymentData.montant_paye <= 0) {
      errors.push('Montant de paiement invalide');
    }

    if (!paymentData.date_paiement_effectif) {
      errors.push('Date de paiement requise');
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const paymentDate = new Date(paymentData.date_paiement_effectif);
      
      if (paymentDate > today) {
        errors.push('La date de paiement ne peut pas être dans le futur');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Voir les détails d'une souscription
   */
  viewDetails(souscriptionId: number): void {
    console.log('🔍 Ouverture modal pour ID:', souscriptionId);

    // Trouver la souscription dans tous les groupedUsers
    let souscription: ApiSouscription | undefined;
    for (const user of this.groupedUsers) {
      souscription = user.souscriptions.find(s => s.id_souscription === souscriptionId);
      if (souscription) break;
    }

    if (!souscription) {
      console.error('❌ Souscription non trouvée:', souscriptionId);
      return;
    }

    const subscriptionForModal: Subscription = this.convertToSubscriptionFormat(souscription);
    this.showModal(subscriptionForModal);
  }

  /**
   * Convertir ApiSouscription vers le format Subscription
   */
  private convertToSubscriptionFormat(apiSouscription: ApiSouscription): Subscription {
    let statut: 'en-cours' | 'en-retard' | 'termine' = 'en-cours';
    const statusDisplay = this.getStatusDisplay(apiSouscription);

    switch (statusDisplay.status.toLowerCase()) {
      case 'termine':
      case 'terminé':
        statut = 'termine';
        break;
      case 'en_retard':
        statut = 'en-retard';
        break;
      default:
        statut = 'en-cours';
        break;
    }

    const paymentsWithOriginalDate = (apiSouscription.planpaiements || [])
      .filter(plan => {
        const montantPaye = this.souscriptionService.parseAmount(plan.montant_paye);
        return montantPaye > 0 && plan.date_paiement_effectif;
      })
      .map(plan => {
        const montantPaye = this.souscriptionService.parseAmount(plan.montant_paye);
        return {
          date: plan.date_paiement_effectif,
          dateFormatted: this.formatDate(plan.date_paiement_effectif),
          amount: montantPaye,
          numero_mensualite: plan.numero_mensualite,
          mode_paiement: plan.mode_paiement || 'Non spécifié',
          reference_paiement: plan.reference_paiement,
          statut_versement: plan.statut_versement || 'validé'
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

    const payments: Payment[] = paymentsWithOriginalDate.map(payment => ({
      date: payment.dateFormatted || 'Date non disponible',
      amount: payment.amount,
      numero_mensualite: payment.numero_mensualite,
      mode_paiement: payment.mode_paiement,
      reference_paiement: payment.reference_paiement,
      statut_versement: payment.statut_versement
    }));

    return {
      id: apiSouscription.id_souscription.toString(),
      terrain: apiSouscription.terrain?.libelle || 'Terrain non défini',
      surface: apiSouscription.terrain?.superficie || '0m²',
      prixTotal: apiSouscription.prix_total_terrain || 0,
      montantPaye: this.souscriptionService.parseAmount(apiSouscription.montant_paye),
      resteAPayer: apiSouscription.reste_a_payer || 0,
      dateDebut: apiSouscription.date_souscription || new Date().toISOString(),
      prochainPaiement: apiSouscription.date_prochain || '',
      statut,
      progression: this.getCompletionPercentage(apiSouscription),
      payments
    };
  }

  /**
   * Afficher le modal de détails
   */
  showModal(subscription: Subscription): void {
    this.lastFivePayments = subscription.payments.slice(0, 5);
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

  /**
   * Fermer le modal de détails
   */
  handleCancel(): void {
    this.isVisible = false;
    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
    this.lastFivePayments = [];
  }

  /**
   * Action OK du modal de détails
   */
  handleOk(): void {
    this.isVisible = false;
    this.lastFivePayments = [];

    if (this.selectedSubscriptionId) {
      const numericId = this.selectedSubscriptionId.replace('SUB', '').replace(/^0+/, '');
      this.router.navigate(['/dashboard/admin/details/paiement-details-admin', numericId]);
    }

    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
  }

  /**
   * Effectuer un paiement
   */
  makePayment(souscriptionId: number): void {
    let souscription: ApiSouscription | undefined;
    for (const user of this.groupedUsers) {
      souscription = user.souscriptions.find(s => s.id_souscription === souscriptionId);
      if (souscription) break;
    }
    
    if (!souscription) {
      this.message.error('Souscription non trouvée');
      return;
    }

    this.selectedSouscriptionForPayment = souscription;
    this.paymentForm = {
      id_souscription: souscriptionId,
      mode_paiement: '',
      montant_paye: 64400,
      date_paiement_effectif: new Date().toISOString().split('T')[0],
      reference_paiement: '',
      commentaire_paiement: ''
    };

    this.isPaymentModalVisible = true;
  }

  /**
   * Fermer le modal de paiement
   */
  handlePaymentModalCancel(): void {
    this.isPaymentModalVisible = false;
    this.selectedSouscriptionForPayment = null;
    this.resetPaymentForm();
  }

  /**
   * Soumettre le paiement
   */
  async submitPayment(): Promise<void> {
    if (!this.paymentForm.mode_paiement) {
      this.message.error('Mode de paiement requis');
      return;
    }

    if (!this.paymentForm.montant_paye || this.paymentForm.montant_paye <= 0) {
      this.message.error('Montant de paiement requis');
      return;
    }

    if (!this.paymentForm.date_paiement_effectif) {
      this.message.error('Date de paiement requise');
      return;
    }

    const validation = this.validatePaymentData(this.paymentForm);
    if (!validation.valid) {
      validation.errors.forEach(error => this.message.error(error));
      return;
    }

    const montantRestant = this.getMontantRestant(this.selectedSouscriptionForPayment!);
    if (this.paymentForm.montant_paye > montantRestant) {
      this.message.error(`Le montant ne peut pas dépasser le reste à payer (${this.formatCurrency(montantRestant)})`);
      return;
    }

    this.isProcessingPayment = true;

    try {
      const response: PaymentCreationResponse = await this.effectuerPaiement(this.paymentForm);
      
      if (response.success) {
        this.message.success('Paiement enregistré avec succès!');
        this.isPaymentModalVisible = false;
        this.resetPaymentForm();
        this.loadSouscriptionsGroupees();
      } else {
        this.message.error(response.message || 'Erreur lors de l\'enregistrement du paiement');
      }
    } catch (error: any) {
      this.message.error(error.message || 'Erreur lors de l\'enregistrement du paiement');
    } finally {
      this.isProcessingPayment = false;
    }
  }

  /**
   * Réinitialiser le formulaire de paiement
   */
  private resetPaymentForm(): void {
    this.paymentForm = {
      id_souscription: 0,
      mode_paiement: '',
      montant_paye: 0,
      date_paiement_effectif: '',
      reference_paiement: '',
      commentaire_paiement: ''
    };
  }

  /**
   * Pagination - Changer de page
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.filters.page = page;
    this.loadSouscriptionsGroupees();
  }

  /**
   * Changement de taille de page
   */
  onPageSizeChange(size: number): void {
    this.perPage = size;
    this.filters.per_page = size;
    this.currentPage = 1;
    this.filters.page = 1;
    this.loadSouscriptionsGroupees();
  }

  /**
   * Filtrage par statut
   */
  filterByStatus(statut: string): void {
    this.statusFilter = statut;
    this.filters.statut = statut === '' ? undefined : statut;
    this.currentPage = 1;
    this.filters.page = 1;
    this.loadSouscriptionsGroupees();
  }

  /**
   * Filtrage par période
   */
  filterByPeriod(dateDebut?: string, dateFin?: string): void {
    this.dateDebut = dateDebut || '';
    this.dateFin = dateFin || '';
    this.filters.date_debut = dateDebut;
    this.filters.date_fin = dateFin;
    this.currentPage = 1;
    this.filters.page = 1;
    this.loadSouscriptionsGroupees();
  }

  /**
   * Filtrage par superficie
   */
  filterBySuperficie(superficie?: number): void {
    this.surfaceFilter = superficie || '';
    this.filters.superficie = superficie;
    this.currentPage = 1;
    this.filters.page = 1;
    this.loadSouscriptionsGroupees();
  }

  /**
   * Recherche globale
   */
  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.filters.search = searchTerm;
    this.currentPage = 1;
    this.filters.page = 1;
    this.loadSouscriptionsGroupees();
  }

  /**
   * Rafraîchir les données
   */
  refresh(): void {
    console.log('🔄 ACTUALISATION');
    this.loadSouscriptionsGroupees();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filters = {
      page: 1,
      per_page: this.perPage
    };
    this.searchTerm = '';
    this.statusFilter = '';
    this.surfaceFilter = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.currentPage = 1;
    this.loadSouscriptionsGroupees();
  }

  /**
   * Méthodes utilitaires
   */
  getMontantRestant(souscription: ApiSouscription): number {
    return souscription.reste_a_payer || 0;
  }

  getTerrainName(souscription: ApiSouscription): string {
    return souscription.terrain?.libelle || 'Terrain non défini';
  }

  formatCurrency(amount: string | number): string {
    return this.souscriptionService.formatCurrency(amount);
  }

  getCompletionPercentage(souscription: ApiSouscription): number {
    return this.souscriptionService.calculateCompletionPercentage(souscription);
  }

  getStatusDisplay(souscription: ApiSouscription): { status: string; color: string; label: string } {
    // Utiliser statut_dynamique au lieu de statut_souscription
    const statut = (souscription as any).statut_dynamique || souscription.statut_souscription;
    
    switch(statut.toLowerCase()) {
      case 'terminee':
      case 'termine':
        return { status: statut, color: 'green', label: 'Terminé' };
      case 'en_retard':
        return { status: statut, color: 'red', label: 'En retard' };
      case 'en_cour':
      case 'en_cours':
        return { status: statut, color: 'blue', label: 'En cours' };
      case 'en_attente':
        return { status: statut, color: 'orange', label: 'En attente' };
      case 'active':
        return { status: statut, color: 'cyan', label: 'Active' };
      case 'suspendu':
      case 'supendu':
        return { status: statut, color: 'volcano', label: 'Suspendu' };
      case 'resilier':
        return { status: statut, color: 'default', label: 'Résilié' };
      default:
        return { status: statut, color: 'default', label: statut };
    }
  }

  getUserFullName(souscription: ApiSouscription): string {
    if (souscription.utilisateur) {
      return `${souscription.utilisateur.prenom} ${souscription.utilisateur.nom}`;
    }
    if (souscription.admin) {
      return `${souscription.admin.prenom} ${souscription.admin.nom}`;
    }
    return `Utilisateur ${souscription.id_utilisateur}`;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  trackByFn(index: number, item: UtilisateurAvecSouscriptions): number {
    return item.id_utilisateur;
  }

  AddNewSouscription(): void {
    this.router.navigate(['/dashboard/admin/details/create-souscription-admin']);
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.onSearch(this.searchTerm);
    }, 500);
  }

  onStatusFilterChange(): void {
    this.filterByStatus(this.statusFilter);
  }

  onSurfaceFilterChange(): void {
    const surface = this.surfaceFilter === '' ? undefined : Number(this.surfaceFilter);
    this.filterBySuperficie(surface);
  }

  getStatusColor(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'termine':
      case 'terminé':
        return 'green';
      case 'en-retard':
      case 'en_retard':
        return 'red';
      case 'en-cours':
      case 'en_cours':
        return 'blue';
      default:
        return 'default';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'termine':
      case 'terminé':
        return 'Terminé';
      case 'en-retard':
      case 'en_retard':
        return 'En retard';
      case 'en-cours':
      case 'en_cours':
        return 'En cours';
      default:
        return statut;
    }
  }

  formatAmount(amount: number): string {
    return this.formatCurrency(amount);
  }

  trackByPayment(index: number, payment: Payment): string {
    return `${payment.date}-${payment.amount}-${index}`;
  }

  formatPaymentMode(mode: string | undefined): string {
    if (!mode) return 'Non défini';
    return mode;
  }

  formatPaymentStatus(status: string): string {
    const statuses: { [key: string]: string } = {
      'paye_a_temps': 'Payé à temps',
      'paye_en_retard': 'Payé en retard',
      'paiement_partiel': 'Paiement partiel',
    };
    return statuses[status?.toLowerCase()] || status || 'Statut inconnu';
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
}