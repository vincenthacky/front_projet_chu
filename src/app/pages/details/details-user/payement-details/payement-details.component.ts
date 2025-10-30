import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SouscriptionSingleResponse, ApiSouscription } from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

// ✅ Réutiliser les interfaces existantes du service
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

@Component({
  selector: 'app-payement-details',
  standalone: true,
  imports: [CommonModule, NzEmptyModule, NzSpinModule, NzPaginationModule],
  templateUrl: './payement-details.component.html',
  styleUrls: ['./payement-details.component.css']
})
export class PayementDetailsComponent implements OnInit {
  
  subscription: Subscription | null = null;
  apiData: ApiSouscription | null = null; // Exposer les données API brutes
  loading = false;
  subscriptionId: string | null = null;

  // Pagination variables
  currentPage: number = 1;
  pageSize: number = 5;
  totalPayments: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private souscriptionService: SouscriptionService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Initialisation du composant PaymentDetails');
    
    // Récupérer l'ID depuis les paramètres de route
    this.route.params.subscribe(params => {
      this.subscriptionId = params['id'];
      console.log('📋 ID de souscription reçu:', this.subscriptionId);
      
      if (this.subscriptionId) {
        this.loadSubscriptionDetails();
      } else {
        console.error('❌ Aucun ID de souscription fourni');
        this.router.navigate(['/dashboard/user/subscriptions']);
      }
    });
  }

  // ✅ Méthode principale utilisant le service existant
  loadSubscriptionDetails(): void {
    if (!this.subscriptionId) return;
    
    console.log('🔍 === CHARGEMENT DÉTAILS SOUSCRIPTION ===');
    console.log('📋 ID:', this.subscriptionId);
    
    this.loading = true;
    
    // Convertir l'ID string en number pour l'API
    const numericId = parseInt(this.subscriptionId, 10);
    
    // ✅ Utiliser la méthode existante du service
    this.souscriptionService.getSouscriptionById(numericId).subscribe({
      next: (response: SouscriptionSingleResponse) => {
        console.log('📥 Réponse API détails:', response);
        
        if (response.success && response.data) {
          // Stocker les données API brutes
          this.apiData = response.data;
          // Mapper les données vers notre interface locale
          this.subscription = this.mapApiDataToSubscription(response.data);
          console.log('✅ Souscription mappée:', this.subscription);
          console.log('📊 Progression calculée:', this.subscription.progression + '%');
          // Mise à jour de la pagination
          this.totalPayments = this.getValidPayments().length;
          this.currentPage = 1; // Réinitialiser à la première page
        } else {
          console.error('❌ Réponse API invalide:', response);
          this.router.navigate(['/dashboard/user/subscriptions']);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des détails:', error);
        this.loading = false;
        this.router.navigate(['/dashboard/user/subscriptions']);
      }
    });
  }

  // ✅ Méthode pour calculer le pourcentage de progression (CORRIGÉE)
  calculateProgressPercentage(prixTotal: number, montantPaye: number): number {
    console.log('🔢 === CALCUL PROGRESSION ===');
    console.log('   Prix total (montant_total_souscrit):', prixTotal);
    console.log('   Montant payé:', montantPaye);
    
    // Vérifications de sécurité
    if (!prixTotal || prixTotal <= 0) {
      console.warn('⚠️ Prix total invalide:', prixTotal);
      return 0;
    }
    
    if (!montantPaye || montantPaye < 0) {
      console.warn('⚠️ Montant payé invalide:', montantPaye);
      return 0;
    }
    
    // Calcul du pourcentage
    const percentage = (montantPaye / prixTotal) * 100;
    const roundedPercentage = Math.min(Math.round(percentage * 100) / 100, 100); // Arrondi à 2 décimales, max 100%
    
    console.log('   Pourcentage brut:', percentage.toFixed(2) + '%');
    console.log('   Pourcentage final:', roundedPercentage + '%');
    
    return roundedPercentage;
  }

  // ✅ Mapping CORRIGÉ - Utiliser montant_total_souscrit au lieu de prix_total_terrain
  private mapApiDataToSubscription(apiData: ApiSouscription): Subscription {
    console.log('🗺️ === DÉBUT MAPPING SOUSCRIPTION ===');
    
    // ✅ CORRECTION : Utiliser montant_total_souscrit comme prix total
    const prixTotalRaw = apiData.montant_total_souscrit; // CHANGEMENT ICI
    const montantPayeRaw = apiData.montant_paye;
    
    // Parser les montants avec conversion en number
    const prixTotal = parseFloat(this.parseAmountSafely(prixTotalRaw).toString());
    const montantPaye = parseFloat(this.parseAmountSafely(montantPayeRaw).toString());
    
    // ✅ CORRECTION : Calculer le reste à payer = montant_total_souscrit - montant_paye
    const resteAPayer = Math.max(0, prixTotal - montantPaye); // CHANGEMENT ICI
    
    console.log('💰 === MONTANTS EXTRAITS ET PARSES (CORRIGÉS) ===');
    console.log('   Prix total (montant_total_souscrit) - Brut:', prixTotalRaw, '→ Parsé:', prixTotal);
    console.log('   Montant payé - Brut:', montantPayeRaw, '→ Parsé:', montantPaye);
    console.log('   Reste à payer - Calculé:', resteAPayer, '(= prixTotal - montantPaye)');
    console.log('   Reste API (ignoré):', apiData.reste_a_payer);
    
    // ✅ CALCUL DE PROGRESSION CORRIGÉ - Utiliser montant_total_souscrit
    const progression = this.calculateProgressPercentage(prixTotal, montantPaye);
    
    // Vérification de cohérence
    console.log('🔍 Vérification cohérence:', {
      prixTotal,
      montantPaye,
      resteCalcule: resteAPayer,
      progression: progression + '%',
      coherent: (prixTotal === montantPaye + resteAPayer)
    });
    
    // ✅ Utiliser la méthode du service pour déterminer le statut
    let statut: 'en-cours' | 'en-retard' | 'termine' = 'en-cours';
    try {
      const statusInfo = this.souscriptionService.getStatusWithColor(apiData);
      statut = this.mapApiStatusToLocal(statusInfo.status);
      console.log('📋 Statut déterminé:', statut);
    } catch (error) {
      console.warn('⚠️ Erreur lors du calcul du statut, utilisation du statut par défaut:', error);
      // Statut par défaut basé sur le reste à payer
      statut = resteAPayer <= 0 ? 'termine' : 'en-cours';
    }
    
    // ✅ Mapper les paiements avec gestion d'erreurs
    const allPayments: Payment[] = this.mapPaymentsSafely(apiData.planpaiements || []);
    
    console.log(`💳 === PAIEMENTS MAPPÉS ===`);
    console.log(`   Nombre de plans API: ${apiData.planpaiements?.length || 0}`);
    console.log(`   Nombre de paiements valides: ${allPayments.length}`);
    
    // Vérification somme des paiements
    const sommePaiements = allPayments.reduce((sum, p) => sum + p.amount, 0);
    console.log('💰 Somme des paiements mappés:', sommePaiements);
    console.log('   Correspond au montant total API:', Math.abs(sommePaiements - montantPaye) < 1);

    // Prochain paiement
    let prochainPaiement = 'N/A';
    if (apiData.date_prochain) {
      prochainPaiement = this.formatDateForPayment(apiData.date_prochain);
    } else if (resteAPayer > 0) {
      const dateDebut = new Date(apiData.date_souscription);
      dateDebut.setMonth(dateDebut.getMonth() + 1);
      prochainPaiement = this.formatDateForPayment(dateDebut.toISOString().split('T')[0]);
    }

    const result: Subscription = {
      id: `SUB${apiData.id_souscription?.toString().padStart(3, '0') || '000'}`,
      terrain: apiData.terrain?.libelle || 'Terrain non spécifié',
      surface: apiData.terrain?.superficie?.toString() || 'N/A',
      prixTotal,        // montant_total_souscrit
      montantPaye,      // montant_paye
      resteAPayer,      // montant_total_souscrit - montant_paye
      dateDebut: this.formatDateForPayment(apiData.date_souscription),
      prochainPaiement,
      statut,
      progression,
      payments: allPayments
    };

    console.log('✅ === RÉSULTAT MAPPING FINAL ===');
    console.log('📊 Données finales:', {
      id: result.id,
      terrain: result.terrain,
      prixTotal: `${this.formatNumber(result.prixTotal)} (raw: ${result.prixTotal})`,
      montantPaye: `${this.formatNumber(result.montantPaye)} (raw: ${result.montantPaye})`,
      resteAPayer: `${this.formatNumber(result.resteAPayer)} (raw: ${result.resteAPayer})`,
      progression: `${result.progression}% (raw: ${result.progression})`,
      statut: result.statut,
      dateDebut: result.dateDebut,
      prochainPaiement: result.prochainPaiement
    });

    return result;
  }

  // ✅ Parser sécurisé des montants (INCHANGÉ)
  private parseAmountSafely(amount: any): number {
    if (amount === null || amount === undefined) {
      console.warn('⚠️ Montant null/undefined, retourne 0');
      return 0;
    }
    
    if (typeof amount === 'number') {
      console.log(`💰 Montant déjà number: ${amount}`);
      return amount;
    }
    
    if (typeof amount === 'string') {
      const parsed = this.souscriptionService.parseAmount(amount);
      console.log(`💰 Montant string "${amount}" → parsé: ${parsed}`);
      return parsed;
    }
    
    // Fallback pour les autres types
    try {
      const parsed = this.souscriptionService.parseAmount(amount.toString());
      console.log(`💰 Montant autre type "${amount}" → parsé: ${parsed}`);
      return parsed;
    } catch (error) {
      console.error('❌ Erreur parsing montant:', amount, error);
      return 0;
    }
  }

  // ✅ Mapping sécurisé des paiements (INCHANGÉ)
  private mapPaymentsSafely(planpaiements: any[]): Payment[] {
    if (!Array.isArray(planpaiements)) {
      console.warn('⚠️ planpaiements n\'est pas un tableau:', planpaiements);
      return [];
    }

    if (planpaiements.length === 0) {
      console.log('ℹ️ Aucun plan de paiement trouvé');
      return [];
    }

    const payments: Payment[] = planpaiements
      .filter((plan, index) => {
        const isValid = plan && 
                        typeof plan.numero_mensualite === 'number' && 
                        plan.numero_mensualite > 0 &&
                        (plan.montant_paye || plan.montant_paye === 0);
        
        if (!isValid) {
          console.warn(`⚠️ Plan ${index + 1} ignoré - données invalides:`, {
            numero_mensualite: plan?.numero_mensualite,
            montant_paye: plan?.montant_paye
          });
        }
        
        return isValid;
      })
      .map((plan, index) => {
        const amount = this.parseAmountSafely(plan.montant_paye);
        const payment: Payment = {
          date: this.formatDateForPayment(plan.date_paiement_effectif || plan.date_paiement || ''),
          amount,
          numero_mensualite: plan.numero_mensualite,
          mode_paiement: plan.mode_paiement || 'Non spécifié',
          reference_paiement: plan.reference_paiement || undefined,
          statut_versement: plan.statut_versement || 'non_effectue'
        };
        
        if (index < 3) { // Log des 3 premiers pour debug
          console.log(`💳 Paiement ${index + 1}:`, {
            numero: payment.numero_mensualite,
            amount: amount,
            date: payment.date,
            mode: payment.mode_paiement,
            statut: payment.statut_versement
          });
        }
        
        return payment;
      })
      .sort((a, b) => b.numero_mensualite - a.numero_mensualite); // Ordre décroissant

    console.log(`💳 Mapping terminé: ${planpaiements.length} plans → ${payments.length} paiements valides`);
    return payments;
  }

  // ✅ Mapper le statut API vers notre enum local (INCHANGÉ)
  private mapApiStatusToLocal(apiStatus: string): 'en-cours' | 'en-retard' | 'termine' {
    if (!apiStatus) {
      console.warn('⚠️ Statut API vide, utilisation du statut par défaut');
      return 'en-cours';
    }
    
    switch(apiStatus.toLowerCase()) {
      case 'termine':
      case 'terminé':
        return 'termine';
      case 'en_retard':
      case 'en-retard':
      case 'retard':
        return 'en-retard';
      case 'en_cours':
      case 'en-cours':
      case 'actif':
      case 'active':
      case 'activée':
        return 'en-cours';
      default:
        console.warn(`⚠️ Statut de souscription inconnu: "${apiStatus}", utilisation "en-cours"`);
        return 'en-cours';
    }
  }

  // ✅ Formatage des dates (INCHANGÉ)
  private formatDateForPayment(dateString: string): string {
    if (!dateString) {
      console.warn('⚠️ Date vide pour formatage');
      return 'Date non disponible';
    }
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Date invalide:', dateString);
        return 'Date invalide';
      }
      
      const formatted = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      console.log(`📅 Date formatée: "${dateString}" → "${formatted}"`);
      return formatted;
    } catch (error) {
      console.error('❌ Erreur lors du formatage de la date:', error, dateString);
      return 'Date non disponible';
    }
  }

  // ✅ Méthodes utilitaires pour le template (INCHANGÉES)

  // Formater les montants (utilise la méthode du service)
  formatNumber(amount: number): string {
    if (amount === null || amount === undefined || (!amount && amount !== 0)) {
      return '0 FCFA';
    }
    return this.souscriptionService.formatCurrency(amount);
  }

  // Couleur du montant payé
  getMontantPayeColor(): string {
    return '#10b981'; // Vert pour montant payé
  }

  // Couleur du reste à payer
  getResteAPayerColor(): string {
    if (!this.subscription) return '#6b7280';
    const reste = this.subscription.resteAPayer ?? 0;
    return reste > 0 ? '#f59e0b' : '#10b981';
  }

  // Tracking pour les listes Angular
  trackByPayment(index: number, payment: Payment): string {
    return `${payment.numero_mensualite}-${payment.date}-${payment.amount}`;
  }

  // Navigation de retour
  goBack(): void {
    console.log('🔙 Retour vers les souscriptions');
    this.router.navigate(['/dashboard/admin/details/souscription-admin']);
  }

  // Rafraîchir les données
  refresh(): void {
    console.log('🔄 Actualisation des détails');
    if (this.subscriptionId) {
      this.loadSubscriptionDetails();
    }
  }

  // Exposer la méthode de debug pour la console
  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      (window as any).debugPaymentDetails = () => this.debugSubscriptionData();
      console.log('🛠️ Méthode de debug disponible: debugPaymentDetails()');
      console.log('💡 Pour tester: Ouvrez la console et tapez debugPaymentDetails()');
    }
  }

  // ✅ Méthodes utilitaires pour l'affichage des paiements

  // Obtenir les paiements valides depuis les données API
  getValidPayments(): any[] {
    if (!this.apiData?.planpaiements) {
      return [];
    }
    
    return this.apiData.planpaiements.filter(plan => 
      plan && 
      plan.est_paye === true && 
      plan.montant_paye && 
      parseFloat(plan.montant_paye.toString()) > 0
    ).sort((a, b) => b.numero_mensualite - a.numero_mensualite);
  }

  // Obtenir les paiements paginés
  getPaginatedPayments(): any[] {
    const validPayments = this.getValidPayments();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return validPayments.slice(startIndex, startIndex + this.pageSize);
  }

  // Compter les paiements valides
  getValidPaymentsCount(): number {
    return this.getValidPayments().length;
  }

  // Formater le mode de paiement en texte lisible
  getPaymentModeText(mode: string): string {
    const modes: { [key: string]: string } = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'virement': 'Virement bancaire',
      'carte': 'Carte bancaire',
      'mobile_money': 'Paiement mobile',
      'orange_money': 'Orange Money',
      'mtn_money': 'MTN Money',
      'moov_money': 'Moov Money',
      'wave': 'Wave'
    };
    
    return modes[mode?.toLowerCase()] || mode || 'Non spécifié';
  }

  // Formater les dates de paiement
  formatPaymentDate(dateString: string): string {
    if (!dateString) {
      return 'Date non disponible';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date non disponible';
    }
  }

  // Formater les montants avec la méthode du service
  formatCurrency(amount: any): string {
    if (amount === null || amount === undefined) {
      return '0 FCFA';
    }
    
    const numAmount = parseFloat(amount.toString());
    if (isNaN(numAmount)) {
      return '0 FCFA';
    }
    
    return this.souscriptionService.formatCurrency(numAmount);
  }

  // Obtenir le nom de l'admin qui a enregistré la souscription
  getAdminName(): string {
    if (!this.apiData?.admin) {
      return 'Administrateur non spécifié';
    }
    
    const admin = this.apiData.admin;
    return `${admin.prenom} ${admin.nom}`.trim() || 'Administrateur';
  }

  // Obtenir le statut du paiement en texte lisible
  getPaymentStatusText(status: string): string {
    const statuses: { [key: string]: string } = {
      'paye': 'Payé',
      'paye_en_retard': 'Payé en retard',
      'paye_avance': 'Payé en avance',
      'non_paye': 'Non payé',
      'en_attente': 'En attente',
      'annule': 'Annulé'
    };
    
    return statuses[status] || status || 'Statut inconnu';
  }

  // Obtenir la classe CSS pour le statut
  getPaymentStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'paye': 'status-paid',
      'paye_en_retard': 'status-late',
      'paye_avance': 'status-early',
      'non_paye': 'status-unpaid',
      'en_attente': 'status-pending',
      'annule': 'status-cancelled'
    };
    
    return classes[status] || 'status-unknown';
  }

  // Tracking pour les paiements enrichis
  trackByPaymentEnhanced(_index: number, payment: any): string {
    return `${payment.id_plan_paiement}-${payment.numero_mensualite}-${payment.montant_paye}`;
  }

  // Méthode de debug améliorée
  debugSubscriptionData(): void {
    console.log('🐛 === DEBUG PAYMENT DETAILS COMPLET ===');
    console.log('📋 Subscription ID:', this.subscriptionId);
    console.log('⏳ État loading:', this.loading);
    console.log('💾 Données subscription:', JSON.stringify(this.subscription, null, 2));
    
    if (this.subscription) {
      console.log('📊 === STATISTIQUES DÉTAILLÉES ===');
      console.log('   ID:', this.subscription.id);
      console.log('   Terrain:', this.subscription.terrain);
      console.log('   Surface:', this.subscription.surface);
      console.log('   Prix total (montant_total_souscrit):', `${this.formatNumber(this.subscription.prixTotal)} (raw: ${this.subscription.prixTotal})`);
      console.log('   Montant payé:', `${this.formatNumber(this.subscription.montantPaye)} (raw: ${this.subscription.montantPaye})`);
      console.log('   Reste à payer (calculé):', `${this.formatNumber(this.subscription.resteAPayer)} (raw: ${this.subscription.resteAPayer})`);
      console.log('   Progression:', `${this.subscription.progression}% (raw: ${this.subscription.progression})`);
      console.log('   Statut:', this.subscription.statut);
      console.log('   Date début:', this.subscription.dateDebut);
      console.log('   Prochain paiement:', this.subscription.prochainPaiement);
      console.log('   Nombre paiements:', this.subscription.payments.length);
      
      // Recalcul de vérification
      const verification = this.calculateProgressPercentage(
        this.subscription.prixTotal, 
        this.subscription.montantPaye
      );
      console.log('🔍 === VÉRIFICATION CALCUL ===');
      console.log('   Progression recalculée:', verification + '%');
      console.log('   Correspond:', Math.abs(verification - this.subscription.progression) < 0.01);
      
      if (this.subscription.payments.length > 0) {
        console.log('💳 === PAIEMENTS (5 premiers) ===');
        this.subscription.payments.slice(0, 5).forEach((payment, i) => {
          console.log(`   ${i + 1}. Mensualité ${payment.numero_mensualite}:`, {
            date: payment.date,
            amount: `${this.formatNumber(payment.amount)} (raw: ${payment.amount})`,
            mode: payment.mode_paiement,
            statut: payment.statut_versement,
            reference: payment.reference_paiement
          });
        });
        
        // Vérification somme paiements
        const sommePaiements = this.subscription.payments.reduce((sum, p) => sum + p.amount, 0);
        console.log('💰 === VÉRIFICATION SOMME PAIEMENTS ===');
        console.log('   Somme calculée:', sommePaiements);
        console.log('   Montant total API:', this.subscription.montantPaye);
        console.log('   Écart:', Math.abs(sommePaiements - this.subscription.montantPaye));
        console.log('   Cohérent:', Math.abs(sommePaiements - this.subscription.montantPaye) < 1);
      } else {
        console.log('ℹ️ Aucun paiement à afficher');
      }
    } else {
      console.log('❌ Aucune donnée de souscription disponible');
    }
    console.log('🐛 === FIN DEBUG ===');
  }

  // Pagination handler
  onPageChange(page: number): void {
    this.currentPage = page;
  }
}