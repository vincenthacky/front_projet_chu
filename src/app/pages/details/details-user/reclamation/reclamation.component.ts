import { ReclamationService, ApiReclamation, CreateReclamationData } from './../../../../core/services/reclamations.service';
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
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiSouscription, SouscriptionService } from 'src/app/core/services/souscription.service';

@Component({
  selector: 'app-reclamation',
  standalone: true,
  imports: [
    CommonModule, NzTableModule, NzTagModule, NzButtonModule, NzModalModule,
    NzFormModule, NzInputModule, NzSelectModule, NzDatePickerModule,
    NzPaginationModule, FormsModule, ReactiveFormsModule
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
    private notification: NzNotificationService
  ) {
    this.form = this.fb.group({
      souscription: [null, Validators.required],
      titre: [null, [Validators.required, Validators.maxLength(255)]],
      description: [null, [Validators.required]],
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
    this.souscriptionService.getMesSouscriptions({ per_page: 1000 }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.souscription = response.data;
          console.log('Souscriptions chargées:', this.souscription);
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement souscriptions:', err);
      }
    });
  }

  chargerMesReclamations(): void {
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
        }
      },
      error: (err: any) => {
        console.error('Erreur chargement réclamations:', err);
      }
    });
  }

  showModal(): void {
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
    // Débugger les valeurs avant validation
    this.debugFormValues();

    if (this.form.valid) {
      const value = this.form.value;
      
      console.log('✅ Valeurs du formulaire:', value);
      
      // Vérifier que la souscription est bien sélectionnée
      if (!value.souscription) {
        this.notification.error(
          'Erreur',
          'Veuillez sélectionner une souscription',
          { 
            nzDuration: 5000,
            nzPlacement: 'top'
          }
        );
        return;
      }

      // CORRECTION: Structure exacte des données
      const newReclamation: CreateReclamationData = {
        id_souscription: Number(value.souscription), // S'assurer que c'est un nombre
        titre: value.titre.trim(), // Enlever les espaces
        description: value.description.trim(),
        type_reclamation: value.type_reclamation,
        id_statut_reclamation: 3, // 3 = "en attente"
        priorite: value.priorite || 'normale', // Valeur par défaut
        document: this.selectedFile || undefined // Fichier ou undefined
      };

      console.log('📤 Données à envoyer à l\'API:', {
        id_souscription: newReclamation.id_souscription,
        titre: newReclamation.titre,
        description: newReclamation.description,
        type_reclamation: newReclamation.type_reclamation,
        id_statut_reclamation: newReclamation.id_statut_reclamation,
        priorite: newReclamation.priorite,
        hasDocument: !!newReclamation.document,
        documentInfo: newReclamation.document ? {
          name: newReclamation.document.name,
          size: newReclamation.document.size,
          type: newReclamation.document.type
        } : null
      });

      // NOUVEAU: Test avec des noms de champs alternatifs
      console.log('🔍 Types des données:');
      console.log('- id_souscription type:', typeof newReclamation.id_souscription);
      console.log('- id_souscription value:', newReclamation.id_souscription);
      console.log('- titre length:', newReclamation.titre.length);
      console.log('- description length:', newReclamation.description.length);

      // Vérification supplémentaire des champs obligatoires
      if (!newReclamation.titre || !newReclamation.description || !newReclamation.type_reclamation) {
        this.notification.error(
          'Erreur de validation',
          'Tous les champs obligatoires doivent être remplis',
          { nzDuration: 5000, nzPlacement: 'top' }
        );
        return;
      }

      this.reclamationService.createReclamation(newReclamation).subscribe({
        next: (response: any) => {
          if (response.success) {
            // Notification de succès avec le message de l'API
            this.notification.success(
              'Succès',
              response.message || 'Réclamation créée avec succès !',
              { 
                nzDuration: 4000,
                nzPlacement: 'top'
              }
            );
            console.log('✅ Réclamation créée avec succès:', response.data);
            this.chargerMesReclamations(); // Recharger la liste
            this.isModalVisible = false; // Fermer le modal
            this.form.reset({ 
              priorite: 'normale'
            });
            this.selectedFile = null;
            // Vider le champ fichier dans le DOM
            this.resetFileInput();
          } else {
            // Notification d'erreur avec le message de l'API
            this.notification.error(
              'Erreur',
              response.message || 'Erreur lors de la création de la réclamation',
              { 
                nzDuration: 5000,
                nzPlacement: 'top'
              }
            );
          }
        },
        error: (err: any) => {
          console.error('❌ Erreur création réclamation:', err);
          console.error('❌ Détails de l\'erreur:', err.error);
          
          // Extraire les erreurs de validation si elles existent
          let errorMessage = 'Erreur lors de la création de la réclamation';
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error?.errors) {
            // Afficher les erreurs de validation
            const errors = Object.values(err.error.errors).flat();
            errorMessage = errors.join(', ');
          } else if (err.status === 0) {
            errorMessage = 'Erreur de connexion au serveur';
          } else if (err.status >= 500) {
            errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
          }
          
          this.notification.error(
            'Erreur',
            errorMessage,
            { 
              nzDuration: 7000,
              nzPlacement: 'top'
            }
          );
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.values(this.form.controls).forEach(control => control.markAsTouched());
      
      // Identifier les champs manquants
      const missingFields: string[] = [];
      if (!this.form.get('souscription')?.value) missingFields.push('Souscription');
      if (!this.form.get('titre')?.value) missingFields.push('Titre');
      if (!this.form.get('description')?.value) missingFields.push('Description');
      if (!this.form.get('type_reclamation')?.value) missingFields.push('Type de réclamation');
      
      this.notification.warning(
        'Champs manquants',
        `Veuillez remplir : ${missingFields.join(', ')}`,
        { 
          nzDuration: 4000,
          nzPlacement: 'top'
        }
      );
    }
  }

  handleCancel(): void {
    this.isModalVisible = false;
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
        this.notification.error(
          'Erreur',
          'Le fichier est trop volumineux. Taille maximum autorisée : 10MB',
          { nzDuration: 5000, nzPlacement: 'top' }
        );
        this.resetFileInput();
        return;
      }

      // Vérifier le type
      if (!allowedTypes.includes(file.type)) {
        this.notification.error(
          'Erreur',
          'Type de fichier non autorisé. Formats acceptés : JPG, PNG, PDF, DOC, DOCX, XLS, XLSX',
          { nzDuration: 5000, nzPlacement: 'top' }
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
      
      this.notification.success(
        'Fichier sélectionné',
        `${file.name} (${this.formatFileSize(file.size)})`,
        { nzDuration: 3000, nzPlacement: 'top' }
      );
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