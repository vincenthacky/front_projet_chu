import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SouscriptionSingleResponse, ApiSouscription } from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';
import { PayementsService } from 'src/app/core/services/payements.service';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';

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

// ✅ Interface pour le formulaire de modification
interface EditPaymentForm {
  mode_paiement: string;
  montant_paye: number;
  reference_paiement: string;
  date_paiement_effectif: string;
  commentaire_paiement: string;
}

@Component({
  selector: 'app-paiement-details-admin',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    NzSpinModule, 
    NzEmptyModule, 
    NzPaginationModule,
    NzModalModule,
    NzIconModule
  ],
  templateUrl: './paiement-details-admin.component.html',
  styleUrl: './paiement-details-admin.component.css'
})
export class PaiementDetailsAdminComponent implements OnInit {
  subscription: Subscription | null = null;
  apiData: ApiSouscription | null = null;
  loading = false;
  subscriptionId: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  // ✅ Variables pour le modal de modification
  isEditPaymentModalVisible = false;
  selectedPaymentForEdit: any = null;
  isSubmittingEdit = false;
  
  editPaymentForm: EditPaymentForm = {
    mode_paiement: '',
    montant_paye: 0,
    reference_paiement: '',
    date_paiement_effectif: '',
    commentaire_paiement: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private souscriptionService: SouscriptionService,
    private payementsService: PayementsService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Initialisation du composant PaymentDetails');
    
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

  get paginatedPayments(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.getValidPayments().slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  loadSubscriptionDetails(): void {
    if (!this.subscriptionId) return;
    
    console.log('🔍 === CHARGEMENT DÉTAILS SOUSCRIPTION ===');
    console.log('📋 ID:', this.subscriptionId);
    
    this.loading = true;
    
    const numericId = parseInt(this.subscriptionId, 10);
    
    this.souscriptionService.getSouscriptionById(numericId).subscribe({
      next: (response: SouscriptionSingleResponse) => {
        console.log('📥 Réponse API détails:', response);
        
        if (response.success && response.data) {
          this.apiData = response.data;
          this.subscription = this.mapApiDataToSubscription(response.data);
          this.totalItems = this.getValidPaymentsCount();
          console.log('✅ Souscription mappée:', this.subscription);
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

  // ✅ Ouvrir le modal de modification
  openEditPaymentModal(payment: any): void {
    console.log('📝 === OUVERTURE MODAL MODIFICATION ===');
    console.log('💳 Paiement sélectionné:', payment);
    
    this.selectedPaymentForEdit = payment;
    
    // ✅ Pré-remplir le formulaire avec les données actuelles
    this.editPaymentForm = {
      mode_paiement: payment.mode_paiement || '',
      montant_paye: parseFloat(payment.montant_paye) || 0,
      reference_paiement: payment.reference_paiement || '',
      date_paiement_effectif: this.formatDateForInput(payment.date_paiement_effectif),
      commentaire_paiement: payment.commentaire_paiement || ''
    };
    
    console.log('📋 Formulaire pré-rempli:', this.editPaymentForm);
    
    this.isEditPaymentModalVisible = true;
  }

  // ✅ Soumettre la modification
  submitEditPayment(): void {
    if (!this.selectedPaymentForEdit) {
      console.error('❌ Aucun paiement sélectionné');
      return;
    }

    console.log('💾 === SOUMISSION MODIFICATION PAIEMENT ===');
    console.log('📋 ID plan paiement:', this.selectedPaymentForEdit.id_plan_paiement);
    console.log('📝 Données à envoyer:', this.editPaymentForm);

    this.isSubmittingEdit = true;

    const payload = {
      mode_paiement: this.editPaymentForm.mode_paiement,
      montant_paye: this.editPaymentForm.montant_paye,
      date_paiement_effectif: this.editPaymentForm.date_paiement_effectif,
      reference_paiement: this.editPaymentForm.reference_paiement || null,
      commentaire_paiement: this.editPaymentForm.commentaire_paiement || null
    };

    console.log('📤 Payload final:', payload);

    this.payementsService.updatePaiement(
      this.selectedPaymentForEdit.id_plan_paiement, 
      payload
    ).subscribe({
      next: (response) => {
        console.log('✅ Réponse API modification:', response);
        
        this.message.success('Paiement modifié avec succès');
        
        this.isEditPaymentModalVisible = false;
        this.isSubmittingEdit = false;
        
        // ✅ Recharger les données
        this.loadSubscriptionDetails();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la modification:', error);
        
        let errorMessage = 'Une erreur est survenue lors de la modification';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.message.error(errorMessage);
        this.isSubmittingEdit = false;
      }
    });
  }

  // ✅ Annuler la modification
  handleEditPaymentModalCancel(): void {
    console.log('❌ Annulation modification paiement');
    this.isEditPaymentModalVisible = false;
    this.selectedPaymentForEdit = null;
    this.resetEditForm();
  }

  // ✅ Réinitialiser le formulaire
  resetEditForm(): void {
    this.editPaymentForm = {
      mode_paiement: '',
      montant_paye: 0,
      reference_paiement: '',
      date_paiement_effectif: '',
      commentaire_paiement: ''
    };
  }

  // ✅ Formater la date pour l'input HTML5 (YYYY-MM-DD)
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('❌ Erreur formatage date pour input:', error);
      return '';
    }
  }

  // ✅ Formater la date pour l'affichage (DD/MM/YYYY)
  formatDateForDisplay(dateString: string): string {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date non disponible';
    }
  }

  // ✅ Obtenir la couleur du statut
  getPaymentStatusColor(status: string): string {
    switch(status?.toLowerCase()) {
      case 'paye':
      case 'paye_a_temps':
        return '#10b981'; // Vert
      case 'paye_en_retard':
        return '#f59e0b'; // Orange
      case 'paye_avance':
        return '#3b82f6'; // Bleu
      case 'non_paye':
        return '#ef4444'; // Rouge
      case 'en_attente':
        return '#6b7280'; // Gris
      case 'annule':
        return '#374151'; // Gris foncé
      default:
        return '#6b7280';
    }
  }

  // ===== MÉTHODES EXISTANTES (inchangées) =====

  calculateProgressPercentage(prixTotal: number, montantPaye: number): number {
    if (!prixTotal || prixTotal <= 0) return 0;
    if (!montantPaye || montantPaye < 0) return 0;
    
    const percentage = (montantPaye / prixTotal) * 100;
    return Math.min(Math.round(percentage * 100) / 100, 100);
  }

  private mapApiDataToSubscription(apiData: ApiSouscription): Subscription {
    const prixTotalRaw = apiData.montant_total_souscrit;
    const montantPayeRaw = apiData.montant_paye;
    
    const prixTotal = parseFloat(this.parseAmountSafely(prixTotalRaw).toString());
    const montantPaye = parseFloat(this.parseAmountSafely(montantPayeRaw).toString());
    const resteAPayer = Math.max(0, prixTotal - montantPaye);
    
    const progression = this.calculateProgressPercentage(prixTotal, montantPaye);
    
    let statut: 'en-cours' | 'en-retard' | 'termine' = 'en-cours';
    try {
      const statusInfo = this.souscriptionService.getStatusWithColor(apiData);
      statut = this.mapApiStatusToLocal(statusInfo.status);
    } catch (error) {
      statut = resteAPayer <= 0 ? 'termine' : 'en-cours';
    }
    
    const allPayments: Payment[] = this.mapPaymentsSafely(apiData.planpaiements || []);
    
    let prochainPaiement = 'N/A';
    if (apiData.date_prochain) {
      prochainPaiement = this.formatDateForPayment(apiData.date_prochain);
    } else if (resteAPayer > 0) {
      const dateDebut = new Date(apiData.date_souscription);
      dateDebut.setMonth(dateDebut.getMonth() + 1);
      prochainPaiement = this.formatDateForPayment(dateDebut.toISOString().split('T')[0]);
    }

    return {
      id: `SUB${apiData.id_souscription?.toString().padStart(3, '0') || '000'}`,
      terrain: apiData.terrain?.libelle || 'Terrain non spécifié',
      surface: apiData.terrain?.superficie?.toString() || 'N/A',
      prixTotal,
      montantPaye,
      resteAPayer,
      dateDebut: this.formatDateForPayment(apiData.date_souscription),
      prochainPaiement,
      statut,
      progression,
      payments: allPayments
    };
  }

  private parseAmountSafely(amount: any): number {
    if (amount === null || amount === undefined) return 0;
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      return this.souscriptionService.parseAmount(amount);
    }
    try {
      return this.souscriptionService.parseAmount(amount.toString());
    } catch (error) {
      return 0;
    }
  }

  private mapPaymentsSafely(planpaiements: any[]): Payment[] {
    if (!Array.isArray(planpaiements)) return [];
    if (planpaiements.length === 0) return [];

    return planpaiements
      .filter((plan) => {
        return plan && 
               typeof plan.numero_mensualite === 'number' && 
               plan.numero_mensualite > 0 &&
               (plan.montant_paye || plan.montant_paye === 0);
      })
      .map((plan) => {
        const amount = this.parseAmountSafely(plan.montant_paye);
        return {
          date: this.formatDateForPayment(plan.date_paiement_effectif || plan.date_paiement || ''),
          amount,
          numero_mensualite: plan.numero_mensualite,
          mode_paiement: plan.mode_paiement || 'Non spécifié',
          reference_paiement: plan.reference_paiement || undefined,
          statut_versement: plan.statut_versement || 'non_effectue'
        };
      })
      .sort((a, b) => b.numero_mensualite - a.numero_mensualite);
  }

  private mapApiStatusToLocal(apiStatus: string): 'en-cours' | 'en-retard' | 'termine' {
    if (!apiStatus) return 'en-cours';
    
    switch(apiStatus.toLowerCase()) {
      case 'termine':
      case 'terminé':
        return 'termine';
      case 'en_retard':
      case 'en-retard':
      case 'retard':
        return 'en-retard';
      default:
        return 'en-cours';
    }
  }

  private formatDateForPayment(dateString: string): string {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date non disponible';
    }
  }

  formatNumber(amount: number): string {
    if (amount === null || amount === undefined || (!amount && amount !== 0)) {
      return '0 FCFA';
    }
    return this.souscriptionService.formatCurrency(amount);
  }

  getMontantPayeColor(): string {
    return '#10b981';
  }

  getResteAPayerColor(): string {
    if (!this.subscription) return '#6b7280';
    const reste = this.subscription.resteAPayer ?? 0;
    return reste > 0 ? '#f59e0b' : '#10b981';
  }

  trackByPayment(index: number, payment: Payment): string {
    return `${payment.numero_mensualite}-${payment.date}-${payment.amount}`;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/admin/details/souscription-admin']);
  }

  refresh(): void {
    if (this.subscriptionId) {
      this.loadSubscriptionDetails();
    }
  }

  getValidPayments(): any[] {
    if (!this.apiData?.planpaiements) return [];
    
    return this.apiData.planpaiements.filter(plan => 
      plan && 
      plan.est_paye === true && 
      plan.montant_paye && 
      parseFloat(plan.montant_paye.toString()) > 0
    ).sort((a, b) => b.numero_mensualite - a.numero_mensualite);
  }

  getValidPaymentsCount(): number {
    return this.getValidPayments().length;
  }

  getPaymentModeText(mode: string): string {
    const modes: { [key: string]: string } = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'virement': 'Virement bancaire',
      'carte': 'Carte bancaire',
      'mobile': 'Paiement mobile',
      'mobile_money': 'Mobile Money',
      'orange_money': 'Orange Money',
      'mtn_money': 'MTN Money',
      'moov_money': 'Moov Money',
      'wave': 'Wave'
    };
    
    return modes[mode?.toLowerCase()] || mode || 'Non spécifié';
  }

  formatPaymentDate(dateString: string): string {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      if (hours === 0 && minutes === 0) {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return 'Date non disponible';
    }
  }

  formatCurrency(amount: any): string {
    if (amount === null || amount === undefined) return '0 FCFA';
    
    const numAmount = parseFloat(amount.toString());
    if (isNaN(numAmount)) return '0 FCFA';
    
    return this.souscriptionService.formatCurrency(numAmount);
  }

  getAdminName(): string {
    if (!this.apiData?.admin) return 'Administrateur non spécifié';
    
    const admin = this.apiData.admin;
    return `${admin.prenom} ${admin.nom}`.trim() || 'Administrateur';
  }

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

  trackByPaymentEnhanced(_index: number, payment: any): string {
    return `${payment.id_plan_paiement}-${payment.numero_mensualite}-${payment.montant_paye}`;
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      (window as any).debugPaymentDetails = () => this.debugSubscriptionData();
      console.log('🛠️ Méthode de debug disponible: debugPaymentDetails()');
    }
  }

  debugSubscriptionData(): void {
    console.log('🐛 === DEBUG PAYMENT DETAILS COMPLET ===');
    console.log('📋 Subscription ID:', this.subscriptionId);
    console.log('⏳ État loading:', this.loading);
    console.log('💾 Données subscription:', this.subscription);
  }
}