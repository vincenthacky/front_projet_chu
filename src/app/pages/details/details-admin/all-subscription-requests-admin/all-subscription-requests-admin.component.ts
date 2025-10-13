import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Imports Ng-Zorro
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

import { environment } from '@/environment';
import { HttpClient } from '@angular/common/http';
import { ApiSouscription, SouscriptionFilters, SouscriptionResponse } from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';

@Component({
  selector: 'app-all-subscription-requests-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzModalModule,
    NzDropDownModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCardModule,
    NzStatisticModule,
    NzSpinModule,
    NzAlertModule,
    NzEmptyModule,
    NzTypographyModule,
    NzToolTipModule,
    NzInputNumberModule,
    NzPaginationModule
  ],
  templateUrl: './all-subscription-requests-admin.component.html',
  styleUrl: './all-subscription-requests-admin.component.css'
})
export class AllSubscriptionRequestsAdminComponent implements OnInit, OnDestroy {
  
  // Propriétés pour les données
  demandeSouscriptions: ApiSouscription[] = [];
  totalDemandes = 0;
  isLoading = false;
  error: string | null = null;

  // Propriétés pour la pagination
  currentPage = 1;
  perPage = 10;
  totalPages = 0;

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

  // Propriété pour utiliser Math dans le template
  Math = Math;

  // Pour le debounce de recherche
  private searchTimeout: any;

  // API URL pour les actions administrateur
  private readonly API_URL = `${environment.apiUrl}`;
  //private API_BASE_URL = `${environment.apiUrl}/dashboard`;

  constructor(
    private souscriptionService: SouscriptionService,
    private message: NzMessageService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadSouscriptions();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * Chargement des demandes de souscription
   */
  loadSouscriptions(filters?: SouscriptionFilters): void {
    console.log('🔄 Chargement des demandes de souscription');
    this.isLoading = true;
    this.error = null;

    const searchFilters = { 
      ...this.filters, 
      ...filters
    };

    console.log('📤 Filtres envoyés à l\'API:', searchFilters);

    this.souscriptionService.getAllDemandeSouscriptions(searchFilters).subscribe({
      next: (response: SouscriptionResponse) => {
        console.log('📡 Réponse API demandes:', response);
        
        if (response.success) {
          this.demandeSouscriptions = response.data;
          this.totalDemandes = response.pagination.total;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.last_page;
          
          console.log('✅ Demandes chargées:', this.demandeSouscriptions.length);
        } else {
          console.error('❌ Erreur API:', response.message);
          this.error = response.message || 'Erreur lors du chargement des demandes';
        }
      },
      error: (error) => {
        console.error('🚨 Erreur lors du chargement:', error);
        this.error = 'Impossible de charger les demandes de souscription. Veuillez réessayer.';
        this.demandeSouscriptions = [];
      },
      complete: () => {
        this.isLoading = false;
        console.log('✅ Chargement terminé');
      }
    });
  }

  /**
   * Changer le statut d'une demande de souscription
   */
  changerStatutDemande(id: number, nouveauStatut: string): void {
    console.log(`🔄 Changement de statut pour ID ${id} vers ${nouveauStatut}`);
    
    const loadingMessage = this.message.loading('Changement de statut en cours...', { nzDuration: 0 });
    
    const body = {
      statut_souscription: nouveauStatut
    };

    this.http.patch(`${this.API_URL}/souscriptions/demandes/${id}/changer-statut`, body).subscribe({
      next: (response: any) => {
        console.log('✅ Statut changé avec succès:', response);
        this.message.remove(loadingMessage.messageId);
        this.message.success('Statut modifié avec succès');
        this.loadSouscriptions(); // Recharger les données
      },
      error: (error) => {
        console.error('❌ Erreur changement de statut:', error);
        this.message.remove(loadingMessage.messageId);
        this.message.error('Erreur lors du changement de statut');
      }
    });
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
      per_page: 10
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
  getStatusDisplay(souscription: ApiSouscription): {status: string, color: string, label: string} {
    const statut = souscription.statut_souscription;
    
    switch(statut.toLowerCase()) {
      case 'active':
        return { status: statut, color: 'green', label: 'Validée' };
      case 'rejete':
        return { status: statut, color: 'red', label: 'Rejetée' };
      case 'en_attente':
        return { status: statut, color: 'orange', label: 'En attente' };
      default:
        return { status: statut, color: 'default', label: statut };
    }
  }

  /**
   * Obtenir le nom complet de l'utilisateur
   */
  getUserFullName(souscription: ApiSouscription): string {
    if (souscription.utilisateur) {
      return `${souscription.utilisateur.prenom} ${souscription.utilisateur.nom}`;
    }
    return `Utilisateur ${souscription.id_utilisateur}`;
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
   * Calculer le montant total de toutes les demandes
   */
  calculateTotalAmount(): number {
    return this.demandeSouscriptions.reduce((total, souscription) => {
      return total + this.souscriptionService.parseAmount(souscription.montant_total_souscrit);
    }, 0);
  }

  /**
   * Calculer le nombre de demandes par statut
   */
  getDemandesEnAttente(): number {
    return this.demandeSouscriptions.filter(d => d.statut_souscription === 'en_attente').length;
  }

  getDemandesactives(): number {
    return this.demandeSouscriptions.filter(d => d.statut_souscription === 'active').length;
  }

  getDemandesRejetees(): number {
    return this.demandeSouscriptions.filter(d => d.statut_souscription === 'rejete').length;
  }
}
