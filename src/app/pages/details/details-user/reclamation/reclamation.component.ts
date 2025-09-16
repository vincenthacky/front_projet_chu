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
    NzPaginationModule, FormsModule, ReactiveFormsModule, NzSpinModule,NzEmptyModule
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

  // États de chargement et validation
  isLoadingReclamations = false;
  isLoadingSouscriptions = false;
  isSubmittingForm = false;

  // Propriétés pour la pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalReclamations: number = 0;

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
      titre: [null, [Validators.required, Validators.maxLength(255)]],
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
          console.log('Souscriptions chargées:', this.souscription);
          
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
          console.log('Réclamations récupérées:', this.reclamations);
          console.log('Total:', this.totalReclamations);
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

  showModal(): void {
    if (this.souscription.length === 0) {
      this.showWarningMessage(
        'Aucune souscription', 
        'Vous devez d\'abord avoir une souscription active pour pouvoir créer une réclamation.'
      );
      return;
    }

    this.form.reset({ 
      priorite: 'normale'
    });
    this.selectedFile = null;
    this.isModalVisible = true;
  }

  /**
   * Méthode de débogage pour vérifier les valeurs du formulaire
   */
  debugFormValues(): void {
    console.log('=== DEBUG FORMULAIRE ===');
    console.log('Form valid:', this.form.valid);
    console.log('Form values:', this.form.value);
    console.log('Selected file:', this.selectedFile);
    console.log('Souscriptions disponibles:', this.souscription);
    console.log('=========================');
    
    // Vérifier chaque contrôle
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      console.log(`${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors
      });
    });
  }

  handleOk(): void {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    Object.values(this.form.controls).forEach(control => control.markAsTouched());

    if (this.form.valid) {
      const value = this.form.value;
      
      console.log('✅ Valeurs du formulaire:', value);
      
      // Vérifications supplémentaires
      if (!value.souscription) {
        this.showValidationError('Veuillez sélectionner une souscription');
        return;
      }

      if (!value.titre || value.titre.trim().length < 3) {
        this.showValidationError('Le titre doit contenir au moins 3 caractères');
        return;
      }

      if (!value.description || value.description.trim().length < 10) {
        this.showValidationError('La description doit contenir au moins 10 caractères');
        return;
      }

      // Structure des données pour l'API
      const newReclamation: CreateReclamationData = {
        id_souscription: Number(value.souscription),
        titre: value.titre.trim(),
        description: value.description.trim(),
        type_reclamation: value.type_reclamation,
        id_statut_reclamation: 3, // 3 = "en attente"
        priorite: value.priorite || 'normale',
        document: this.selectedFile || undefined
      };

      console.log('📤 Données à envoyer à l\'API:', newReclamation);

      this.isSubmittingForm = true;

      this.reclamationService.createReclamation(newReclamation).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccessMessage('Réclamation créée avec succès !');
            console.log('✅ Réclamation créée avec succès:', response.data);
            this.chargerMesReclamations(); // Recharger la liste
            this.closeModal();
          } else {
            this.showErrorMessage('Erreur lors de la création', response.message || 'Une erreur est survenue lors de la création de votre réclamation.');
          }
        },
        error: (err: any) => {
          console.error('❌ Erreur création réclamation:', err);
          this.handleApiError(err);
        },
        complete: () => {
          this.isSubmittingForm = false;
        }
      });
    } else {
      this.showFormValidationErrors();
    }
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

  /**
   * Gère la sélection d'un fichier
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validation du fichier
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      // Vérifier la taille
      if (file.size > maxSize) {
        this.showErrorMessage(
          'Fichier trop volumineux', 
          `Le fichier "${file.name}" est trop volumineux. La taille maximum autorisée est de 10 MB.`
        );
        this.resetFileInput();
        return;
      }

      // Vérifier le type
      if (!allowedTypes.includes(file.type)) {
        this.showErrorMessage(
          'Type de fichier non autorisé', 
          `Le fichier "${file.name}" n'est pas dans un format autorisé. Formats acceptés : JPG, PNG, PDF, DOC, DOCX, XLS, XLSX.`
        );
        this.resetFileInput();
        return;
      }

      this.selectedFile = file;
      console.log('✅ Fichier sélectionné valide:', {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeFormatted: this.formatFileSize(file.size)
      });
      
      this.message.success(`Fichier sélectionné : ${file.name} (${this.formatFileSize(file.size)})`);
    } else {
      this.selectedFile = null;
      console.log('Aucun fichier sélectionné');
    }
  }

  /**
   * Formate la taille du fichier en format lisible
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Remet à zéro le champ de sélection de fichier
   */
  private resetFileInput(): void {
    const fileInput = document.getElementById('document') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.selectedFile = null;
  }

  /**
   * Méthodes d'affichage des messages d'erreur améliorées
   */
  private showSuccessMessage(message: string): void {
    this.notification.success(
      'Succès',
      message,
      { 
        nzDuration: 4000,
        nzPlacement: 'topRight',
        nzStyle: {
          background: '#f6ffed',
          border: '1px solid #b7eb8f'
        }
      }
    );
  }

  private showErrorMessage(title: string, message: string): void {
    this.notification.error(
      title,
      message,
      { 
        nzDuration: 6000,
        nzPlacement: 'topRight',
        nzStyle: {
          background: '#fff2f0',
          border: '1px solid #ffccc7'
        }
      }
    );
  }

  private showWarningMessage(title: string, message: string): void {
    this.notification.warning(
      title,
      message,
      { 
        nzDuration: 5000,
        nzPlacement: 'topRight',
        nzStyle: {
          background: '#fffbe6',
          border: '1px solid #ffe58f'
        }
      }
    );
  }

  private showValidationError(message: string): void {
    this.message.error(message, { nzDuration: 4000 });
  }

  private showFormValidationErrors(): void {
    const errors: string[] = [];
    
    if (this.form.get('souscription')?.hasError('required')) {
      errors.push('Souscription');
    }
    if (this.form.get('titre')?.hasError('required')) {
      errors.push('Titre');
    }
    if (this.form.get('description')?.hasError('required')) {
      errors.push('Description');
    }
    if (this.form.get('type_reclamation')?.hasError('required')) {
      errors.push('Type de réclamation');
    }

    if (errors.length > 0) {
      this.showValidationError(`Veuillez remplir les champs obligatoires : ${errors.join(', ')}`);
    }
  }

  private handleApiError(error: any): void {
    let errorTitle = 'Erreur';
    let errorMessage = 'Une erreur inattendue est survenue.';

    if (error.status === 0) {
      errorTitle = 'Erreur de connexion';
      errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.';
    } else if (error.status === 401) {
      errorTitle = 'Session expirée';
      errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
    } else if (error.status === 403) {
      errorTitle = 'Accès refusé';
      errorMessage = 'Vous n\'êtes pas autorisé à effectuer cette action.';
    } else if (error.status === 422) {
      errorTitle = 'Données invalides';
      if (error.error?.errors) {
        const validationErrors = Object.values(error.error.errors).flat();
        errorMessage = `Erreurs de validation :\n• ${validationErrors.join('\n• ')}`;
      } else {
        errorMessage = 'Les données saisies ne sont pas valides. Veuillez vérifier votre saisie.';
      }
    } else if (error.status >= 500) {
      errorTitle = 'Erreur serveur';
      errorMessage = 'Le serveur rencontre actuellement des difficultés. Veuillez réessayer dans quelques instants.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.showErrorMessage(errorTitle, errorMessage);
  }

  getTypeLabel(type: string): string {
    return this.reclamationService.getTypeLabel(type);
  }

  getPriorityLabel(priorite: string): string {
    return this.reclamationService.getPriorityLabel(priorite);
  }

  /**
   * Gère le changement de page
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.chargerMesReclamations();
  }
}