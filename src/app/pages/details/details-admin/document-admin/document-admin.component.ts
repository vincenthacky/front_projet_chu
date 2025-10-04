import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiDocument } from 'src/app/core/models/documents';
import { DocumentService } from 'src/app/core/services/documents.service';
import { SouscriptionService } from 'src/app/core/services/souscription.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-document-admin',
  standalone: true,
  imports: [ 
    CommonModule, 
    ReactiveFormsModule,
    NzButtonModule, 
    NzIconModule, 
    NzPaginationModule,
    NzSpinModule,
    NzEmptyModule,
    NzCardModule,
    NzTagModule,
    NzToolTipModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzUploadModule,
    NzStepsModule
  ],
  templateUrl: './document-admin.component.html',
  styleUrl: './document-admin.component.css'
})
export class DocumentAdminComponent implements OnInit {
  documents: ApiDocument[] = [];
  loading: boolean = false;
  error: string | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 1;
  pageSize: number = 10; // Augmenté à 10 documents par page
  totalDocuments: number = 0;

  // Propriétés pour le modal de visualisation
  isModalVisible = false;
  selectedDocument: ApiDocument | null = null;
  documentUrl: string = '';
  safeDocumentUrl: SafeResourceUrl | null = null;

  // Propriétés pour le modal d'ajout de document
  isAddDocumentModalVisible = false;
  addDocumentForm!: FormGroup;
  currentStep = 0;
  isSubmittingDocument = false;

  // Données pour le formulaire d'ajout
  utilisateursList: any[] = [];
  availableSouscriptionsDocument: any[] = [];
  selectedUtilisateurDocument: any = null;
  selectedSouscriptionDocument: any = null;

  // Gestion des fichiers
  selectedDocumentFile: File | null = null;
  documentFileList: NzUploadFile[] = [];

  constructor(
    public documentService: DocumentService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private souscriptionService: SouscriptionService,
    private message: NzMessageService
  ) { 
    this.initAddDocumentForm();
  }

  ngOnInit(): void {
    this.chargerTousLesDocuments();
  }

  onPageSizeChange(size: number): void {
    console.log('Changement de taille de page de', this.pageSize, 'vers', size);
    this.pageSize = size;
    this.currentPage = 1; // Retour à la première page
    this.chargerTousLesDocuments();
  }

  /**
   * CORRECTION: Charge TOUS les documents (pas seulement ceux de l'utilisateur)
   */
  chargerTousLesDocuments(): void {
    console.log('🔍 Chargement de tous les documents...');
    this.loading = true;
    this.error = null;
    
    // CORRECTION: Utiliser getAllDocuments au lieu de getMesDocuments
    this.documentService.getAllDocuments({ 
      page: this.currentPage, 
      per_page: this.pageSize 
    }).subscribe({
      next: (response: any) => {
        console.log('📡 Réponse API:', response);
        
        if (response.success && response.data) {
          this.documents = response.data;
          this.totalDocuments = response.pagination?.total || 0;
          
          console.log('✅ Documents récupérés:', this.documents.length);
          console.log('📊 Total documents dans la base:', this.totalDocuments);
          
          // Log des premiers documents pour debug
          if (this.documents.length > 0) {
            console.log('📄 Premier document:', this.documents[0]);
          }
        } else {
          console.warn('⚠️ Réponse API sans succès:', response);
          this.documents = [];
          this.totalDocuments = 0;
        }
        
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur lors du chargement des documents:', err);
        this.error = 'Impossible de charger les documents. Veuillez réessayer.';
        this.documents = [];
        this.totalDocuments = 0;
        this.loading = false;
      }
    });
  }

  /**
   * Gère le changement de page
   */
  onPageChange(page: number): void {
    console.log('📄 Changement de page vers:', page);
    this.currentPage = page;
    this.chargerTousLesDocuments();
  }

  /**
   * Ouvre le modal pour visualiser le document
   */
  onConsulter(document: ApiDocument): void {
    console.log('Consultation du document:', document);
    this.selectedDocument = document;
    this.documentUrl = this.documentService.getDocumentUrl(document.chemin_fichier);
    this.safeDocumentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.documentUrl);
    this.isModalVisible = true;
  }

  /**
   * Télécharge un document
   */
  public telechargerDocument(doc: ApiDocument): void {
    console.log('⬇️ Téléchargement du document:', doc.nom_original);
    
    this.documentService.telechargerDocument(doc.id_document).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.nom_original;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Document téléchargé avec succès:', doc.nom_original);
      },
      error: (err: any) => {
        console.error('❌ Erreur lors du téléchargement:', err);
        this.error = 'Erreur lors du téléchargement du document';
      }
    });
  }

  /**
   * Rafraîchit la liste des documents
   */
  rafraichir(): void {
    console.log('🔄 Rafraîchissement de la liste des documents');
    this.currentPage = 1;
    this.chargerTousLesDocuments();
  }

  /**
   * Retourne l'icône appropriée pour le type de fichier
   */
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'file-image';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'video-camera';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'xls':
      case 'xlsx':
        return 'file-excel';
      default:
        return 'file';
    }
  }

  /**
   * Formate la taille du fichier
   */
  formatTaille(taille: number): string {
    return this.documentService.formatTailleFichier(taille);
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatutClass(statut: string): string {
    return this.documentService.getStatutClass(statut);
  }

  /**
   * Retourne le label du statut
   */
  getStatutLabel(statut: string): string {
    return this.documentService.getStatutLabel(statut);
  }

  /**
   * Vérifie si le document est récent (moins de 7 jours)
   */
  isRecent(date: string): boolean {
    return this.documentService.isRecent(date);
  }

  /**
   * Formate la date de téléchargement
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }

  /**
   * Retourne le nom du type de document
   */
  getTypeDocument(document: ApiDocument): string {
    return document.type_document?.libelle_type_document || 'Type non défini';
  }

  /**
   * Retourne des informations sur la souscription liée
   */
  getSouscriptionInfo(document: ApiDocument): string {
    if (document.souscription) {
      return `Souscription #${document.souscription.id_souscription}`;
    }
    return 'Aucune souscription liée';
  }

  /**
   * Réessaie le chargement en cas d'erreur
   */
  retry(): void {
    this.error = null;
    this.chargerTousLesDocuments();
  }

  /**
   * Détermine si le fichier est une image
   */
  isImage(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  }

  /**
   * Obtient la couleur du tag selon le type de document
   */
  getDocumentTypeColor(typeDocument: string): string {
    switch (typeDocument) {
      case 'CNI':
        return 'blue';
      case 'Photo de Profil':
        return 'green';
      case 'Carte Professionnelle':
        return 'orange';
      case 'Fiche de Souscription':
        return 'purple';
      default:
        return 'default';
    }
  }

  /**
   * Gère les erreurs de chargement d'images
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    // Utiliser l'image d'erreur depuis la racine public (comme pour login avec favicon.ico)
    target.src = 'image-error.png';
  }

  /**
   * Ouvre le document pour visualisation
   */
  ouvrirDocument(doc: ApiDocument): void {
    this.onConsulter(doc);
  }

  /**
   * Génère la description de la carte
   */
  getCardDescription(doc: ApiDocument): string {
    return `${this.getTypeDocument(doc)} • ${this.formatDate(doc.date_telechargement)}`;
  }

  /**
   * Formate la taille du fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.isModalVisible = false;
    this.selectedDocument = null;
    this.documentUrl = '';
    this.safeDocumentUrl = null;
  }

  /**
   * Détermine si le fichier est un PDF
   */
  isPdf(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'pdf';
  }

  /**
   * Détermine si le fichier est une vidéo
   */
  isVideo(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension || '');
  }

  /**
   * Ouvre le document dans un nouvel onglet
   */
  openInNewTab(): void {
    if (this.documentUrl) {
      window.open(this.documentUrl, '_blank');
    }
  }

  // ===============================================
  // MÉTHODES POUR LE MODAL D'AJOUT DE DOCUMENT
  // ===============================================

  /**
   * Initialise le formulaire d'ajout de document
   */
  private initAddDocumentForm(): void {
    this.addDocumentForm = this.fb.group({
      id_utilisateur: ['', [Validators.required]],
      id_souscription: ['', [Validators.required]],
      libelle_type_document: ['', [Validators.required, Validators.maxLength(100)]],
      document: ['', [Validators.required]]
    });
  }

  /**
   * Ouvre le modal d'ajout de document
   */
  openAddDocumentModal(): void {
    console.log('Ouverture du modal d\'ajout de document');
    this.isAddDocumentModalVisible = true;
    this.currentStep = 0;
    this.loadUtilisateurs();
    this.resetAddDocumentForm();
  }

  /**
   * Ferme le modal d'ajout de document
   */
  closeAddDocumentModal(): void {
    this.isAddDocumentModalVisible = false;
    this.currentStep = 0;
    this.resetAddDocumentForm();
  }

  /**
   * Remet à zéro le formulaire d'ajout
   */
  private resetAddDocumentForm(): void {
    this.addDocumentForm.reset();
    this.selectedUtilisateurDocument = null;
    this.selectedSouscriptionDocument = null;
    this.availableSouscriptionsDocument = [];
    this.selectedDocumentFile = null;
    this.documentFileList = [];
    this.isSubmittingDocument = false;
  }

  /**
   * Charge la liste des utilisateurs via les souscriptions
   */
  private loadUtilisateurs(): void {
    // Récupérer toutes les souscriptions avec les utilisateurs
    this.souscriptionService.getAllSouscriptions({ all_users: true, admin_view: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Extraire les utilisateurs uniques des souscriptions
          const utilisateursMap = new Map();
          response.data.forEach((souscription: any) => {
            if (souscription.utilisateur) {
              utilisateursMap.set(souscription.utilisateur.id_utilisateur, souscription.utilisateur);
            }
          });
          this.utilisateursList = Array.from(utilisateursMap.values());
          console.log('Utilisateurs chargés:', this.utilisateursList.length);
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.message.error('Erreur lors du chargement des utilisateurs');
      }
    });
  }

  /**
   * Gère le changement d'utilisateur
   */
  onUtilisateurDocumentChange(userId: number): void {
    this.selectedUtilisateurDocument = this.utilisateursList.find(u => u.id_utilisateur === userId);
    console.log('Utilisateur sélectionné:', this.selectedUtilisateurDocument);
    
    if (this.selectedUtilisateurDocument) {
      this.loadSouscriptionsForUtilisateur(userId);
    }
  }

  /**
   * Charge les souscriptions pour l'utilisateur sélectionné
   */
  private loadSouscriptionsForUtilisateur(userId: number): void {
    // Filtrer les souscriptions déjà chargées pour l'utilisateur sélectionné
    this.souscriptionService.getAllSouscriptions({ all_users: true, admin_view: true }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.availableSouscriptionsDocument = response.data.filter(
            (souscription: any) => souscription.utilisateur?.id_utilisateur === userId
          );
          console.log('Souscriptions chargées:', this.availableSouscriptionsDocument.length);
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des souscriptions:', err);
        this.message.error('Erreur lors du chargement des souscriptions');
      }
    });
  }

  /**
   * Gère le changement de souscription
   */
  onSouscriptionDocumentChange(souscriptionId: number): void {
    this.selectedSouscriptionDocument = this.availableSouscriptionsDocument.find(s => s.id_souscription === souscriptionId);
    console.log('Souscription sélectionnée:', this.selectedSouscriptionDocument);
  }

  /**
   * Gestion de l'upload de fichier
   */
  beforeUploadDocument = (file: NzUploadFile): boolean => {
    // Vérification du type de fichier
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (!allowedTypes.includes(file.type!)) {
      this.message.error('Type de fichier non autorisé. Utilisez PDF, DOC, DOCX, JPG, PNG ou GIF.');
      return false;
    }

    // Vérification de la taille (10MB max)
    const isLt10M = file.size! / 1024 / 1024 < 10;
    if (!isLt10M) {
      this.message.error('Le fichier doit faire moins de 10MB');
      return false;
    }

    // Stockage du fichier
    this.selectedDocumentFile = file as any as File;
    this.addDocumentForm.patchValue({ document: file.name });
    this.documentFileList = [file];
    
    console.log('Fichier sélectionné:', file.name, file.size);
    return false; // Empêche l'upload automatique
  };

  /**
   * Suppression du fichier sélectionné
   */
  removeDocumentFile = (): boolean => {
    this.selectedDocumentFile = null;
    this.addDocumentForm.patchValue({ document: '' });
    this.documentFileList = [];
    return true;
  };

  /**
   * Retourne l'icône pour le type de fichier
   */
  getFileIconType(fileName: string): string {
    return this.documentService.getFileIcon(fileName);
  }


  /**
   * Obtient le nom d'affichage d'un utilisateur
   */
  getUtilisateurDisplayName(utilisateur: any): string {
    if (!utilisateur) return '';
    return `${utilisateur.prenom} ${utilisateur.nom} (${utilisateur.email})`;
  }

  /**
   * Obtient le nom d'affichage d'une souscription
   */
  getSouscriptionDisplayName(souscription: any): string {
    if (!souscription) return '';
    return `#${souscription.id_souscription} - ${souscription.statut_souscription} (${souscription.nombre_terrains} terrain(s))`;
  }

  /**
   * Formate un montant en devise
   */
  formatCurrencyAmount(amount: any): string {
    if (!amount) return '0 FCFA';
    return this.souscriptionService.formatCurrency(parseFloat(amount.toString()));
  }

  /**
   * Navigation - étape suivante
   */
  nextDocumentStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  /**
   * Navigation - étape précédente
   */
  previousDocumentStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  /**
   * Vérifie si l'étape actuelle est valide
   */
  isCurrentDocumentStepValid(): boolean {
    switch (this.currentStep) {
      case 0:
        return this.addDocumentForm.get('id_utilisateur')?.valid || false;
      case 1:
        return this.addDocumentForm.get('id_souscription')?.valid || false;
      case 2:
        return (this.addDocumentForm.get('libelle_type_document')?.valid || false) && !!this.selectedDocumentFile;
      case 3:
        return this.addDocumentForm.valid && !!this.selectedDocumentFile;
      default:
        return false;
    }
  }

  /**
   * Soumet le formulaire d'ajout de document
   */
  submitAddDocument(): void {
    if (!this.addDocumentForm.valid || !this.selectedDocumentFile) {
      this.message.error('Veuillez remplir tous les champs requis');
      return;
    }

    this.isSubmittingDocument = true;

    // Création du FormData pour l'envoi
    const formData = new FormData();
    formData.append('id_utilisateur', this.addDocumentForm.get('id_utilisateur')?.value);
    formData.append('id_souscription', this.addDocumentForm.get('id_souscription')?.value);
    formData.append('libelle_type_document', this.addDocumentForm.get('libelle_type_document')?.value);
    formData.append('document', this.selectedDocumentFile);

    console.log('Envoi du document:', {
      id_utilisateur: this.addDocumentForm.get('id_utilisateur')?.value,
      id_souscription: this.addDocumentForm.get('id_souscription')?.value,
      libelle_type_document: this.addDocumentForm.get('libelle_type_document')?.value,
      fileName: this.selectedDocumentFile.name
    });

    // Appel au service
    this.documentService.ajouterDocumentSouscripteur(formData).subscribe({
      next: (response) => {
        console.log('Document ajouté avec succès:', response);
        this.message.success('Document ajouté avec succès');
        this.closeAddDocumentModal();
        this.rafraichir(); // Recharge la liste des documents
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout du document:', err);
        this.message.error('Erreur lors de l\'ajout du document');
        this.isSubmittingDocument = false;
      }
    });
  }
}