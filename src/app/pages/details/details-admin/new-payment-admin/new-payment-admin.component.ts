import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Imports Ng-Zorro
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzInputModule } from 'ng-zorro-antd/input';


import { 
  ApiPaiement, 
  ApiUtilisateurAvecPaiements,
  PaiementsGroupesFilters, 
  PaiementsGroupesResponse 
} from 'src/app/core/models/paiments';
import { PayementsService } from 'src/app/core/services/payements.service';

// Interface pour grouper les paiements par utilisateur (locale)
interface GroupedPaymentsByUser {
  utilisateur: string;
  idUtilisateur: number;
  email: string;
  telephone: string;
  paiements: ApiPaiement[];
  souscriptions: Set<number>;
  totalPaye: number;
  totalPrevu: number;
  totalPenalites: number;
  nombrePaiements: number;
  nombreSouscriptions: number;
}

@Component({
  selector: 'app-new-payment-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCollapseModule,
    NzAvatarModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzCardModule,
    NzStatisticModule,
    NzIconModule,
    NzSpinModule,
    NzPaginationModule,
    NzInputModule
  ],
  templateUrl: './new-payment-admin.component.html',
  styleUrl: './new-payment-admin.component.css'
})
export class NewPaymentAdminComponent implements OnInit, OnDestroy {
  
  // Référence au champ de recherche
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;
  
  // Données
  utilisateursAvecPaiements: ApiUtilisateurAvecPaiements[] = [];
  groupedPaymentsByUser: GroupedPaymentsByUser[] = [];
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  pageSizeOptions = [10, 20, 30, 40, 50, 100];

  // Filtres
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Statistiques globales (depuis l'API)
  totalMensualites = 0;
  payeATemps = 0;
  enRetard = 0;
  enAttente = 0;
  montantTotalPayeGlobal = 0; // ✅ Montant global depuis l'API
  totalPenalites = 0;

  constructor(private payementsService: PayementsService) {}

  ngOnInit(): void {
    this.loadPaiementsGroupes();
    
    // ✅ Configuration de la recherche automatique avec debounce
    this.searchSubject
      .pipe(
        debounceTime(500), // Attendre 500ms après la dernière frappe
        distinctUntilChanged() // Ne déclencher que si la valeur a changé
      )
      .subscribe(searchValue => {
        console.log('🔍 Recherche automatique:', searchValue);
        this.searchTerm = searchValue;
        this.currentPage = 1;
        this.loadPaiementsGroupes();
      });
  }

  ngOnDestroy(): void {
    // ✅ Nettoyer la souscription
    this.searchSubject.complete();
  }

  /**
   * ✅ Charger les paiements groupés par utilisateur avec pagination
   */
  loadPaiementsGroupes(): void {
    console.log('🔄 Chargement des paiements groupés par utilisateur...');
    this.loading = true;
    this.error = null;
  
    const filters: PaiementsGroupesFilters = {
      page: this.currentPage,
      per_page: this.pageSize,
      search: this.searchTerm || undefined
    };

    this.payementsService.getPaiementsGroupesParUtilisateur(filters).subscribe({
      next: (response: PaiementsGroupesResponse) => {
        console.log('📥 Réponse API paiements groupés:', response);
        
        if (response.success) {
          this.utilisateursAvecPaiements = response.data || [];
          this.totalItems = response.pagination?.total || 0;
          
          // ✅ Mettre à jour les statistiques avec montant_paye_global
          if (response.statistiques) {
            this.updateStatsFromAPI(response.statistiques);
          }
          
          // Mapper vers l'interface locale et calculer les pénalités
          this.mapToGroupedPayments();
          
          console.log('✅ Paiements groupés chargés:', this.groupedPaymentsByUser.length, 'utilisateurs');
          console.log('📊 Pagination:', {
            page: response.pagination?.current_page,
            total: response.pagination?.total,
            perPage: response.pagination?.per_page
          });
          console.log('💰 Montant total payé global:', this.montantTotalPayeGlobal);
        } else {
          this.error = response.message || 'Erreur lors du chargement des paiements';
          console.error('❌ Erreur API:', response.message);
        }
        
        // ✅ IMPORTANT: Arrêter le loading dans tous les cas
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement:', error);
        this.error = 'Impossible de charger les paiements. Veuillez réessayer.';
        this.utilisateursAvecPaiements = [];
        this.groupedPaymentsByUser = [];
        
        // ✅ IMPORTANT: Arrêter le loading en cas d'erreur
        this.loading = false;
      }
    });
  }

  /**
   * ✅ Mettre à jour les statistiques depuis les données de l'API
   */
  private updateStatsFromAPI(statistiques: any): void {
    this.totalMensualites = statistiques.total_mensualites || 0;
    this.payeATemps = statistiques.total_paye_a_temps || 0;
    this.enRetard = statistiques.total_en_retard || 0;
    this.enAttente = statistiques.total_en_attente || 0;

    // ✅ Utiliser montant_paye_global au lieu de montant_paye_page_courante
    this.montantTotalPayeGlobal = this.payementsService.parseAmount(
      statistiques.montant_paye_global || statistiques.montant_paye_page_courante || 0
    );

    console.log('📊 Statistiques mises à jour depuis l\'API:', {
      totalMensualites: this.totalMensualites,
      payeATemps: this.payeATemps,
      enRetard: this.enRetard,
      enAttente: this.enAttente,
      montantTotalPayeGlobal: this.montantTotalPayeGlobal
    });
  }

  /**
   * ✅ Mapper les données API vers l'interface locale et calculer les pénalités
   */
  private mapToGroupedPayments(): void {
    console.log('🔄 Mapping des utilisateurs vers l\'interface locale...');
    
    // ✅ Calculer le total des pénalités depuis tous les utilisateurs
    this.totalPenalites = this.utilisateursAvecPaiements.reduce((sum, user) => {
      return sum + (user.paiements?.reduce((pSum, p) => 
        pSum + Math.abs(this.payementsService.parseAmount(p.penalite_appliquee)), 0) || 0);
    }, 0);
    
    this.groupedPaymentsByUser = this.utilisateursAvecPaiements.map(user => {
      const paiements = user.paiements || [];
      const souscriptions = new Set<number>();
      
      paiements.forEach(p => {
        if (p.id_souscription) {
          souscriptions.add(p.id_souscription);
        }
      });

      const totalPaye = paiements.reduce((sum, p) => 
        sum + this.payementsService.parseAmount(p.montant_paye), 0);
      
      const totalPrevu = paiements.reduce((sum, p) => 
        sum + this.payementsService.parseAmount(p.montant_versement_prevu), 0);
      
      const totalPenalites = paiements.reduce((sum, p) => 
        sum + Math.abs(this.payementsService.parseAmount(p.penalite_appliquee)), 0);

      return {
        utilisateur: `${user.prenom} ${user.nom}`,
        idUtilisateur: user.id_utilisateur,
        email: user.email,
        telephone: user.telephone,
        paiements: paiements,
        souscriptions: souscriptions,
        totalPaye: totalPaye,
        totalPrevu: totalPrevu,
        totalPenalites: totalPenalites,
        nombrePaiements: paiements.length,
        nombreSouscriptions: souscriptions.size
      };
    });

    console.log('✅ Mapping terminé:', this.groupedPaymentsByUser.length, 'utilisateurs mappés');
    console.log('💸 Total pénalités calculé:', this.totalPenalites);
  }

  /**
   * ✅ Déclencher la recherche automatique au fur et à mesure de la saisie
   */
  onSearchInput(searchValue: string): void {
    this.searchSubject.next(searchValue);
  }

  /**
   * ✅ Rechercher des utilisateurs (pour compatibilité avec l'ancien code)
   */
  onSearch(searchValue: string): void {
    console.log('🔍 Recherche:', searchValue);
    this.searchTerm = searchValue;
    this.currentPage = 1;
    this.loadPaiementsGroupes();
  }

  /**
   * ✅ Changer de page
   */
  onPageChange(page: number): void {
    console.log('📄 Changement de page:', page);
    this.currentPage = page;
    this.loadPaiementsGroupes();
  }

  /**
   * ✅ Changer la taille de page
   */
  onPageSizeChange(size: number): void {
    console.log('📏 Changement de taille de page:', size);
    this.pageSize = size;
    this.currentPage = 1;
    this.loadPaiementsGroupes();
  }

  /**
   * ✅ Réinitialiser les filtres
   */
  resetFilters(): void {
    console.log('🔄 Réinitialisation des filtres');
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadPaiementsGroupes();
  }

  /**
   * Méthodes utilitaires pour le template
   */
  
  // Getters pour les statistiques
  getTotalMensualites(): number {
    return this.totalMensualites;
  }

  getPayeATemps(): number {
    return this.payeATemps;
  }

  getEnRetard(): number {
    return this.enRetard;
  }

  getEnAttente(): number {
    return this.enAttente;
  }

  // ✅ Retourner le montant global depuis l'API
  getMontantTotalPaye(): string {
    return this.payementsService.formatCurrency(this.montantTotalPayeGlobal);
  }

  // ✅ Retourner les pénalités sans décimales
  getTotalPenalites(): string {
    return this.payementsService.formatCurrencyInteger(this.totalPenalites);
  }

  // Formatage des montants
  formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? 
      this.payementsService.parseAmount(amount) : amount;
    return this.payementsService.formatCurrency(numAmount);
  }

  // ✅ Formatage des pénalités sans décimales
  formatPenalty(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? 
      this.payementsService.parseAmount(amount) : amount;
    return this.payementsService.formatCurrencyInteger(Math.abs(numAmount));
  }

  // Formatage des dates
  formatDate(dateString: string): string {
    return this.payementsService.formatDate(dateString);
  }

  // Couleur du statut
  getStatusColor(status: string): string {
    return this.payementsService.getPaymentStatusColor(status);
  }

  // Label du statut
  getStatusLabel(status: string): string {
    return this.payementsService.getPaymentStatusLabel(status);
  }

  // Label du mode de paiement
  getPaymentModeLabel(mode: string): string {
    return this.payementsService.getPaymentModeLabel(mode);
  }

  // Obtenir le nom du terrain à partir du paiement
  getTerrainName(paiement: ApiPaiement): string {
    // Si le paiement a une souscription avec terrain
    if (paiement.souscription && paiement.souscription.id_terrain) {
      return `Terrain ${paiement.souscription.id_terrain}`;
    }
    return 'Terrain non spécifié';
  }

  // Obtenir les initiales pour l'avatar
  getUserInitials(group: GroupedPaymentsByUser): string {
    const names = group.utilisateur.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return group.utilisateur.substring(0, 2).toUpperCase();
  }

  // TrackBy pour optimiser les performances
  trackByUser(index: number, item: GroupedPaymentsByUser): number {
    return item.idUtilisateur;
  }

  trackByPayment(index: number, item: ApiPaiement): number {
    return item.id_plan_paiement;
  }

  // Actions
  refresh(): void {
    console.log('🔄 Actualisation des paiements...');
    this.loadPaiementsGroupes();
  }

  viewPaymentDetails(paiement: ApiPaiement): void {
    console.log('👁️ Voir détails paiement:', paiement);
    // Implémenter la navigation vers les détails
  }

  editPayment(paiement: ApiPaiement): void {
    console.log('✏️ Modifier paiement:', paiement);
    // Implémenter la modification
  }

  // Méthodes utilitaires pour le template
  parseFloat(value: string): number {
    return parseFloat(value);
  }

  hasPenalty(penaliteAmount: string): boolean {
    return parseFloat(penaliteAmount) > 0;
  }
}