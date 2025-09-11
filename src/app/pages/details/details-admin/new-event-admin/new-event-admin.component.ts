import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { Observable } from 'rxjs';

// Imports Ng-Zorro
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimePickerModule } from 'ng-zorro-antd/time-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzAlertModule } from 'ng-zorro-antd/alert';

// Services
import { EvenementsService, TypeEvenement } from 'src/app/core/services/evenements.service';
import { SouscriptionService, ApiSouscription } from 'src/app/core/services/souscription.service';

interface CreateEventData {
  id_type_evenement: number;
  id_souscription: number;
  titre: string;
  description: string;
  type_evenement_libre: string;
  date_debut_evenement: string;
  date_fin_evenement: string;
  lieu: string;
  est_public: boolean;
  documents: File[];
}

@Component({
  selector: 'app-new-event-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTimePickerModule,
    NzSwitchModule,
    NzIconModule,
    NzCardModule,
    NzStepsModule,
    NzTagModule,
    NzToolTipModule,
    NzDividerModule,
    NzUploadModule,
    NzProgressModule,
    NzAlertModule
  ],
  templateUrl: './new-event-admin.component.html',
  styleUrl: './new-event-admin.component.css'
})
export class NewEventAdminComponent implements OnInit {
  eventForm!: FormGroup;
  isSubmitting = false;
  currentStep = 0;
  
  // Données pour les selects
  souscriptions: ApiSouscription[] = [];
  
  // Gestion des fichiers
  fileList: NzUploadFile[] = [];
  uploadedDocuments: File[] = [];
  
  // Suggestions pour l'autocomplétion
  typesSuggeres = [
    'Cérémonie religieuse',
    'Concert de musique',
    'Événement culturel',
    'Conférence',
    'Formation',
    'Réunion',
    'Célébration',
    'Festival'
  ];
  
  lieuxSuggeres = [
    'Cathédrale Saint Paul, Abidjan',
    'Basilique Notre-Dame de la Paix, Yamoussoukro',
    'Église Saint-Michel, Cocody',
    'Centre paroissial Sainte-Anne',
    'Salle des fêtes municipale',
    'Centre de conférences',
    'Auditorium',
    'Salle polyvalente'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private evenementsService: EvenementsService,
    public souscriptionService: SouscriptionService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadSouscriptions();
  }

  private initializeForm(): void {
    this.eventForm = this.fb.group({
      // Étape 1: Informations de base
      titre: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      type_evenement_libre: ['', [Validators.required, Validators.maxLength(100)]],
      
      // Étape 2: Date et lieu
      date_debut: [null, Validators.required],
      heure_debut: [null, Validators.required],
      date_fin: [null, Validators.required],
      heure_fin: [null, Validators.required],
      lieu: ['', [Validators.required, Validators.maxLength(200)]],
      
      // Étape 3: Paramètres avancés
      id_souscription: [null, Validators.required],
      est_public: [true]
    });
  }

  private loadSouscriptions(): void {
    this.souscriptionService.getAllSouscriptions({ per_page: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.souscriptions = response.data;
          console.log('Souscriptions chargées:', this.souscriptions.length);
        }
      },
      error: (error) => {
        console.error('Erreur chargement souscriptions:', error);
        this.message.error('Impossible de charger les souscriptions');
      }
    });
  }

  // Fonction corrigée pour l'upload de fichiers
  beforeUpload = (file: NzUploadFile): boolean => {
    console.log('Fichier reçu:', file);
    console.log('Type de file:', typeof file);
    console.log('Propriétés du file:', Object.keys(file));
    
    // Méthode robuste pour récupérer le fichier
    let actualFile: File;
    
    if (file instanceof File) {
      actualFile = file;
      console.log('Fichier est une instance de File');
    } else if (file.originFileObj) {
      actualFile = file.originFileObj as File;
      console.log('Fichier récupéré via originFileObj');
    } else {
      console.error('Impossible de récupérer le fichier:', file);
      this.message.error('Format de fichier invalide. Veuillez réessayer.');
      return false;
    }

    console.log('Fichier à traiter:', actualFile.name, actualFile.type, actualFile.size);

    // Validation du type de fichier
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'
    ];
    
    // Validation par extension en cas de problème avec le MIME type
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.avi', '.mov'];
    const fileExtension = actualFile.name.toLowerCase().substring(actualFile.name.lastIndexOf('.'));
    
    const isValidType = allowedTypes.includes(actualFile.type) || allowedExtensions.includes(fileExtension);
    
    if (!isValidType) {
      console.error('Type de fichier non autorisé:', actualFile.type, 'Extension:', fileExtension);
      this.message.error(`Type de fichier non autorisé. Formats acceptés: JPG, PNG, GIF, MP4, AVI, MOV`);
      return false;
    }

    // Vérifier la taille (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (actualFile.size > maxSize) {
      this.message.error('Le fichier doit faire moins de 50MB');
      return false;
    }

    // Vérifier les doublons
    const isDuplicate = this.uploadedDocuments.some(doc => 
      doc.name === actualFile.name && doc.size === actualFile.size
    );
    
    if (isDuplicate) {
      this.message.warning('Ce fichier est déjà présent dans la liste');
      return false;
    }

    // Ajouter le fichier à la liste
    this.uploadedDocuments.push(actualFile);
    
    // Créer un aperçu pour les images
    if (actualFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        // Mettre à jour l'aperçu dans le NzUploadFile
        file.url = reader.result as string;
        file.thumbUrl = reader.result as string;
        
        // Mettre à jour aussi dans fileList si nécessaire
        const fileInList = this.fileList.find(f => 
          f.name === actualFile.name && f.size === actualFile.size
        );
        if (fileInList) {
          fileInList.url = reader.result as string;
          fileInList.thumbUrl = reader.result as string;
        }
      };
      reader.onerror = () => {
        console.error('Erreur lors de la génération de l\'aperçu pour:', actualFile.name);
      };
      reader.readAsDataURL(actualFile);
    }

    console.log(`Fichier ajouté: ${actualFile.name} (${this.formatFileSize(actualFile.size)})`);
    console.log('Total fichiers:', this.uploadedDocuments.length);
    
    this.message.success(`Fichier "${actualFile.name}" ajouté avec succès`);
    
    return false; // Empêcher l'upload automatique
  };

  // Fonction corrigée pour supprimer un fichier
  removeFile = (file: NzUploadFile): boolean => {
    console.log('Suppression du fichier:', file.name);
    
    // Trouver le fichier dans la liste des documents uploadés
    const fileName = file.name;
    const fileSize = file.size;
    
    if (fileName) {
      // Supprimer de uploadedDocuments
      this.uploadedDocuments = this.uploadedDocuments.filter(doc => 
        !(doc.name === fileName && doc.size === fileSize)
      );
      
      console.log('Fichier supprimé. Total restant:', this.uploadedDocuments.length);
      this.message.info(`Fichier "${fileName}" supprimé`);
    }
    
    return true; // Permettre la suppression
  };

  // Méthode pour supprimer un fichier par index (utilisée dans le template)
  removeFileFromList(index: number): void {
    if (index >= 0 && index < this.uploadedDocuments.length) {
      const fileName = this.uploadedDocuments[index].name;
      
      // Supprimer de la liste des documents uploadés
      this.uploadedDocuments.splice(index, 1);
      
      // Supprimer aussi de fileList si nécessaire
      if (index < this.fileList.length) {
        this.fileList.splice(index, 1);
      }
      
      console.log(`Fichier "${fileName}" supprimé. Total restant:`, this.uploadedDocuments.length);
      this.message.info(`Fichier "${fileName}" supprimé`);
    }
  }

  // Navigation entre les étapes
  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    this.currentStep--;
  }

  private validateCurrentStep(): boolean {
    const step = this.currentStep;
    let fieldsToValidate: string[] = [];

    switch (step) {
      case 0: // Informations de base
        fieldsToValidate = ['titre', 'description', 'type_evenement_libre'];
        break;
      case 1: // Date et lieu
        fieldsToValidate = ['date_debut', 'heure_debut', 'date_fin', 'heure_fin', 'lieu'];
        break;
      case 2: // Paramètres avancés
        fieldsToValidate = ['id_souscription'];
        break;
    }

    let isValid = true;
    fieldsToValidate.forEach(field => {
      const control = this.eventForm.get(field);
      if (control && control.invalid) {
        control.markAsTouched();
        isValid = false;
      }
    });

    // Validation spéciale pour les dates
    if (step === 1 && isValid) {
      isValid = this.validateDates();
    }

    return isValid;
  }

  private validateDates(): boolean {
    const dateDebut = this.eventForm.get('date_debut')?.value;
    const heureDebut = this.eventForm.get('heure_debut')?.value;
    const dateFin = this.eventForm.get('date_fin')?.value;
    const heureFin = this.eventForm.get('heure_fin')?.value;

    if (dateDebut && heureDebut && dateFin && heureFin) {
      const debut = new Date(dateDebut);
      debut.setHours(heureDebut.getHours(), heureDebut.getMinutes());

      const fin = new Date(dateFin);
      fin.setHours(heureFin.getHours(), heureFin.getMinutes());

      if (fin <= debut) {
        this.message.error('La date de fin doit être postérieure à la date de début');
        return false;
      }

      // Vérifier que l'événement n'est pas dans le passé
      const now = new Date();
      if (debut < now) {
        this.message.error('La date de début ne peut pas être dans le passé');
        return false;
      }
    }

    return true;
  }

  onSubmit(): void {
    if (this.eventForm.valid && this.validateDates()) {
      this.isSubmitting = true;
      
      const formData = this.eventForm.value;
      const eventData: CreateEventData = this.prepareEventData(formData);

      console.log('Données à envoyer:', eventData);
      console.log('Documents à joindre:', this.uploadedDocuments);

      // Simulation d'appel API
      setTimeout(() => {
        this.isSubmitting = false;
        this.notification.success(
          'Événement créé',
          `L'événement a été créé avec succès! ${this.uploadedDocuments.length} document(s) joint(s).`
        );
        this.router.navigate(['/dashboard/admin/events']);
      }, 2000);

      // Code pour un vrai appel API avec FormData :
      /*
      const formDataToSend = new FormData();
      Object.keys(eventData).forEach(key => {
        if (key !== 'documents') {
          formDataToSend.append(key, eventData[key as keyof CreateEventData] as string);
        }
      });
      this.uploadedDocuments.forEach((file, index) => {
        formDataToSend.append(`documents[${index}]`, file);
      });
      this.evenementsService.createEvenement(formDataToSend).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.notification.success('Événement créé', 'L\'événement a été créé avec succès!');
          this.router.navigate(['/dashboard/admin/events']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.message.error('Erreur lors de la création de l\'événement');
          console.error('Erreur:', error);
        }
      });
      */
    } else {
      this.message.error('Veuillez corriger les erreurs dans le formulaire');
      this.markAllFieldsAsTouched();
    }
  }

  private prepareEventData(formData: any): CreateEventData {
    const dateDebut = new Date(formData.date_debut);
    dateDebut.setHours(formData.heure_debut.getHours(), formData.heure_debut.getMinutes());

    const dateFin = new Date(formData.date_fin);
    dateFin.setHours(formData.heure_fin.getHours(), formData.heure_fin.getMinutes());

    return {
      id_type_evenement: 1, // Valeur par défaut
      id_souscription: formData.id_souscription,
      titre: formData.titre.trim(),
      description: formData.description.trim(),
      type_evenement_libre: formData.type_evenement_libre.trim(),
      date_debut_evenement: dateDebut.toISOString(),
      date_fin_evenement: dateFin.toISOString(),
      lieu: formData.lieu.trim(),
      est_public: formData.est_public,
      documents: this.uploadedDocuments
    };
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.eventForm.controls).forEach(key => {
      this.eventForm.get(key)?.markAsTouched();
    });
  }

  // Méthodes utilitaires pour le template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.eventForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.eventForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
    }
    return '';
  }

  getSouscriptionLabel(souscription: ApiSouscription): string {
    return `#${souscription.id_souscription} - ${souscription.terrain.libelle} (${this.souscriptionService.formatCurrency(souscription.montant_total_souscrit)})`;
  }

  resetForm(): void {
    this.eventForm.reset();
    this.currentStep = 0;
    this.fileList = [];
    this.uploadedDocuments = [];
    this.eventForm.patchValue({
      est_public: true
    });
    this.message.info('Formulaire réinitialisé');
  }

  cancel(): void {
    this.router.navigate(['/dashboard/admin/events']);
  }

  // Utilitaires pour les fichiers
  getFileIcon(file: NzUploadFile): string {
    if (file.type) {
      if (file.type.startsWith('image/')) {
        return 'picture';
      } else if (file.type.startsWith('video/')) {
        return 'video-camera';
      }
    }
    
    // Fallback basé sur l'extension
    if (file.name) {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        return 'picture';
      } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
        return 'video-camera';
      }
    }
    
    return 'file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}