import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { PaiementsResponse, ApiPaiement } from 'src/app/core/models/paiments';
import { PayementsService } from 'src/app/core/services/payements.service';
import { forkJoin, Observable } from 'rxjs';


interface Payment {
  date: string;
  amount: number;
  numero_mensualite: number;
  mode_paiement: string;
  reference_paiement?: string | null;
  statut_versement: string;
  montant_prevu: number;
  penalite_appliquee: number;
  date_limite: string;
  commentaire?: string | null;
  id_souscription: number;
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
  imports: [CommonModule, NzTableModule, NzTagModule, NzButtonModule, NzSpinModule, NzPaginationModule],
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
  userId: number = 1;
  
  // Pagination locale (pour l'affichage)
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  constructor(
    private paiementsService: PayementsService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Initialisation - Récupération de TOUS les paiements pour l\'utilisateur');
    this.loadAllUserPayments();
  }

  get paginatedPayments(): Payment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    console.log(`📄 Pagination locale - Page: ${this.currentPage}, Taille: ${this.pageSize}, Début: ${start}, Fin: ${end}, Total: ${this.payments.length}`);
    return this.payments.slice(start, end);
  }

  onPageChange(page: number): void {
    console.log(`📄 Changement de page vers: ${page}`);
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    console.log(`📄 Changement de taille de page vers: ${size}`);
    this.pageSize = size;
    this.currentPage = 1;
  }

  /**
   * CORRECTION MAJEURE: Récupérer TOUS les paiements en gérant la pagination de l'API
   */
  loadAllUserPayments(): void {
    console.log('🔍 === CHARGEMENT DE TOUS LES PAIEMENTS (TOUTES PAGES) ===');
    
    this.loading = true;
    
    // Première requête pour connaître le nombre total
    this.paiementsService.getPaiementsForUser({
      page: 1,
      per_page: 100 // Augmenter pour réduire le nombre de requêtes
    }).subscribe({
      next: (firstResponse: PaiementsResponse) => {
        console.log('📥 Première réponse reçue:', firstResponse);
        console.log('📊 Pagination API:', firstResponse.pagination);
        
        if (!firstResponse.success) {
          console.error('❌ Erreur dans la réponse API:', firstResponse);
          this.loading = false;
          return;
        }

        const totalPages = firstResponse.pagination.last_page;
        const totalItems = firstResponse.pagination.total;
        
        console.log(`📊 Total des paiements: ${totalItems}`);
        console.log(`📄 Nombre de pages: ${totalPages}`);

        // Si une seule page suffit
        if (totalPages === 1) {
          console.log('✅ Une seule page - Mapping direct');
          this.paiementsData = firstResponse;
          this.mapPaymentsData(firstResponse);
          this.totalItems = this.payments.length;
          this.loading = false;
          return;
        }

        // Si plusieurs pages, récupérer toutes les pages restantes
        console.log(`🔄 Récupération de ${totalPages - 1} pages supplémentaires...`);
        
        const requests: Observable<PaiementsResponse>[] = [];
        
        // Créer les requêtes pour les pages 2 à N
        for (let page = 2; page <= totalPages; page++) {
          requests.push(
            this.paiementsService.getPaiementsForUser({
              page: page,
              per_page: 100
            })
          );
        }

        // Exécuter toutes les requêtes en parallèle
        forkJoin(requests).subscribe({
          next: (responses: PaiementsResponse[]) => {
            console.log(`📥 ${responses.length} pages supplémentaires récupérées`);
            
            // Combiner tous les paiements
            const allPaiements: ApiPaiement[] = [...firstResponse.data];
            
            responses.forEach((response, index) => {
              console.log(`📄 Page ${index + 2}: ${response.data.length} paiements`);
              allPaiements.push(...response.data);
            });

            console.log(`✅ Total combiné: ${allPaiements.length} paiements`);

            // Créer une réponse combinée
            const combinedResponse: PaiementsResponse = {
              ...firstResponse,
              data: allPaiements,
              pagination: {
                ...firstResponse.pagination,
                per_page: allPaiements.length,
                current_page: 1,
                last_page: 1,
                from: 1,
                to: allPaiements.length
              }
            };

            this.paiementsData = combinedResponse;
            this.mapPaymentsData(combinedResponse);
            this.totalItems = this.payments.length;
            
            console.log(`🎉 Chargement terminé - ${this.totalItems} paiements disponibles`);
            this.loading = false;
          },
          error: (error: any) => {
            console.error('❌ Erreur lors du chargement des pages supplémentaires:', error);
            // En cas d'erreur, utiliser au moins la première page
            this.paiementsData = firstResponse;
            this.mapPaymentsData(firstResponse);
            this.totalItems = this.payments.length;
            this.loading = false;
          }
        });
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement initial:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Mapper les données des paiements pour l'affichage
   */
  private mapPaymentsData(paiementsData: PaiementsResponse): void {
    console.log('🗺️ Mapping des paiements...');
    console.log(`🗺️ Nombre d'éléments à mapper: ${paiementsData.data.length}`);
    
    // Mapper tous les paiements
    this.payments = paiementsData.data.map((p: ApiPaiement) => ({
      date: p.est_paye ? this.formatDateFromAPI(p.date_paiement_effectif) : '-',
      amount: this.parseAmountFromAPI(p.montant_paye),
      numero_mensualite: p.numero_mensualite,
      mode_paiement: p.est_paye ? this.getPaymentModeFromAPI(p.mode_paiement) : '-',
      reference_paiement: p.reference_paiement,
      statut_versement: p.statut_versement,
      montant_prevu: this.parseAmountFromAPI(p.montant_versement_prevu),
      penalite_appliquee: this.parseAmountFromAPI(p.penalite_appliquee),
      date_limite: this.formatDateFromAPI(p.date_limite_versement),
      commentaire: p.commentaire_paiement,
      id_souscription: p.id_souscription
    })).sort((a: Payment, b: Payment) => b.numero_mensualite - a.numero_mensualite);

    console.log(`💳 Paiements mappés - Nombre total: ${this.payments.length}`);

    // Calculer les statistiques
    this.calculateStats(paiementsData);
    
    console.log('📊 Statistiques calculées:', this.stats);
  }

  /**
   * Calculer les statistiques des paiements
   */
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
      case 'mobile_money': return 'Paiement mobile';
      case 'mandat': return 'Mandat';
      default: return mode || 'Non spécifié';
    }
  }

  // Méthodes pour le template
  formatNumber(amount: number): string {
    if (isNaN(amount)) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  trackByPayment(index: number, payment: Payment): string {
    return `${payment.numero_mensualite}-${payment.date}-${payment.amount}`;
  }

  refresh(): void {
    console.log('🔄 Actualisation des paiements');
    this.loadAllUserPayments();
  }

  // Méthodes pour les statistiques
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
    console.log('💾 Nombre total de paiements:', this.payments.length);
    console.log('💾 Total items:', this.totalItems);
    console.log('💾 Page actuelle:', this.currentPage);
    console.log('💾 Taille de page:', this.pageSize);
    console.log('💾 Paiements paginés (affichés):', this.paginatedPayments);
    console.log('💾 Nombre de paiements paginés:', this.paginatedPayments.length);
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