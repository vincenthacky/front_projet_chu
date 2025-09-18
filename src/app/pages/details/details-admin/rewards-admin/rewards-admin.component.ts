import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Ant Design imports
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { Recompense, ApiPagination, RecompensesFilter } from 'src/app/core/models/recompenses';
import { TypeRecompenseResponse } from 'src/app/core/models/types-recompenses';
import { UtilisateurWithSouscriptions, SouscriptionWithPlans } from 'src/app/core/models/utilisateur';
import { RecompensesService } from 'src/app/core/services/recompenses.service';
import { TypesRecompensesService } from 'src/app/core/services/types-recompenses.service';
import { UtilisateursSouscriptionsService } from 'src/app/core/services/utilisateurs-souscriptions.service';



@Component({
  selector: 'app-rewards-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzCardModule,
    NzStatisticModule,
    NzSpinModule,
    NzAlertModule,
    NzEmptyModule,
    NzModalModule,
    NzPaginationModule,
    NzFormModule,
    NzDividerModule,
    NzTypographyModule,
    NzToolTipModule,
    NzStepsModule,
    NzInputNumberModule,
    NzDatePickerModule
  ],
  templateUrl: './rewards-admin.component.html',
  styleUrl: './rewards-admin.component.css'
})
export class RewardsAdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données
  recompenses: Recompense[] = [];
  totalRecompenses = 0;
  isLoading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  perPage = 15;
  pagination: ApiPagination | null = null;

  // Filtres
  searchTerm = '';
  statusFilter: string = '';
  typeFilter: number | null = null;

  // Modal de modification de statut
  isStatusModalVisible = false;
  selectedRecompense: Recompense | null = null;
  statusForm: FormGroup;

  // Modal d'ajout de récompense
  isAddRewardModalVisible = false;
  addRewardForm: FormGroup;
  currentStep = 0;
  isSubmittingReward = false;

  // Données pour le formulaire d'ajout
  utilisateursSouscriptions: UtilisateurWithSouscriptions[] = [];
  typesRecompenses: TypeRecompenseResponse[] = [];
  availableSouscriptions: SouscriptionWithPlans[] = [];
  
  // Sélections actuelles
  selectedUtilisateur: UtilisateurWithSouscriptions | null = null;
  selectedSouscription: SouscriptionWithPlans | null = null;
  selectedTypeRecompense: TypeRecompenseResponse | null = null;

  constructor(
    private recompensesService: RecompensesService,
    private typesRecompensesService: TypesRecompensesService,
    private utilisateursSouscriptionsService: UtilisateursSouscriptionsService,
    private fb: FormBuilder,
    private message: NzMessageService
  ) {
    this.statusForm = this.fb.group({
      statut_recompense: ['', [Validators.required]]
    });

    this.addRewardForm = this.fb.group({
      // Étape 1: Utilisateur
      selectedUtilisateur: ['', [Validators.required]],
      
      // Étape 2: Souscription
      id_souscription: ['', [Validators.required]],
      
      // Étape 3: Type de récompense
      id_type_recompense: ['', [Validators.required]],
      
      // Étape 4: Autres informations
      description: ['', [Validators.required, Validators.minLength(10)]],
      motif_recompense: ['', [Validators.required, Validators.minLength(5)]],
      periode_merite: ['', [Validators.required]],
      statut_recompense: ['due', [Validators.required]],
      date_attribution: [new Date(), [Validators.required]],
      date_attribution_effective: [null],
      commentaire_admin: ['']
    });
  }

  ngOnInit() {
    this.loadRecompenses();
    this.subscribeToService();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToService() {
    this.recompensesService.recompenses$
      .pipe(takeUntil(this.destroy$))
      .subscribe(recompenses => {
        this.recompenses = recompenses;
      });

    this.recompensesService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    this.recompensesService.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.pagination = pagination;
        if (pagination) {
          this.totalRecompenses = pagination.total;
        }
      });
  }

  loadRecompenses() {
    this.error = null;
    const filters: RecompensesFilter = {};
    
    if (this.statusFilter) filters.statut = this.statusFilter;
    if (this.typeFilter) filters.type_recompense = this.typeFilter;

    this.recompensesService.getRecompenses(this.currentPage, this.perPage, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        error: (error) => {
          this.error = 'Erreur lors du chargement des récompenses';
          console.error(error);
        }
      });
  }

  // Gestion des filtres
  onSearchChange() {
    // Implémentation de la recherche si nécessaire
    this.loadRecompenses();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.loadRecompenses();
  }

  onTypeFilterChange() {
    this.currentPage = 1;
    this.loadRecompenses();
  }

  resetFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = null;
    this.currentPage = 1;
    this.loadRecompenses();
  }

  refresh() {
    this.loadRecompenses();
  }

  // Pagination
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadRecompenses();
  }

  onPageSizeChange(size: number) {
    this.perPage = size;
    this.currentPage = 1;
    this.loadRecompenses();
  }

  // Gestion du statut
  openStatusModal(recompense: Recompense) {
    this.selectedRecompense = recompense;
    this.statusForm.patchValue({
      statut_recompense: recompense.statut_recompense
    });
    this.isStatusModalVisible = true;
  }

  closeStatusModal() {
    this.isStatusModalVisible = false;
    this.selectedRecompense = null;
    this.statusForm.reset();
  }

  updateStatus() {
    if (this.statusForm.valid && this.selectedRecompense) {
      const newStatus = this.statusForm.get('statut_recompense')?.value;
      
      this.recompensesService.updateStatutRecompense(this.selectedRecompense.id_recompense, newStatus)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.message.success('Statut mis à jour avec succès');
            this.loadRecompenses();
            this.closeStatusModal();
          },
          error: (error) => {
            this.message.error('Erreur lors de la mise à jour du statut');
            console.error(error);
          }
        });
    }
  }

  // Actions rapides
  markAsDue(recompense: Recompense) {
    this.quickStatusUpdate(recompense, 'due');
  }

  markAsAttributed(recompense: Recompense) {
    this.quickStatusUpdate(recompense, 'attribuee');
  }

  markAsCancelled(recompense: Recompense) {
    this.quickStatusUpdate(recompense, 'annulee');
  }

  private quickStatusUpdate(recompense: Recompense, status: 'due' | 'attribuee' | 'annulee') {
    this.recompensesService.updateStatutRecompense(recompense.id_recompense, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success(`Statut mis à jour vers "${this.getStatusLabel(status)}"`);
          this.loadRecompenses();
        },
        error: (error) => {
          this.message.error('Erreur lors de la mise à jour du statut');
          console.error(error);
        }
      });
  }

  // Utilitaires d'affichage
  getUserFullName(recompense: Recompense): string {
    if (recompense.souscription?.utilisateur) {
      const user = recompense.souscription.utilisateur;
      return `${user.prenom} ${user.nom}`;
    }
    return 'N/A';
  }

  getUserEmail(recompense: Recompense): string {
    return recompense.souscription?.utilisateur?.email || 'N/A';
  }

  getUserMatricule(recompense: Recompense): string {
    return recompense.souscription?.utilisateur?.matricule || 'N/A';
  }

  getStatusDisplay(recompense: Recompense): { label: string, color: string } {
    const statusMap: { [key: string]: { label: string, color: string } } = {
      'due': { label: 'Due', color: 'orange' },
      'attribuee': { label: 'Attribuée', color: 'green' },
      'annulee': { label: 'Annulée', color: 'red' }
    };
    return statusMap[recompense.statut_recompense] || { label: recompense.statut_recompense, color: 'default' };
  }

  getStatusLabel(status: string): string {
    return this.recompensesService.getStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return this.recompensesService.formatDate(dateString);
  }

  formatCurrency(amount: string): string {
    return this.recompensesService.formatCurrency(amount);
  }

  // Statistiques
  getRecompensesDues(): number {
    return this.recompenses.filter(r => r.statut_recompense === 'due').length;
  }

  getRecompensesAttribuees(): number {
    return this.recompenses.filter(r => r.statut_recompense === 'attribuee').length;
  }

  getRecompensesAnnulees(): number {
    return this.recompenses.filter(r => r.statut_recompense === 'annulee').length;
  }

  // ===== GESTION DU MODAL D'AJOUT DE RÉCOMPENSE =====

  openAddRewardModal() {
    this.isAddRewardModalVisible = true;
    this.currentStep = 0;
    this.resetAddRewardForm();
    this.loadFormData();
  }

  closeAddRewardModal() {
    this.isAddRewardModalVisible = false;
    this.currentStep = 0;
    this.resetAddRewardForm();
  }

  private resetAddRewardForm() {
    this.addRewardForm.reset();
    this.addRewardForm.patchValue({
      statut_recompense: 'due',
      date_attribution: new Date(),
    });
    
    this.selectedUtilisateur = null;
    this.selectedSouscription = null;
    this.selectedTypeRecompense = null;
    this.availableSouscriptions = [];
  }

  private loadFormData() {
    // Charger les utilisateurs avec souscriptions
    this.utilisateursSouscriptionsService.getAllUtilisateursSouscriptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.utilisateursSouscriptions = data;
        },
        error: (error) => {
          this.message.error('Erreur lors du chargement des utilisateurs');
          console.error(error);
        }
      });

    // Charger les types de récompenses
    this.typesRecompensesService.getAllTypesRecompenses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.typesRecompenses = data;
        },
        error: (error) => {
          this.message.error('Erreur lors du chargement des types de récompenses');
          console.error(error);
        }
      });
  }

  // ===== GESTION DES ÉTAPES =====

  nextStep() {
    if (this.isCurrentStepValid() && this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0:
        return this.addRewardForm.get('selectedUtilisateur')?.valid || false;
      case 1:
        return this.addRewardForm.get('id_souscription')?.valid || false;
      case 2:
        return this.addRewardForm.get('id_type_recompense')?.valid || false;
      case 3:
        const requiredFields = ['description', 'motif_recompense', 'periode_merite', 'statut_recompense', 'date_attribution'];
        return requiredFields.every(field => this.addRewardForm.get(field)?.valid);
      default:
        return false;
    }
  }

  // ===== GESTION DES SÉLECTIONS =====

  onUtilisateurChange(utilisateurId: number) {
    this.selectedUtilisateur = this.utilisateursSouscriptions.find(u => u.id_utilisateur === utilisateurId) || null;
    this.availableSouscriptions = this.selectedUtilisateur ? this.selectedUtilisateur.souscriptions : [];
    
    // Reset les sélections suivantes
    this.selectedSouscription = null;
    this.addRewardForm.patchValue({
      id_souscription: ''
    });
  }

  onSouscriptionChange(souscriptionId: number) {
    this.selectedSouscription = this.availableSouscriptions.find(s => s.id_souscription === souscriptionId) || null;
  }

  onTypeRecompenseChange(typeId: number) {
    this.selectedTypeRecompense = this.typesRecompenses.find(t => t.id_type_recompense === typeId) || null;
    
  }

  // ===== AFFICHAGE DES DONNÉES =====

  getUtilisateurDisplay(utilisateur: UtilisateurWithSouscriptions): string {
    return `${utilisateur.prenom} ${utilisateur.nom} (${utilisateur.email})`;
  }

  getSouscriptionDisplay(souscription: SouscriptionWithPlans): string {
    return `#${souscription.id_souscription} - ${souscription.nombre_terrains} terrain(s) - ${this.formatCurrency(souscription.montant_mensuel)}/mois`;
  }

  // ===== SOUMISSION DU FORMULAIRE =====

  submitAddReward() {
    if (!this.addRewardForm.valid) {
      this.message.error('Veuillez remplir tous les champs requis');
      return;
    }

    this.isSubmittingReward = true;

    // Préparer les données pour l'API
    const formData = this.addRewardForm.value;
    const rewardData = {
      id_souscription: formData.id_souscription,
      id_type_recompense: formData.id_type_recompense,
      description: formData.description,
      motif_recompense: formData.motif_recompense,
      periode_merite: formData.periode_merite,
      statut_recompense: formData.statut_recompense,
      date_attribution: this.formatDateForApi(formData.date_attribution),
      date_attribution_effective: formData.date_attribution_effective ? this.formatDateForApi(formData.date_attribution_effective) : null,
      commentaire_admin: formData.commentaire_admin || null
    };

    this.recompensesService.createRecompense(rewardData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.message.success('Récompense créée avec succès');
          this.closeAddRewardModal();
          this.loadRecompenses(); // Recharger la liste
        },
        error: (error) => {
          this.message.error('Erreur lors de la création de la récompense');
          console.error('Erreur création récompense:', error);
        },
        complete: () => {
          this.isSubmittingReward = false;
        }
      });
  }

  private formatDateForApi(date: Date | string): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0]; // Format YYYY-MM-DD
  }
}
