import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PaiementsResponse, ApiPaiement } from 'src/app/core/models/paiments';
import { PayementsService } from 'src/app/core/services/payements.service';


interface Payment {
  date: string;
  amount: number;
  numero_mensualite: number;
  mode_paiement: string;
  reference_paiement?: string | null; // Correspond à l'API
  statut_versement: string;
  montant_prevu: number;
  penalite_appliquee: number;
  date_limite: string;
  commentaire?: string | null; // Correspond à l'API
}

interface PaymentStats {
  totalMensualites: number;
  totalPayeATemps: number;
  totalEnRetard: number;
  totalEnAttente: number;
  montantTotalPaye: number;
  totalPenalites: number;
}

@Component({
  selector: 'app-paiement',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzTagModule],
  templateUrl: './paiement.component.html',
  styleUrls: ['./paiement.component.css']
})
export class PaiementComponent implements OnInit {
  payments: Payment[] = [];
  stats: PaymentStats = {
    totalMensualites: 0,
    totalPayeATemps: 0,
    totalEnRetard: 0,
    totalEnAttente: 0,
    montantTotalPaye: 0,
    totalPenalites: 0
  };
  loading = false;
  paiementsData: PaiementsResponse | null = null;
  userId: number = 1; // Remplacez par l'ID réel de l'utilisateur connecté (ex: récupérez depuis un service d'authentification ou localStorage, par exemple this.userId = parseInt(localStorage.getItem('userId') || '0');)

  constructor(
    private paiementsService: PayementsService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Initialisation - Récupération des paiements pour l\'utilisateur');
    this.loadAllUserPayments();
  }

  // Récupérer les paiements de l'utilisateur spécifique
  loadAllUserPayments(): void {
    console.log('🔍 === CHARGEMENT DES PAIEMENTS POUR L\'UTILISATEUR ===');
    
    this.loading = true;
    
    // Appel API pour récupérer les paiements de l'utilisateur spécifique
    this.paiementsService.getPaiementsForUser({
      per_page: 1000 // Récupérer un maximum de paiements
    }).subscribe({
      next: (result: PaiementsResponse) => {
        console.log('📥 Paiements reçus:', result);
        
        if (result.success) {
          this.paiementsData = result;
          this.mapPaymentsData(result);
          console.log('✅ Mapping des paiements terminé');
        } else {
          console.error('❌ Erreur dans la réponse API:', result);
        }
        
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des paiements:', error);
        this.loading = false;
      }
    });
  }

  // Mapper les données des paiements pour l'affichage
  private mapPaymentsData(paiementsData: PaiementsResponse): void {
    console.log('🗺️ Mapping des paiements:', paiementsData);
    
    // Mapper tous les paiements avec types corrects
    this.payments = paiementsData.data.map((p: ApiPaiement) => ({
      date: p.est_paye ? this.formatDateFromAPI(p.date_paiement_effectif) : '-',
      amount: this.parseAmountFromAPI(p.montant_paye),
      numero_mensualite: p.numero_mensualite,
      mode_paiement: p.est_paye ? this.getPaymentModeFromAPI(p.mode_paiement) : '-',
      reference_paiement: p.reference_paiement, // Type: string | null
      statut_versement: p.statut_versement,
      montant_prevu: this.parseAmountFromAPI(p.montant_versement_prevu),
      penalite_appliquee: this.parseAmountFromAPI(p.penalite_appliquee),
      date_limite: this.formatDateFromAPI(p.date_limite_versement),
      commentaire: p.commentaire_paiement // Type: string | null
    })).sort((a: Payment, b: Payment) => b.numero_mensualite - a.numero_mensualite);

    // Calculer les statistiques
    this.calculateStats(paiementsData);
    
    console.log('💳 Paiements mappés:', {
      nombrePaiements: this.payments.length,
      stats: this.stats
    });
  }

  // Calculer les statistiques des paiements
  private calculateStats(paiementsResponse: PaiementsResponse): void {
    const paiements = paiementsResponse.data;
    
    // Utiliser les statistiques de l'API si disponibles
    if (paiementsResponse.statistiques) {
      this.stats = {
        totalMensualites: paiementsResponse.statistiques.total_mensualites,
        totalPayeATemps: paiementsResponse.statistiques.total_paye_a_temps,
        totalEnRetard: paiementsResponse.statistiques.total_en_retard,
        totalEnAttente: paiementsResponse.statistiques.total_en_attente,
        montantTotalPaye: paiements
          .filter((p: ApiPaiement) => p.est_paye)
          .reduce((sum: number, p: ApiPaiement) => sum + this.parseAmountFromAPI(p.montant_paye), 0),
        totalPenalites: paiements.reduce((sum: number, p: ApiPaiement) => sum + this.parseAmountFromAPI(p.penalite_appliquee), 0)
      };
    } else {
      // Calcul manuel si pas de statistiques dans l'API
      this.stats = {
        totalMensualites: paiements.length,
        totalPayeATemps: paiements.filter((p: ApiPaiement) => p.statut_versement === 'paye_a_temps').length,
        totalEnRetard: paiements.filter((p: ApiPaiement) => p.statut_versement === 'paye_en_retard').length,
        totalEnAttente: paiements.filter((p: ApiPaiement) => p.statut_versement === 'en_attente' || !p.est_paye).length,
        montantTotalPaye: paiements
          .filter((p: ApiPaiement) => p.est_paye)
          .reduce((sum: number, p: ApiPaiement) => sum + this.parseAmountFromAPI(p.montant_paye), 0),
        totalPenalites: paiements.reduce((sum: number, p: ApiPaiement) => sum + this.parseAmountFromAPI(p.penalite_appliquee), 0)
      };
    }
  }

  // Méthodes utilitaires internes
  private parseAmountFromAPI(amount: string | number): number {
    if (typeof amount === 'number') return amount;
    if (!amount) return 0;
    
    const cleanAmount = amount.toString().replace(/[^\d.-]/g, '');
    return parseFloat(cleanAmount) || 0;
  }

  private formatDateFromAPI(dateString: string): string {
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
      console.error('Erreur formatage date:', error);
      return 'Date non disponible';
    }
  }

  private getPaymentModeFromAPI(mode: string): string {
    switch(mode?.toLowerCase()) {
      case 'cheque': return 'Chèque';
      case 'especes': return 'Espèces';
      case 'virement': return 'Virement bancaire';
      case 'carte': return 'Carte bancaire';
      case 'mobile': return 'Paiement mobile';
      case 'mandat': return 'Mandat';
      default: return mode || 'Non spécifié';
    }
  }

  // Méthodes pour le template
  formatNumber(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  trackByPayment(index: number, payment: Payment): string {
    return `${payment.numero_mensualite}-${payment.date}-${payment.amount}`;
  }

  refresh(): void {
    console.log('🔄 Actualisation des paiements');
    this.loadAllUserPayments();
  }

  // Méthodes utilitaires pour le template
  getTotalMensualites(): number {
    return this.stats.totalMensualites;
  }

  getPayeATemps(): number {
    return this.stats.totalPayeATemps;
  }

  getEnRetard(): number {
    return this.stats.totalEnRetard;
  }

  getEnAttente(): number {
    return this.stats.totalEnAttente;
  }

  getMontantTotalPaye(): string {
    return this.formatNumber(this.stats.montantTotalPaye);
  }

  getTotalPenalites(): string {
    return this.formatNumber(this.stats.totalPenalites);
  }

  getNombrePaiements(): number {
    return this.payments.length;
  }

  // Obtenir la classe CSS pour chaque ligne selon le statut
  getRowClass(payment: Payment): string {
    switch(payment.statut_versement) {
      case 'paye_a_temps': return 'row-success';
      case 'paye_en_retard': return 'row-warning';
      case 'en_attente': return 'row-pending';
      default: return 'row-pending';
    }
  }

  // Obtenir la couleur du tag selon le statut
  getStatusColor(payment: Payment): string {
    switch(payment.statut_versement) {
      case 'paye_a_temps': return 'green';
      case 'paye_en_retard': return 'orange';
      case 'en_attente': return 'red';
      default: return 'default';
    }
  }

  // Obtenir le libellé du statut
  getStatusLabel(payment: Payment): string {
    switch(payment.statut_versement) {
      case 'paye_a_temps': return 'Payé à temps';
      case 'paye_en_retard': return 'Payé en retard';
      case 'en_attente': return 'En attente';
      default: return payment.statut_versement;
    }
  }

  // Obtenir l'icône du statut
  getStatusIcon(payment: Payment): string {
    switch(payment.statut_versement) {
      case 'paye_a_temps': return 'fa-check-circle';
      case 'paye_en_retard': return 'fa-exclamation-circle';
      case 'en_attente': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  // Debug
  debugPaymentsData(): void {
    console.log('🐛 === DEBUG TOUS LES PAIEMENTS ===');
    console.log('💾 Payments array:', this.payments);
    console.log('📊 Statistiques:', this.stats);
    console.log('📊 Paiements data:', this.paiementsData);
    console.log('⏳ Loading state:', this.loading);
    console.log('🐛 === FIN DEBUG ===');
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      (window as any).debugPayments = () => this.debugPaymentsData();
      console.log('🛠️ Méthode de debug disponible: debugPayments()');
    }
  }
}