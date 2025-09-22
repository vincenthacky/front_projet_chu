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

import { Router } from '@angular/router';
import { PayementsService } from 'src/app/core/services/payements.service';
import { ApiSouscription, SouscriptionFilters, SouscriptionResponse } from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';
import { PaymentData, PaymentCreationResponse } from 'src/app/core/models/paiments';

// Interface pour les utilisateurs groupés
interface GroupedUser {
  id_utilisateur: number;
  fullName: string;
  email: string;
  initials: string;
  souscriptions: ApiSouscription[];
  totalAmount: number;
  totalInDelay: number;
}

// Interfaces pour le modal de détails - CORRIGÉE
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
  reference_paiement?: string | null; // CORRECTION : Permettre null
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
    NzDatePickerModule
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './admin-souscription.component.html',
  styleUrls: ['./admin-souscription.component.scss']
})
export class AdminSouscriptionComponent implements OnInit, OnDestroy {
  // Propriétés pour les données
  souscriptions: ApiSouscription[] = [];
  groupedUsers: GroupedUser[] = [];
  totalSouscriptions = 0;
  isLoading = false;
  error: string | null = null;

  // Propriétés pour la pagination
  currentPage = 1;
  perPage = 10;
  totalPages = 0;

  // Propriétés pour les filtres
  filters: SouscriptionFilters = {
    page: 1,
    per_page: 100
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
    this.loadSouscriptions();

    // Test avec des données mockées après 2 secondes (optionnel maintenant)
    setTimeout(() => {
      this.testWithMockData();
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * Service de paiements simple intégré
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
   * MÉTHODE CORRIGÉE POUR LE CHARGEMENT DES DONNÉES
   */
  loadSouscriptions(filters?: SouscriptionFilters): void {
    console.log('🔄 DÉBUT DU CHARGEMENT - Vérification des filtres API');
    this.isLoading = true;
    this.error = null;

    const searchFilters = {
      ...this.filters,
      ...filters,
      all_users: true,
      admin_view: true,
      per_page: 100
    };

    console.log('📤 Filtres envoyés à l\'API:', searchFilters);

    this.souscriptionService.getAllSouscriptions(searchFilters).subscribe({
      next: (response: SouscriptionResponse) => {
        console.log('📡 Réponse complète de l\'API:', response);

        if (response.success) {
          this.souscriptions = response.data;

          console.log('🔍 ANALYSE DES DONNÉES REÇUES:');
          console.log('- Nombre total de souscriptions:', this.souscriptions.length);

          const userIds = this.souscriptions.map(s => s.id_utilisateur);
          const uniqueUserIds = [...new Set(userIds)];
          console.log('- IDs utilisateurs dans les données:', userIds);
          console.log('- IDs utilisateurs uniques:', uniqueUserIds);
          console.log('- Nombre d\'utilisateurs uniques:', uniqueUserIds.length);

          if (uniqueUserIds.length === 1) {
            console.warn('⚠️ ATTENTION: L\'API ne retourne que les souscriptions d\'un seul utilisateur!');
            console.warn('C\'est normal si cet utilisateur a toutes les souscriptions dans la BDD');
          }

          this.totalSouscriptions = response.pagination.total;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.last_page;

          this.groupSouscriptionsByUser();
        } else {
          console.error('❌ Erreur API:', response.message);
          this.error = response.message || 'Erreur lors du chargement des souscriptions';
        }
      },
      error: (error) => {
        console.error('🚨 Erreur lors du chargement:', error);
        this.error = 'Impossible de charger les souscriptions. Veuillez réessayer.';
        this.souscriptions = [];
        this.groupedUsers = [];
      },
      complete: () => {
        this.isLoading = false;
        console.log('✅ Chargement terminé. Utilisateurs finaux:', this.groupedUsers.length);
      }
    });
  }

  /**
   * SOLUTION DE TEST: Créer une méthode de test avec des données mockées
   */
  testWithMockData(): void {
    console.log('🧪 TEST AVEC DONNÉES SIMULÉES');

    if (this.souscriptions.length === 0) {
      console.log('Aucune souscription existante, impossible de créer des données de test');
      return;
    }

    const userIds = this.souscriptions.map(s => s.id_utilisateur);
    const uniqueUserIds = [...new Set(userIds)];
    console.log('- Nouveaux IDs utilisateurs uniques:', uniqueUserIds);

    this.groupSouscriptionsByUser();
  }

  /**
   * MÉTHODE DE DÉBOGAGE AVANCÉ DE L'API
   */
  debugAPICall(): void {
    console.log('🔧 DÉBOGAGE AVANCÉ DE L\'API');

    const testParams = [
      {},
      { per_page: 100 },
      { all_users: true },
      { admin_view: true, per_page: 100 }
    ];

    testParams.forEach((params, index) => {
      console.log(`🧪 Test ${index + 1} avec paramètres:`, params);

      this.souscriptionService.getAllSouscriptions(params).subscribe({
        next: (response) => {
          const userIds = response.data.map((s: any) => s.id_utilisateur);
          const uniqueUserIds = [...new Set(userIds)];
          console.log(`✅ Test ${index + 1} - Utilisateurs uniques trouvés:`, uniqueUserIds);
          console.log(`📊 Test ${index + 1} - Nombre de souscriptions:`, response.data.length);
        },
        error: (error) => {
          console.error(`❌ Test ${index + 1} - Erreur:`, error);
        }
      });
    });
  }

  /**
   * MÉTHODE CORRIGÉE POUR GROUPER LES UTILISATEURS - AVEC PRIX_TOTAL_TERRAIN
   */
  private groupSouscriptionsByUser(): void {
    console.log('🔥 DÉBUT DU GROUPEMENT - Diagnostic complet');
    console.log('📊 Nombre de souscriptions reçues:', this.souscriptions.length);

    console.log('📋 ANALYSE DES SOUSCRIPTIONS:');
    this.souscriptions.forEach((souscription, index) => {
      console.log(`Souscription ${index + 1}:`, {
        id_souscription: souscription.id_souscription,
        id_utilisateur: souscription.id_utilisateur,
        id_admin: souscription.id_admin,
        utilisateur: souscription.utilisateur
          ? {
              nom: souscription.utilisateur.nom,
              prenom: souscription.utilisateur.prenom,
              email: souscription.utilisateur.email
            }
          : 'AUCUN UTILISATEUR',
        admin: souscription.admin
          ? {
              nom: souscription.admin.nom,
              prenom: souscription.admin.prenom,
              email: souscription.admin.email
            }
          : 'AUCUN ADMIN',
        // CORRECTION ICI : Afficher les deux montants pour comparaison
        prix_total_terrain: souscription.prix_total_terrain,
        montant_total_souscrit: souscription.montant_total_souscrit
      });
    });

    const idsUtilisateurs = this.souscriptions.map(s => s.id_utilisateur);
    const idsUniques = [...new Set(idsUtilisateurs)];
    console.log('🔍 IDs utilisateurs dans les souscriptions:', idsUtilisateurs);
    console.log('✨ IDs utilisateurs uniques:', idsUniques);
    console.log('📈 Nombre d\'utilisateurs uniques détectés:', idsUniques.length);

    if (idsUniques.length < 2) {
      console.warn('⚠️ ATTENTION: Moins de 2 utilisateurs uniques détectés!');
      console.warn('Vérifiez que vos données contiennent bien des id_utilisateur différents');
    }

    const userMap = new Map<number, GroupedUser>();

    this.souscriptions.forEach((souscription, index) => {
      const userId = souscription.id_utilisateur;

      console.log(`\n🔄 Traitement souscription ${index + 1} pour utilisateur ID: ${userId}`);

      if (!userMap.has(userId)) {
        console.log(`➕ Création d'un NOUVEAU groupe pour l'utilisateur ${userId}`);

        let fullName = 'Utilisateur Inconnu';
        let email = 'email@inconnu.com';
        let initials = 'UI';

        if (souscription.utilisateur) {
          fullName = `${souscription.utilisateur.prenom || ''} ${souscription.utilisateur.nom || ''}`.trim();
          email = souscription.utilisateur.email || 'email@inconnu.com';
          const prenomInit = souscription.utilisateur.prenom?.charAt(0) || '';
          const nomInit = souscription.utilisateur.nom?.charAt(0) || '';
          initials = (prenomInit + nomInit).toUpperCase() || 'UI';
        } else if (souscription.admin) {
          fullName = `${souscription.admin.prenom || ''} ${souscription.admin.nom || ''}`.trim();
          email = souscription.admin.email || 'email@inconnu.com';
          const prenomInit = souscription.admin.prenom?.charAt(0) || '';
          const nomInit = souscription.admin.nom?.charAt(0) || '';
          initials = (prenomInit + nomInit).toUpperCase() || 'UI';
        }

        const newUser: GroupedUser = {
          id_utilisateur: userId,
          fullName,
          email,
          initials,
          souscriptions: [],
          totalAmount: 0,
          totalInDelay: 0
        };

        userMap.set(userId, newUser);
        console.log(`✅ Utilisateur créé:`, {
          id: newUser.id_utilisateur,
          nom: newUser.fullName,
          email: newUser.email,
          initiales: newUser.initials
        });
      } else {
        console.log(`📝 Ajout à un groupe EXISTANT pour l'utilisateur ${userId}`);
      }

      const user = userMap.get(userId)!;
      user.souscriptions.push(souscription);
      
      // CORRECTION PRINCIPALE : Utiliser prix_total_terrain au lieu de montant_total_souscrit
      const prixTotalTerrain = souscription.prix_total_terrain || 0;
      user.totalAmount += prixTotalTerrain;

      if (this.isDatePassed(souscription.date_prochain)) {
        user.totalInDelay++;
      }

      console.log(`📊 Utilisateur ${userId} a maintenant ${user.souscriptions.length} souscription(s)`);
      console.log(`💰 Prix total terrain ajouté: ${prixTotalTerrain}, nouveau total: ${user.totalAmount}`);
    });

    this.groupedUsers = Array.from(userMap.values());

    console.log('\n🎯 RÉSULTAT FINAL DU GROUPEMENT:');
    console.log('👥 Nombre d\'utilisateurs groupés:', this.groupedUsers.length);

    this.groupedUsers.forEach((user, index) => {
      console.log(`Utilisateur ${index + 1}:`, {
        id_utilisateur: user.id_utilisateur,
        fullName: user.fullName,
        email: user.email,
        initials: user.initials,
        nombreSouscriptions: user.souscriptions.length,
        montantTotal: user.totalAmount, // Maintenant basé sur prix_total_terrain
        enRetard: user.totalInDelay
      });
    });

    if (this.groupedUsers.length === 0) {
      console.error('🚨 ERREUR CRITIQUE: Aucun utilisateur groupé !');
      console.error('Vérifiez que this.souscriptions contient des données valides');
    } else if (this.groupedUsers.length === 1) {
      console.log('ℹ️ INFO: Un seul utilisateur groupé détecté');
      console.log('Ceci est normal si toutes les souscriptions appartiennent au même utilisateur');
    } else {
      console.log('✅ SUCCÈS: Plusieurs utilisateurs groupés correctement');
    }

    console.log('🔥 FIN DU GROUPEMENT\n');
  }

  /**
   * Voir les détails d'une souscription
   */
  viewDetails(souscriptionId: number): void {
    console.log('🔍 Ouverture modal pour ID:', souscriptionId);

    const souscription = this.souscriptions.find(s => s.id_souscription === souscriptionId);

    if (!souscription) {
      console.error('❌ Souscription non trouvée:', souscriptionId);
      return;
    }

    const subscriptionForModal: Subscription = this.convertToSubscriptionFormat(souscription);
    this.showModal(subscriptionForModal);
  }

  /**
   * Convertir ApiSouscription vers le format Subscription - CORRIGÉ POUR TRI DÉCROISSANT
   */
  private convertToSubscriptionFormat(apiSouscription: ApiSouscription): Subscription {
    console.log('🔄 Conversion de ApiSouscription vers Subscription:', apiSouscription);

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

    // CORRECTION : Récupérer et trier les paiements par date décroissante (plus récent en premier)
    // D'abord, mapper avec les dates originales pour le tri précis
    const paymentsWithOriginalDate: { date: string; dateFormatted: string; amount: number; numero_mensualite?: number; mode_paiement?: string; reference_paiement?: string | null; statut_versement?: string; }[] = (apiSouscription.planpaiements || [])
      .filter(plan => {
        const montantPaye = this.souscriptionService.parseAmount(plan.montant_paye);
        return montantPaye > 0 && plan.date_paiement_effectif;
      })
      .map(plan => {
        const montantPaye = this.souscriptionService.parseAmount(plan.montant_paye);
        return {
          date: plan.date_paiement_effectif, // Date ISO originale pour tri précis
          dateFormatted: this.formatDate(plan.date_paiement_effectif), // Date formatée pour affichage
          amount: montantPaye,
          numero_mensualite: plan.numero_mensualite,
          mode_paiement: plan.mode_paiement || 'Non spécifié',
          reference_paiement: plan.reference_paiement,
          statut_versement: plan.statut_versement || 'validé'
        };
      })
      // TRI PAR DATE DÉCROISSANTE : plus récent (date plus grande) en premier
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        // Si dateB > dateA, retourne négatif pour placer b avant a (décroissant)
        return dateB.getTime() - dateA.getTime();
      });

    // Mapper vers le format final avec date formatée (ordre préservé)
    const payments: Payment[] = paymentsWithOriginalDate.map(payment => ({
      date: payment.dateFormatted || 'Date non disponible',
      amount: payment.amount,
      numero_mensualite: payment.numero_mensualite,
      mode_paiement: payment.mode_paiement,
      reference_paiement: payment.reference_paiement,
      statut_versement: payment.statut_versement
    }));

    console.log('💳 Paiements triés par date décroissante (plus récent en premier):', payments);

    const subscription: Subscription = {
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

    console.log('✅ Subscription convertie avec paiements triés:', subscription);
    return subscription;
  }

  /**
   * Afficher le modal de détails - CORRIGÉ POUR ORDRE DÉCROISSANT
   */
  showModal(subscription: Subscription): void {
    console.log('🔍 Ouverture modal pour:', subscription.id);
    console.log('💳 Paiements triés par date décroissante:', subscription.payments);

    if (subscription.payments && Array.isArray(subscription.payments)) {
      // Les paiements sont déjà triés par date décroissante dans convertToSubscriptionFormat
      // On prend les 5 premiers (les plus récents)
      this.lastFivePayments = subscription.payments.slice(0, 5);

      console.log('📋 5 derniers paiements (ordre décroissant - plus récent en premier):', this.lastFivePayments);
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

  /**
   * Fermer le modal de détails
   */
  handleCancel(): void {
    console.log('❌ Fermeture du modal');
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
      console.log('🔗 Navigation vers détails paiement admin:', numericId);

      this.router.navigate(['/dashboard/admin/details/paiement-details-admin', numericId]);
    }

    this.selectedSubscriptionId = null;
    this.selectedSubscriptionInfo = null;
  }

  /**
   * Effectuer un paiement - Ouvre le modal
   */
  makePayment(souscriptionId: number): void {
    console.log('Ouverture modal de paiement pour la souscription:', souscriptionId);
    
    // Trouver la souscription dans les données
    const souscription = this.souscriptions.find(s => s.id_souscription === souscriptionId);
    
    if (!souscription) {
      console.error('Souscription non trouvée:', souscriptionId);
      this.message.error('Souscription non trouvée');
      return;
    }

    // Préparer le formulaire avec l'ID de la souscription
    this.selectedSouscriptionForPayment = souscription;
    this.paymentForm = {
      id_souscription: souscriptionId,
      mode_paiement: '',
      montant_paye: 0,
      date_paiement_effectif: new Date().toISOString().split('T')[0], // Date d'aujourd'hui par défaut
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
    // Validation des champs requis
    if (!this.paymentForm.mode_paiement) {
      this.message.error('Mode de paiement requis');
      return;
    }

    if (!this.paymentForm.montant_paye || this.paymentForm.montant_paye <= 0) {
      this.message.error('Montant de paiement requis et doit être supérieur à 0');
      return;
    }

    if (!this.paymentForm.date_paiement_effectif) {
      this.message.error('Date de paiement requise');
      return;
    }

    // Validation supplémentaire
    const validation = this.validatePaymentData(this.paymentForm);
    if (!validation.valid) {
      validation.errors.forEach(error => this.message.error(error));
      return;
    }

    // Vérifier que le montant ne dépasse pas le reste à payer
    const montantRestant = this.getMontantRestant(this.selectedSouscriptionForPayment!);
    if (this.paymentForm.montant_paye > montantRestant) {
      this.message.error(`Le montant ne peut pas dépasser le reste à payer (${this.formatCurrency(montantRestant)})`);
      return;
    }

    console.log('Soumission du paiement:', this.paymentForm);
    this.isProcessingPayment = true;

    try {
      // Appel à l'API pour effectuer le paiement
      const response: PaymentCreationResponse = await this.effectuerPaiement(this.paymentForm);
      
      console.log('Paiement effectué avec succès:', response);
      
      if (response.success) {
        this.message.success('Paiement enregistré avec succès!');
        
        // Fermer le modal
        this.isPaymentModalVisible = false;
        this.resetPaymentForm();
        
        // Actualiser les données
        this.loadSouscriptions();
      } else {
        this.message.error(response.message || 'Erreur lors de l\'enregistrement du paiement');
      }
    } catch (error: any) {
      console.error('Erreur lors du paiement:', error);
      
      let errorMessage = 'Erreur lors de l\'enregistrement du paiement';
      if (error.message) {
        errorMessage = error.message;
      }
      
      this.message.error(errorMessage);
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
   * Obtenir le montant restant à payer pour une souscription
   */
  getMontantRestant(souscription: ApiSouscription): number {
    return souscription.reste_a_payer || 0;
  }

  /**
   * Obtenir le nom du terrain pour une souscription
   */
  getTerrainName(souscription: ApiSouscription): string {
    return souscription.terrain?.libelle || 'Terrain non défini';
  }

  /**
   * Pagination - Changer de page
   */
  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadSouscriptions();
  }

  /**
   * Changement de taille de page
   */
  onPageSizeChange(size: number): void {
    this.perPage = size;
    this.filters.per_page = size;
    this.filters.page = 1;
    this.loadSouscriptions();
  }

  /**
   * Filtrage par statut
   */
  filterByStatus(statut: string): void {
    this.filters.statut = statut === '' ? undefined : statut;
    this.filters.page = 1;
    this.loadSouscriptions();
    console.log('Filtre statut appliqué:', statut);
  }

  /**
   * Filtrage par période
   */
  filterByPeriod(dateDebut?: string, dateFin?: string): void {
    this.filters.date_debut = dateDebut;
    this.filters.date_fin = dateFin;
    this.filters.page = 1;
    this.loadSouscriptions();
  }

  /**
   * Filtrage par superficie
   */
  filterBySuperficie(superficie?: number): void {
    this.filters.superficie = superficie;
    this.filters.page = 1;
    this.loadSouscriptions();
    console.log('Filtre superficie appliqué:', superficie);
  }

  /**
   * Recherche globale
   */
  onSearch(searchTerm: string): void {
    this.filters.search = searchTerm;
    this.filters.page = 1;
    this.loadSouscriptions();
    console.log('Recherche appliquée:', searchTerm);
  }

  /**
   * Rafraîchir les données
   */
  refresh(): void {
    this.loadSouscriptions();
    console.log('Actualisation des données...');
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filters = {
      page: 1,
      per_page: 100
    };
    this.searchTerm = '';
    this.statusFilter = '';
    this.surfaceFilter = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.loadSouscriptions();
  }

  /**
   * Formater le montant
   */
  formatCurrency(amount: string | number): string {
    return this.souscriptionService.formatCurrency(amount);
  }

  /**
   * Calculer le pourcentage de completion
   */
  getCompletionPercentage(souscription: ApiSouscription): number {
    return this.souscriptionService.calculateCompletionPercentage(souscription);
  }

  /**
   * Obtenir le statut avec couleur
   */
  getStatusDisplay(souscription: ApiSouscription): { status: string; color: string; label: string } {
    const calculatedStatus = this.souscriptionService.calculateSouscriptionStatus(souscription);
    const apiStatus = souscription.statut_souscription;

    let finalStatus = calculatedStatus || apiStatus || 'en_attente';

    if (!finalStatus || typeof finalStatus !== 'string') {
      finalStatus = 'en_attente';
    }

    const statusLowerCase = finalStatus.toLowerCase();

    switch (statusLowerCase) {
      case 'termine':
      case 'terminé':
        return { status: finalStatus, color: 'green', label: 'Terminé' };
      case 'en_retard':
        return { status: finalStatus, color: 'red', label: 'En retard' };
      case 'en_cours':
        return { status: finalStatus, color: 'blue', label: 'En cours' };
      case 'suspendu':
        return { status: finalStatus, color: 'orange', label: 'Suspendu' };
      case 'annule':
      case 'annulé':
        return { status: finalStatus, color: 'default', label: 'Annulé' };
      case 'en_attente':
        return { status: finalStatus, color: 'cyan', label: 'En attente' };
      default:
        return { status: finalStatus, color: 'default', label: finalStatus || 'Non défini' };
    }
  }

  /**
   * Exporter les données
   */
  exportData(format: 'pdf' | 'excel'): void {
    this.souscriptionService.exporterSouscriptions(format, this.filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `souscriptions.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur export:', error);
      }
    });
  }

  /**
   * Calculer le montant total de toutes les souscriptions - CORRIGÉ
   * Utilise maintenant prix_total_terrain au lieu de montant_total_souscrit
   */
  calculateTotalAmount(): number {
    return this.souscriptions.reduce((total, souscription) => {
      // CORRECTION : Utiliser prix_total_terrain au lieu de parseAmount(montant_total_souscrit)
      const prixTotalTerrain = souscription.prix_total_terrain || 0;
      return total + prixTotalTerrain;
    }, 0);
  }

  /**
   * Calculer le montant total payé - MAINTENU TEL QUEL
   * Cette méthode reste correcte car elle utilise bien montant_paye
   */
  calculateTotalPaid(): number {
    return this.souscriptions.reduce((total, souscription) => {
      const montantPaye = this.souscriptionService.parseAmount(souscription.montant_paye);
      return total + montantPaye;
    }, 0);
  }

  /**
   * Calculer le montant total restant - MAINTENU TEL QUEL
   * Cette méthode reste correcte car elle utilise bien reste_a_payer
   */
  calculateTotalRemaining(): number {
    return this.souscriptions.reduce((total, souscription) => {
      const resteAPayer = souscription.reste_a_payer || 0;
      return total + resteAPayer;
    }, 0);
  }

  /**
   * Obtenir le nom complet de l'utilisateur
   */
  getUserFullName(souscription: ApiSouscription): string {
    if (souscription.utilisateur) {
      return `${souscription.utilisateur.prenom} ${souscription.utilisateur.nom}`;
    }
    if (souscription.admin) {
      return `${souscription.admin.prenom} ${souscription.admin.nom}`;
    }
    return `Utilisateur ${souscription.id_utilisateur}`;
  }

  /**
   * Obtenir les initiales de l'utilisateur
   */
  getUserInitials(souscription: ApiSouscription): string {
    if (souscription.utilisateur) {
      const prenom = souscription.utilisateur.prenom?.charAt(0) || '';
      const nom = souscription.utilisateur.nom?.charAt(0) || '';
      return (prenom + nom).toUpperCase();
    }
    if (souscription.admin) {
      const prenom = souscription.admin.prenom?.charAt(0) || '';
      const nom = souscription.admin.nom?.charAt(0) || '';
      return (prenom + nom).toUpperCase();
    }
    return `U${souscription.id_utilisateur.toString().slice(-1)}`;
  }

  /**
   * Formater une date
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Non définie';

    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Vérifier si une date est passée
   */
  isDatePassed(dateString: string | null): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Vérifier si une date est urgente
   */
  isDateUrgent(dateString: string | null): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }

  /**
   * TrackBy function pour optimiser les performances
   */
  trackByFn(index: number, item: GroupedUser): number {
    return item.id_utilisateur;
  }

  /**
   * Modifier une souscription
   */
  editSouscription(souscription: ApiSouscription): void {
    console.log('Modifier souscription:', souscription);
  }

  /**
   * Voir le plan de paiement
   */
  viewPaymentPlan(souscriptionId: number): void {
    console.log('Plan de paiement pour:', souscriptionId);
  }

  /**
   * Ajouter une nouvelle souscription
   */
  AddNewSouscription(): void {
    this.router.navigate(['/dashboard/admin/details/create-souscription-admin']);
  }

  /**
   * Gestionnaire de changement de terme de recherche avec debounce
   */
  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.onSearch(this.searchTerm);
    }, 500);
  }

  /**
   * Gestionnaire de changement de filtre de statut
   */
  onStatusFilterChange(): void {
    this.filterByStatus(this.statusFilter);
  }

  /**
   * Gestionnaire de changement de filtre de surface
   */
  onSurfaceFilterChange(): void {
    const surface = this.surfaceFilter === '' ? undefined : Number(this.surfaceFilter);
    this.filterBySuperficie(surface);
  }

  /**
   * Méthodes pour le modal
   */
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

  formatPaymentStatus(statut: string | undefined): string {
    if (!statut) return 'Non défini';
    switch (statut.toLowerCase()) {
      case 'validé':
      case 'valide': // Ajout pour compatibilité sans accent
        return 'Validé';
      case 'en_attente':
        return 'En attente';
      case 'rejeté':
      case 'rejete': // Ajout pour compatibilité sans accent
        return 'Rejeté';
      default:
        return statut;
    }
  }

  getPaymentStatusColor(statut: string | undefined): string {
    if (!statut) return 'default';
    switch (statut.toLowerCase()) {
      case 'validé':
      case 'valide': // Ajout pour compatibilité sans accent
        return 'green';
      case 'en_attente':
        return 'orange';
      case 'rejeté':
      case 'rejete': // Ajout pour compatibilité sans accent
        return 'red';
      default:
        return 'default';
    }
  }
}