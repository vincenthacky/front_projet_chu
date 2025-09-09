import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SouscriptionService, ApiSouscription, SouscriptionSingleResponse } from 'src/app/core/services/souscription.service';

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
  selector: 'app-paiement-details-admin',
  standalone: true,
  imports: [CommonModule], // ✅ CORRECTION: Ajout de CommonModule
  templateUrl: './paiement-details-admin.component.html',
  styleUrl: './paiement-details-admin.component.css'
})
export class PaiementDetailsAdminComponent implements OnInit {
  
  subscription: Subscription | null = null;
  loading = false;
  subscriptionId: string | null = null;

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
        this.router.navigate(['/dashboard/user/souscription-admin']);
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
    const numericId = parseInt(this.subscriptionId);
    
    // ✅ Utiliser la méthode existante du service
    this.souscriptionService.getSouscriptionById(numericId).subscribe({
      next: (response: SouscriptionSingleResponse) => {
        console.log('📥 Réponse API détails:', response);
        
        if (response.success && response.data) {
          // Mapper les données vers notre interface locale
          this.subscription = this.mapApiDataToSubscription(response.data);
          console.log('✅ Souscription mappée:', this.subscription);
        } else {
          console.error('❌ Réponse API invalide:', response);
          this.router.navigate(['/dashboard/user/souscription-admin']);
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des détails:', error);
        this.loading = false;
        this.router.navigate(['/dashboard/user/souscription-admin']);
      }
    });
  }

  // ✅ Mapping simplifié utilisant les interfaces existantes
  private mapApiDataToSubscription(apiData: ApiSouscription): Subscription {
    console.log('🗺️ Mapping des données API:', apiData);
    
    // ✅ Utiliser les bons champs selon le service existant
    const prixTotal = apiData.prix_total_terrain; // Prix total du terrain
    const montantPaye = this.souscriptionService.parseAmount(apiData.montant_paye);
    const resteAPayer = apiData.reste_a_payer;
    
    console.log('💰 Montants mappés:', {
      prixTotal,
      montantPaye,
      resteAPayer
    });
    
    // ✅ Utiliser la méthode du service pour calculer la progression
    const progression = this.souscriptionService.calculateCompletionPercentage(apiData);
    
    // ✅ Utiliser la méthode du service pour déterminer le statut
    const statusInfo = this.souscriptionService.getStatusWithColor(apiData);
    const statut = this.mapApiStatusToLocal(statusInfo.status);
    
    // ✅ Mapper TOUS les paiements effectués (filtrés et triés)
    const allPayments: Payment[] = apiData.planpaiements
      .filter(plan => plan.est_paye) // Seulement les paiements effectués
      .map(plan => ({
        date: this.formatDateForPayment(plan.date_paiement_effectif),
        amount: this.souscriptionService.parseAmount(plan.montant_paye),
        numero_mensualite: plan.numero_mensualite,
        mode_paiement: plan.mode_paiement || 'Non spécifié',
        reference_paiement: plan.reference_paiement || undefined,
        statut_versement: plan.statut_versement
      }))
      .sort((a, b) => a.numero_mensualite - b.numero_mensualite); // Ordre chronologique

    console.log(`💳 Total des paiements: ${allPayments.length}`);

    // Prochain paiement
    let prochainPaiement = '';
    if (apiData.date_prochain) {
      prochainPaiement = apiData.date_prochain;
    } else if (resteAPayer > 0) {
      const dateDebut = new Date(apiData.date_souscription);
      dateDebut.setMonth(dateDebut.getMonth() + 1);
      prochainPaiement = dateDebut.toISOString().split('T')[0];
    }

    const result: Subscription = {
      id: `SUB${apiData.id_souscription.toString().padStart(3, '0')}`,
      terrain: apiData.terrain.libelle,
      surface: apiData.terrain.superficie,
      prixTotal: prixTotal,
      montantPaye: montantPaye,
      resteAPayer: resteAPayer,
      dateDebut: apiData.date_souscription,
      prochainPaiement: prochainPaiement,
      statut: statut,
      progression: progression,
      payments: allPayments // ✅ TOUS les paiements de ce terrain
    };

    console.log('✅ Mapping terminé:', {
      id: result.id,
      terrain: result.terrain,
      totalPayments: result.payments.length,
      progression: result.progression,
      statut: result.statut
    });

    return result;
  }

  // ✅ Mapper le statut API vers notre enum local
  private mapApiStatusToLocal(apiStatus: string): 'en-cours' | 'en-retard' | 'termine' {
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
      default:
        return 'en-cours';
    }
  }

  // ✅ Formatage des dates (même logique que subscription.component.ts)
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

  // ✅ Méthodes utilitaires pour le template (réutilisent le service)

  // Formater les montants (utilise la méthode du service)
  formatNumber(amount: number): string {
    if (!amount && amount !== 0) return '0';
    return this.souscriptionService.formatCurrency(amount);
  }

  // ✅ CORRECTION: Calculer la progression avec vérification null
  getProgress(subscription: Subscription | null): number {
    if (!subscription || subscription.prixTotal === 0) return 0;
    return Math.round((subscription.montantPaye / subscription.prixTotal) * 100);
  }

  // Couleur du montant payé
  getMontantPayeColor(): string {
    return '#10b981'; // Vert pour montant payé
  }

  // Couleur du reste à payer
  getResteAPayerColor(): string {
    if (!this.subscription) return '#6b7280';
    return this.subscription.resteAPayer > 0 ? '#f59e0b' : '#10b981';
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

  // Méthodes de debug
  debugSubscriptionData(): void {
    console.log('🐛 === DEBUG PAYMENT DETAILS ===');
    console.log('📋 Subscription ID:', this.subscriptionId);
    console.log('💾 Données subscription:', this.subscription);
    console.log('⏳ État loading:', this.loading);
    
    if (this.subscription) {
      console.log('📊 Statistiques:');
      console.log('   - Terrain:', this.subscription.terrain);
      console.log('   - Surface:', this.subscription.surface);
      console.log('   - Prix total:', this.formatNumber(this.subscription.prixTotal));
      console.log('   - Montant payé:', this.formatNumber(this.subscription.montantPaye));
      console.log('   - Reste à payer:', this.formatNumber(this.subscription.resteAPayer));
      console.log('   - Progression:', this.getProgress(this.subscription) + '%');
      console.log('   - Statut:', this.subscription.statut);
      console.log('   - Nombre paiements:', this.subscription.payments.length);
      
      if (this.subscription.payments.length > 0) {
        console.log('💳 Échantillon paiements:');
        this.subscription.payments.slice(0, 3).forEach((payment, i) => {
          console.log(`   ${i + 1}.`, {
            date: payment.date,
            amount: this.formatNumber(payment.amount),
            mensualite: payment.numero_mensualite,
            mode: payment.mode_paiement,
            statut: payment.statut_versement
          });
        });
      }
    }
    console.log('🐛 === FIN DEBUG ===');
  }

  // Exposer la méthode de debug pour la console
  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      (window as any).debugPaymentDetails = () => this.debugSubscriptionData();
      console.log('🛠️ Méthode de debug disponible: debugPaymentDetails()');
    }
  }
}