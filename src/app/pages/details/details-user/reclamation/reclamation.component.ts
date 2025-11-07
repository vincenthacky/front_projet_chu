import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiSouscription } from 'src/app/core/models/souscription';
import { SouscriptionService } from 'src/app/core/services/souscription.service';
import { ApiReclamation, CreateReclamationData } from 'src/app/core/models/reclamations';
import { ReclamationService } from 'src/app/core/services/reclamations.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

@Component({
  selector: 'app-reclamation',
  standalone: true,
  imports: [
    CommonModule, NzTableModule, NzTagModule, NzButtonModule, NzModalModule,
    NzFormModule, NzInputModule, NzSelectModule, NzDatePickerModule,
    NzPaginationModule, FormsModule, ReactiveFormsModule, NzSpinModule, NzEmptyModule
  ],
  templateUrl: './reclamation.component.html',
  styleUrls: ['./reclamation.component.css']
})
export class ReclamationComponent implements OnInit {
  reclamations: ApiReclamation[] = [];
  souscription: ApiSouscription[] = [];
  isModalVisible = false;
  form: FormGroup;
  selectedFile: File | null = null;

  // États de chargement
  isLoadingReclamations = false;
  isLoadingSouscriptions = false;
  isSubmittingForm = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalReclamations: number = 0;

  // Options de taille de page (inclut 5)
  pageSizeOptions = [5, 10, 20, 50];

  typeOptions = [
    { value: 'anomalie_paiement', label: 'Anomalie Paiement' },
    { value: 'information_erronee', label: 'Information Erronée' },
    { value: 'document_manquant', label: 'Document Manquant' },
    { value: 'avancement_projet', label: 'Avancement Projet' },
    { value: 'autre', label: 'Autre' }
  ];

  prioriteOptions = [
    { value: 'basse', label: 'Basse' },
    { value: 'normale', label: 'Normale' },
    { value: 'haute', label: 'Haute' },
    { value: 'urgente', label: 'Urgente' }
  ];

  constructor(
    private fb: FormBuilder,
    private souscriptionService: SouscriptionService,
    private reclamationService: ReclamationService,
    private notification: NzNotificationService,
    private message: NzMessageService
  ) {
    this.form = this.fb.group({
      souscription: [null, Validators.required],
      titre: [null, [Validators.required, Validators.minLength(3)]],
      description: [null, [Validators.required, Validators.minLength(10)]],
      type_reclamation: [null, Validators.required],
      priorite: ['normale'],
      document: [null]
    });
  }

  ngOnInit(): void {
    this.chargerMesSouscriptions();
    this.chargerMesReclamations();
  }

  chargerMesSouscriptions(): void {
    this.isLoadingSouscriptions = true;
    this.souscriptionService.getMesSouscriptions({ per_page: 1000 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.souscription = response.data;
          if (this.souscription.length === 0) {
            this.showWarningMessage('Information', 'Vous n\'avez aucune souscription. Vous devez d\'abord souscrire à un terrain pour pouvoir créer une réclamation.');
          }
        } else {
          this.showErrorMessage('Erreur de chargement', 'Impossible de charger vos souscriptions. Veuillez actualiser la page.');
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement souscriptions:', err);
        this.showErrorMessage('Erreur de connexion', 'Problème de connexion au serveur. Vérifiez votre connexion internet.');
      },
      complete: () => {
        this.isLoadingSouscriptions = false;
      }
    });
  }

  chargerMesReclamations(): void {
    this.isLoadingReclamations = true;
    this.reclamationService.getMesReclamations({
      page: this.currentPage,
      per_page: this.pageSize
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.reclamations = response.data;
          this.totalReclamations = response.pagination.total;
        } else {
          this.showErrorMessage('Erreur de chargement', 'Impossible de charger vos réclamations.');
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement réclamations:', err);
        this.handleApiError(err);
      },
      complete: () => {
        this.isLoadingReclamations = false;
      }
    });
  }

  // Bouton Actualiser : recharge les données
  actualiser(): void {
    this.currentPage = 1;
    this.chargerMesReclamations();
  }

  showModal(): void {
    if (this.souscription.length === 0) {
      this.showWarningMessage(
        'Aucune souscription',
        'Vous devez d\'abord avoir une souscription active pour pouvoir créer une réclamation.'
      );
      return;
    }
    this.form.reset({ priorite: 'normale' });
    this.selectedFile = null;
    this.isModalVisible = true;
  }

  handleOk(): void {
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
      control.markAsDirty();
      control.updateValueAndValidity();
    });

    if (!this.form.valid) {
      this.showFormValidationErrors();
      return;
    }

    const value = this.form.value;
    const titre = value.titre?.trim() || '';
    const description = value.description?.trim() || '';

    if (!value.souscription || titre.length < 3 || description.length < 10 || !value.type_reclamation) {
      this.showValidationError('Veuillez remplir correctement tous les champs obligatoires.');
      return;
    }

    const newReclamation: CreateReclamationData = {
      id_souscription: Number(value.souscription),
      titre: titre,
      description: description,
      type_reclamation: value.type_reclamation,
      id_statut_reclamation: 3,
      priorite: value.priorite || 'normale',
      document: this.selectedFile || undefined
    };

    this.isSubmittingForm = true;
    this.reclamationService.createReclamation(newReclamation).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccessMessage('Réclamation créée avec succès !');
          this.actualiser(); // Recharge après création
          this.closeModal();
        } else {
          this.showErrorMessage('Erreur lors de la création', response.message || 'Une erreur est survenue.');
        }
      },
      error: (err: any) => {
        console.error('Erreur création réclamation:', err);
        this.handleApiError(err);
      },
      complete: () => {
        this.isSubmittingForm = false;
      }
    });
  }

  handleCancel(): void {
    this.closeModal();
  }

  private closeModal(): void {
    this.isModalVisible = false;
    this.form.reset({ priorite: 'normale' });
    this.selectedFile = null;
    this.resetFileInput();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (file.size > maxSize) {
        this.showErrorMessage('Fichier trop volumineux', `Le fichier "${file.name}" dépasse 10 Mo.`);
        this.resetFileInput();
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        this.showErrorMessage('Type non autorisé', `Format non supporté pour "${file.name}".`);
        this.resetFileInput();
        return;
      }

      this.selectedFile = file;
      this.message.success(`Fichier sélectionné : ${file.name} (${this.formatFileSize(file.size)})`);
    } else {
      this.selectedFile = null;
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private resetFileInput(): void {
    const fileInput = document.getElementById('document') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    this.selectedFile = null;
  }

  private showSuccessMessage(message: string): void {
    this.notification.success('Succès', message, { nzDuration: 4000, nzPlacement: 'topRight' });
  }

  private showErrorMessage(title: string, message: string): void {
    this.notification.error(title, message, { nzDuration: 6000, nzPlacement: 'topRight' });
  }

  private showWarningMessage(title: string, message: string): void {
    this.notification.warning(title, message, { nzDuration: 5000, nzPlacement: 'topRight' });
  }

  private showValidationError(message: string): void {
    this.message.error(message, { nzDuration: 4000 });
  }

  private showFormValidationErrors(): void {
    const errors: string[] = [];
    if (this.form.get('souscription')?.hasError('required')) errors.push('Souscription');
    if (this.form.get('titre')?.hasError('required')) errors.push('Titre');
    else if (this.form.get('titre')?.hasError('minlength')) errors.push('Titre (min. 3 car.)');
    if (this.form.get('description')?.hasError('required')) errors.push('Description');
    else if (this.form.get('description')?.hasError('minlength')) errors.push('Description (min. 10 car.)');
    if (this.form.get('type_reclamation')?.hasError('required')) errors.push('Type de réclamation');
    if (errors.length > 0) this.showValidationError(`Champs requis : ${errors.join(', ')}`);
  }

  private handleApiError(error: any): void {
    let title = 'Erreur', msg = 'Une erreur est survenue.';
    if (error.status === 0) { title = 'Connexion'; msg = 'Vérifiez votre connexion internet.'; }
    else if (error.status === 401) { title = 'Session expirée'; msg = 'Reconnectez-vous.'; }
    else if (error.status === 403) { title = 'Accès refusé'; msg = 'Action non autorisée.'; }
    else if (error.status === 422 && error.error?.errors) {
      title = 'Données invalides';
      msg = Object.values(error.error.errors).flat().join(' • ');
    }
    this.showErrorMessage(title, msg);
  }

  getTypeLabel(type: string): string {
    return this.reclamationService.getTypeLabel(type);
  }

  getPriorityLabel(priorite: string): string {
    return this.reclamationService.getPriorityLabel(priorite);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.chargerMesReclamations();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.chargerMesReclamations();
  }
}