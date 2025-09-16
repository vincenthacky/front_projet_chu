import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { ApiReclamation, ReclamationFilters, ReclamationResponse, AdminResponseData } from 'src/app/core/models/reclamations';
import { ReclamationService } from 'src/app/core/services/reclamations.service';



@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    NzPaginationModule,
    NzFormModule,
    NzDividerModule
  ],
  templateUrl: './complaints.component.html',
  styleUrl: './complaints.component.css'
})
export class ComplaintsComponent implements OnInit, OnDestroy {
  
  // Propriétés pour les données
  reclamations: ApiReclamation[] = [];
  totalReclamations = 0;
  isLoading = false;
  error: string | null = null;

  // Propriétés pour la pagination
  currentPage = 1;
  perPage = 15;
  totalPages = 0;

  // Propriétés pour les filtres
  filters: ReclamationFilters = {
    page: 1,
    per_page: 15
  };

  // Variables pour les filtres du template
  searchTerm = '';
  statusFilter: number | '' = '';
  typeFilter = '';
  priorityFilter = '';
  dateDebut: string = '';
  dateFin: string = '';

  // Modal de réponse
  isResponseModalVisible = false;
  responseForm: FormGroup;
  selectedReclamation: ApiReclamation | null = null;

  // Propriété pour utiliser Math dans le template
  Math = Math;

  // Pour le debounce de recherche
  private searchTimeout: any;

  constructor(
    private reclamationService: ReclamationService,
    private message: NzMessageService,
    private fb: FormBuilder
  ) {
    this.responseForm = this.fb.group({
      reponse_admin: ['', [Validators.required, Validators.minLength(10)]],
      id_statut_reclamation: [4, [Validators.required]] // Par défaut: résolue
    });
  }

  ngOnInit(): void {
    this.loadReclamations();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * Chargement des réclamations
   */
  loadReclamations(filters?: ReclamationFilters): void {
    console.log('🔄 Chargement des réclamations');
    this.isLoading = true;
    this.error = null;

    const searchFilters = { 
      ...this.filters, 
      ...filters
    };

    console.log('📤 Filtres envoyés à l\'API:', searchFilters);

    this.reclamationService.getAllReclamations(searchFilters).subscribe({
      next: (response: ReclamationResponse) => {
        console.log('📡 Réponse API réclamations:', response);
        
        if (response.success) {
          this.reclamations = response.data;
          this.totalReclamations = response.pagination.total;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.last_page;
          
          console.log('✅ Réclamations chargées:', this.reclamations.length);
        } else {
          console.error('❌ Erreur API:', response.message);
          this.error = response.message || 'Erreur lors du chargement des réclamations';
        }
      },
      error: (error) => {
        console.error('🚨 Erreur lors du chargement:', error);
        this.error = 'Impossible de charger les réclamations. Veuillez réessayer.';
        this.reclamations = [];
      },
      complete: () => {
        this.isLoading = false;
        console.log('✅ Chargement terminé');
      }
    });
  }

  /**
   * Ouvrir le modal de réponse
   */
  openResponseModal(reclamation: ApiReclamation): void {
    this.selectedReclamation = reclamation;
    this.responseForm.patchValue({
      reponse_admin: '',
      id_statut_reclamation: 4 // Résolue par défaut
    });
    this.isResponseModalVisible = true;
  }

  /**
   * Fermer le modal de réponse
   */
  closeResponseModal(): void {
    this.isResponseModalVisible = false;
    this.selectedReclamation = null;
    this.responseForm.reset();
  }

  /**
   * Envoyer la réponse admin
   */
  submitResponse(): void {
    if (this.responseForm.valid && this.selectedReclamation) {
      const formValue = this.responseForm.value;
      const responseData: AdminResponseData = {
        id_statut_reclamation: formValue.id_statut_reclamation,
        reponse_admin: formValue.reponse_admin,
        date_reponse: new Date().toISOString(),
        date_traitement: new Date().toISOString()
      };

      // Ajouter la date de résolution si c'est résolu
      if (formValue.id_statut_reclamation === 4) {
        responseData.date_resolution = new Date().toISOString();
      }

      const loadingMessage = this.message.loading('Envoi de la réponse...', { nzDuration: 0 });

      this.reclamationService.respondToReclamation(this.selectedReclamation.id_reclamation, responseData).subscribe({
        next: (response) => {
          this.message.remove(loadingMessage.messageId);
          this.message.success('Réponse envoyée avec succès');
          this.closeResponseModal();
          this.loadReclamations(); // Recharger les données
        },
        error: (error) => {
          console.error('❌ Erreur envoi réponse:', error);
          this.message.remove(loadingMessage.messageId);
          this.message.error('Erreur lors de l\'envoi de la réponse');
        }
      });
    } else {
      this.message.warning('Veuillez remplir tous les champs requis');
    }
  }

  /**
   * Actions rapides
   */
  markAsResolved(reclamation: ApiReclamation): void {
    const responseData: AdminResponseData = {
      id_statut_reclamation: 4, // Résolue
      reponse_admin: 'Réclamation traitée et résolue.',
      date_reponse: new Date().toISOString(),
      date_traitement: new Date().toISOString(),
      date_resolution: new Date().toISOString()
    };

    const loadingMessage = this.message.loading('Marquage comme résolu...', { nzDuration: 0 });

    this.reclamationService.respondToReclamation(reclamation.id_reclamation, responseData).subscribe({
      next: (response) => {
        this.message.remove(loadingMessage.messageId);
        this.message.success('Réclamation marquée comme résolue');
        this.loadReclamations();
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.message.remove(loadingMessage.messageId);
        this.message.error('Erreur lors du marquage');
      }
    });
  }

  markAsRejected(reclamation: ApiReclamation): void {
    const responseData: AdminResponseData = {
      id_statut_reclamation: 6, // Rejetée
      reponse_admin: 'Réclamation rejetée après examen.',
      date_reponse: new Date().toISOString(),
      date_traitement: new Date().toISOString()
    };

    const loadingMessage = this.message.loading('Marquage comme rejetée...', { nzDuration: 0 });

    this.reclamationService.respondToReclamation(reclamation.id_reclamation, responseData).subscribe({
      next: (response) => {
        this.message.remove(loadingMessage.messageId);
        this.message.success('Réclamation rejetée');
        this.loadReclamations();
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
        this.message.remove(loadingMessage.messageId);
        this.message.error('Erreur lors du rejet');
      }
    });
  }

  /**
   * Filtres et pagination
   */
  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadReclamations();
  }

  onPageSizeChange(size: number): void {
    this.perPage = size;
    this.filters.per_page = size;
    this.filters.page = 1;
    this.loadReclamations();
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.filters.search = this.searchTerm;
      this.filters.page = 1;
      this.loadReclamations();
    }, 500);
  }

  onStatusFilterChange(): void {
    this.filters.statut = this.statusFilter === '' ? undefined : Number(this.statusFilter);
    this.filters.page = 1;
    this.loadReclamations();
  }

  onTypeFilterChange(): void {
    this.filters.type = this.typeFilter === '' ? undefined : this.typeFilter;
    this.filters.page = 1;
    this.loadReclamations();
  }

  onPriorityFilterChange(): void {
    this.filters.priorite = this.priorityFilter === '' ? undefined : this.priorityFilter;
    this.filters.page = 1;
    this.loadReclamations();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      per_page: 15
    };
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.priorityFilter = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.loadReclamations();
  }

  refresh(): void {
    this.loadReclamations();
  }

  /**
   * Méthodes utilitaires
   */
  getStatusDisplay(reclamation: ApiReclamation): {status: string, color: string, label: string} {
    const statut = reclamation.statut;
    return {
      status: statut.libelle_statut_reclamation,
      color: this.getStatusColor(statut.couleur_statut),
      label: statut.libelle_statut_reclamation
    };
  }

  private getStatusColor(couleur: string): string {
    // Convertir les couleurs hex en noms de couleur ng-zorro
    switch(couleur) {
      case '#fd7e14': return 'orange';
      case '#28a745': return 'green';
      case '#dc3545': return 'red';
      case '#007bff': return 'blue';
      default: return 'default';
    }
  }

  getTypeLabel(type: string): string {
    return this.reclamationService.getTypeLabel(type);
  }

  getTypeColor(type: string): string {
    return this.reclamationService.getTypeColor(type);
  }

  getPriorityLabel(priorite: string): string {
    return this.reclamationService.getPriorityLabel(priorite);
  }

  getPriorityColor(priorite: string): string {
    return this.reclamationService.getPriorityColor(priorite);
  }

  formatDate(dateString: string | null): string {
    return this.reclamationService.formatDate(dateString);
  }

  getUserFullName(reclamation: ApiReclamation): string {
    const utilisateur = reclamation.souscription.utilisateur;
    if (utilisateur) {
      return `${utilisateur.prenom} ${utilisateur.nom}`;
    }
    return `Utilisateur ${reclamation.souscription.id_utilisateur}`;
  }

  getUserEmail(reclamation: ApiReclamation): string {
    const utilisateur = reclamation.souscription.utilisateur;
    return utilisateur?.email || 'Email non disponible';
  }

  getUserPhone(reclamation: ApiReclamation): string {
    const utilisateur = reclamation.souscription.utilisateur;
    return utilisateur?.telephone || 'Téléphone non disponible';
  }

  getUserMatricule(reclamation: ApiReclamation): string {
    const utilisateur = reclamation.souscription.utilisateur;
    return utilisateur?.matricule || `USR-${utilisateur?.id_utilisateur || 'N/A'}`;
  }

  /**
   * Statistiques
   */
  getReclamationsEnAttente(): number {
    return this.reclamations.filter(r => r.id_statut_reclamation === 3).length;
  }

  getReclamationsResolues(): number {
    return this.reclamations.filter(r => r.id_statut_reclamation === 4).length;
  }

  getReclamationsRejetees(): number {
    return this.reclamations.filter(r => r.id_statut_reclamation === 6).length;
  }

  getReclamationsUrgentes(): number {
    return this.reclamations.filter(r => r.priorite === 'urgente').length;
  }
}