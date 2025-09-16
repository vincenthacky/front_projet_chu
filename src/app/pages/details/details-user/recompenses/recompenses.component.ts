import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { Subject, takeUntil } from 'rxjs';
import { Recompense, ApiPagination, RecompensesFilter } from 'src/app/core/models/recompenses';
import { RecompensesService } from 'src/app/core/services/recompenses.service';
// Import pour récupérer l'utilisateur connecté (à adapter selon votre système d'auth)
// import { AuthService } from 'src/app/core/services/auth.service';


@Component({
  selector: 'app-recompenses',
  standalone: true,
  imports: [CommonModule, NzPaginationModule, NzSpinModule, NzEmptyModule],
  templateUrl: './recompenses.component.html',
  styleUrls: ['./recompenses.component.css']
})
export class RecompensesComponent implements OnInit, OnDestroy {
  recompenses: Recompense[] = [];
  paginatedRecompenses: Recompense[] = [];
  pagination: ApiPagination | null = null;
  
  // Configuration de la pagination locale
  currentPage: number = 1;
  pageSize: number = 4;
  totalItems: number = 0;
  totalPages: number = 0;
  
  loading: boolean = false;
  error: string = '';
  hasData: boolean = false;

  // ID de l'utilisateur connecté - à récupérer depuis votre service d'auth
  currentUserId: number = 1; // Remplacez par la récupération réelle de l'ID utilisateur

  // Filtres
  filters: RecompensesFilter = {};

  // Pour gérer les souscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private recompensesService: RecompensesService
    // private authService: AuthService // Ajoutez votre service d'auth
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID de l'utilisateur connecté
    // this.currentUserId = this.authService.getCurrentUserId();
    
    this.loadRecompenses();
    this.subscribeToServiceState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  subscribeToServiceState(): void {
    // Écouter les changements d'état du service
    this.recompensesService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    this.recompensesService.recompenses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(recompenses => {
        this.recompenses = recompenses || [];
        this.hasData = this.recompenses.length > 0;
        this.setupLocalPagination();
      });

    this.recompensesService.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.pagination = pagination;
      });
  }

  loadRecompenses(page: number = 1): void {
    this.error = '';
    
    // Charger les récompenses de l'utilisateur connecté
    this.recompensesService.getUserRecompenses(page, 100, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Récompenses chargées:', response.data?.length || 0);
        },
        error: (error) => {
          this.error = error.message || 'Erreur lors du chargement des récompenses';
          this.hasData = false;
          console.error('Erreur chargement:', error);
        }
      });
  }

  setupLocalPagination(): void {
    this.totalItems = this.recompenses.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    // S'assurer que la page courante reste valide
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    
    this.updatePaginatedData();
    console.log(`Pagination setup: ${this.totalItems} items, ${this.totalPages} pages, page courante: ${this.currentPage}`);
  }

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRecompenses = this.recompenses.slice(startIndex, endIndex);
    console.log(`Affichage page ${this.currentPage}: items ${startIndex + 1} à ${Math.min(endIndex, this.totalItems)} sur ${this.totalItems}`);
  }

  // Méthode pour la pagination Ng-Zorro
  onPageChange(page: number): void {
    console.log(`Changement de page: ${this.currentPage} -> ${page}`);
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    } else {
      console.warn(`Page ${page} invalide. Plage valide: 1-${this.totalPages}`);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  // Méthodes pour les actions sur les récompenses
  updateRecompenseStatus(id: number, newStatus: 'due' | 'attribuee' | 'annulee'): void {
    this.recompensesService.updateStatutRecompense(id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadRecompenses(); // Recharger les données
        },
        error: (error) => {
          this.error = 'Erreur lors de la mise à jour du statut';
        }
      });
  }

  deleteRecompense(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette récompense ?')) {
      this.recompensesService.deleteRecompense(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadRecompenses(); // Recharger les données
          },
          error: (error) => {
            this.error = 'Erreur lors de la suppression de la récompense';
          }
        });
    }
  }

  exportRecompenses(): void {
    this.recompensesService.exportRecompenses(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          // Créer un lien de téléchargement
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `recompenses_${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.error = 'Erreur lors de l\'export des récompenses';
        }
      });
  }

  applyFilters(filters: RecompensesFilter): void {
    this.filters = { ...filters };
    this.currentPage = 1; // Revenir à la première page
    this.loadRecompenses();
  }

  clearFilters(): void {
    this.filters = {};
    this.currentPage = 1;
    this.loadRecompenses();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'due':
        return 'status-due';
      case 'attribuee':
        return 'status-attribuee';
      case 'annulee':
        return 'status-annulee';
      default:
        return 'status-default';
    }
  }

  formatDate(dateString: string): string {
    return this.recompensesService.formatDate(dateString);
  }

  formatCurrency(amount: string): string {
    return this.recompensesService.formatCurrency(amount);
  }

  // Méthodes pour les statistiques - logique corrigée pour les statuts
  getRecompensesByStatus(status: string): Recompense[] {
    return this.recompenses.filter(r => r.statut_recompense === status);
  }

  // Calcul des récompenses en attente (dues)
  getRecompensesEnAttente(): Recompense[] {
    return this.recompenses.filter(r => r.statut_recompense === 'due');
  }

  // Calcul des récompenses attribuées
  getRecompensesAttribuees(): Recompense[] {
    return this.recompenses.filter(r => r.statut_recompense === 'attribuee');
  }

  getRewardIcon(typeRecompense: string): string {
    // Retourne l'icône appropriée selon le type de récompense
    switch (typeRecompense.toLowerCase()) {
      case 'bonus régularité':
        return 'fa-clock';
      case 'bonus performance':
        return 'fa-trophy';
      case 'bonus fidélité':
        return 'fa-heart';
      default:
        return 'fa-award';
    }
  }

  getStatusLabel(status: string): string {
    const labels: {[key: string]: string} = {
      'due': 'Due',
      'attribuee': 'Attribuée', 
      'annulee': 'Annulée'
    };
    return labels[status] || status;
  }

  onCardHover(event: any): void {
    // Animation au survol si nécessaire
    event.target.style.transform = 'translateY(-4px)';
  }

  onCardLeave(event: any): void {
    // Retour à la position normale
    event.target.style.transform = 'translateY(0)';
  }

  getPaginationNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Propriété utilitaire pour le template
  get Math() {
    return Math;
  }
}