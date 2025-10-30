import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Subject, Observable, of, debounceTime, distinctUntilChanged, takeUntil, tap, catchError } from 'rxjs';
import { User } from 'src/app/core/models/auth';
import { AuthService } from 'src/app/core/services/auth.service';
import { environment } from '@/environment';

// Interface pour les documents
interface DocumentData {
  id_document: number;
  id_souscription: number | null;
  id_type_document: number;
  source_table: string;
  id_source: number;
  nom_fichier: string;
  nom_original: string;
  chemin_fichier: string;
  type_mime: string | null;
  taille_fichier: number;
  description_document: string;
  version_document: number;
  date_telechargement: string;
  statut_document: string;
  created_at: string;
  updated_at: string;
}

// Interface pour les documents utilisateur
interface UserDocuments {
  carte_professionnelle?: DocumentData;
  cni?: DocumentData;
  photo_profil?: DocumentData;
  fiche_souscription?: DocumentData;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzStatisticModule,
    NzTagModule,
    NzGridModule,
    NzSpaceModule,
    NzDropDownModule,
    NzMenuModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    NzCheckboxModule,
    NzRadioModule,
    NzDividerModule,
    NzAlertModule,
    NzDescriptionsModule,
    NzUploadModule,
    NzAvatarModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Statistiques
  totalUsers = 0;
  totalAdmins = 0;
  totalRegularUsers = 0;

  // Modal de modification
  isEditModalVisible = false;
  editForm!: FormGroup;
  editingUser: User | null = null;
  isEditLoading = false;

  // Modal de changement de statut
  isStatusModalVisible = false;
  selectedUserForStatus: User | null = null;
  newStatus: 'actif' | 'suspendu' | 'inactif' = 'actif';
  isStatusLoading = false;

  // Documents de l'utilisateur en cours de modification
  editUserDocuments: UserDocuments | null = null;

  // Modal pour l'affichage des documents
  isDocumentModalVisible = false;
  selectedDocument: DocumentData | null = null;

  // Fichiers en cours d'upload pour l'édition
  editUploadFiles: { [key: string]: File } = {};

  // Aperçu de la nouvelle photo de profil
  editPhotoProfilPreview: string | null = null;

  // Options de statut
  statusOptions = [
    { label: 'Actif', value: 'actif' },
    { label: 'Suspendu', value: 'suspendu' },
    { label: 'Inactif', value: 'inactif' }
  ];

  // Options de type d'utilisateur
  userTypeOptions = [
    { label: 'Utilisateur', value: 'user' },
    { label: 'Administrateur', value: 'admin' },
    { label: 'Super Admin', value: 'superAdmin' }  
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private message: NzMessageService,
    private notification: NzNotificationService
  ) {
    this.initEditForm();
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initEditForm(): void {
    this.editForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      poste: [''],
      service: [''],
      type: ['', Validators.required],
      est_administrateur: [false],
      statut_utilisateur: ['', Validators.required]
    });
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      console.log('🔍 Recherche:', term);
      this.searchTerm = term;
      this.currentPage = 1;
      this.applyFiltersAndPagination();
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onPageChange(page: number): void {
    console.log('📄 Changement de page:', page);
    this.currentPage = page;
    this.applyFiltersAndPagination();
  }

  onPageSizeChange(size: number): void {
    console.log('📄 Changement taille page:', size);
    this.pageSize = size;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  private loadUsers(): void {
    console.log('📋 Chargement des utilisateurs...');
    this.loading = true;

    this.authService.getAllUsers().pipe(
      tap(users => {
        console.log('✅ Utilisateurs récupérés:', users);
        console.log('📊 Nombre d\'utilisateurs:', users.length);  // Devrait log 30 maintenant
      }),
      catchError(error => {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
        this.message.error('Erreur lors du chargement des utilisateurs');
        this.loading = false;
        return of([]);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (users: User[]) => {
        this.users = users;  // users.length = 30 maintenant
        this.calculateStatistics();  // Basé sur 30
        this.applyFiltersAndPagination();  // totalItems = 30
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
        this.users = [];
        this.filteredUsers = [];
        this.totalItems = 0;
        this.resetStatistics();
        this.loading = false;
      }
    });
  }

  private calculateStatistics(): void {
    this.totalUsers = this.users.length;
    this.totalAdmins = this.users.filter(user => this.isAdmin(user)).length;
    this.totalRegularUsers = this.users.filter(user => !this.isAdmin(user)).length;

    console.log('📊 Statistiques calculées:', {
      total: this.totalUsers,
      admins: this.totalAdmins,
      users: this.totalRegularUsers
    });
  }

  private resetStatistics(): void {
    this.totalUsers = 0;
    this.totalAdmins = 0;
    this.totalRegularUsers = 0;
  }

  private applyFiltersAndPagination(): void {
    console.log('🔄 Application des filtres et pagination...');
    
    if (this.searchTerm && this.searchTerm.trim()) {
      const lowerTerm = this.searchTerm.toLowerCase().trim();
      this.filteredUsers = this.users.filter(user => {
        const nomMatch = user.nom?.toLowerCase().includes(lowerTerm) || false;
        const prenomMatch = user.prenom?.toLowerCase().includes(lowerTerm) || false;
        const emailMatch = user.email?.toLowerCase().includes(lowerTerm) || false;
        const matriculeMatch = user.matricule?.toLowerCase().includes(lowerTerm) || false;
        const telephoneMatch = user.telephone?.includes(lowerTerm) || false;
        
        return nomMatch || prenomMatch || emailMatch || matriculeMatch || telephoneMatch;
      });
      console.log('🔍 Filtrage appliqué. Résultats:', this.filteredUsers.length);
    } else {
      this.filteredUsers = [...this.users];
      console.log('📋 Aucun filtre. Tous les utilisateurs:', this.filteredUsers.length);  // 30 maintenant
    }

    this.totalItems = this.filteredUsers.length;  // 30 maintenant

    console.log('📄 Pagination mise à jour:', {
      page: this.currentPage,
      pageSize: this.pageSize,
      total: this.totalItems
    });
  }

  getPaginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  refresh(): void {
    console.log('🔄 Rafraîchissement des utilisateurs...');
    this.loadUsers();
  }

  clearSearch(): void {
    console.log('🧹 Réinitialisation de la recherche...');
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  editUser(user: User): void {
    console.log('✏️ Modifier utilisateur:', user);
    this.isEditLoading = true;

    this.authService.getUserProfile(user.id_utilisateur).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('👤 Profil utilisateur récupéré:', response);
        this.editingUser = response.data;
        this.populateEditForm(response.data);
        this.loadUserDocuments(response.data);
        this.isEditModalVisible = true;
        this.isEditLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur récupération profil:', error);
        this.message.error('Erreur lors de la récupération du profil utilisateur');
        this.isEditLoading = false;
      }
    });
  }

  private populateEditForm(user: User): void {
    console.log('🔍 Type actuel de l\'utilisateur:', user.type);
    console.log('🔍 Valeurs disponibles:', this.userTypeOptions);
    
    this.editForm.patchValue({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone || '',
      poste: user.poste || '',
      service: user.service || '',
      type: user.type,
      est_administrateur: user.est_administrateur,
      statut_utilisateur: user.statut_utilisateur
    });
  }

  // CORRECTION: Méthode pour les modifications sans fichiers
  submitEdit(): void {
    if (this.editForm.valid && this.editingUser) {
      this.isEditLoading = true;
      const formData = this.editForm.value;

      console.log('📝 Données à modifier (avant correction):', formData);
      console.log('📝 Type de est_administrateur avant:', typeof formData.est_administrateur);

      // CORRECTION: S'assurer que est_administrateur est un booléen strict
      const correctedFormData = {
        ...formData,
        est_administrateur: Boolean(formData.est_administrateur)
      };

      console.log('📝 Données corrigées:', correctedFormData);
      console.log('📝 Type de est_administrateur après:', typeof correctedFormData.est_administrateur);

      // Vérification du type
      const validTypes = this.userTypeOptions.map(opt => opt.value);
      if (!validTypes.includes(correctedFormData.type)) {
        console.error('❌ Type invalide:', correctedFormData.type);
        this.message.error('Type d\'utilisateur invalide');
        this.isEditLoading = false;
        return;
      }

      this.authService.updateUserProfile(this.editingUser.id_utilisateur, correctedFormData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          console.log('✅ Utilisateur modifié avec succès:', response);
          this.message.success('Utilisateur modifié avec succès');
          
          this.isEditLoading = false;
          this.closeEditModal();
          this.loadUsers();
        },
        error: (error) => {
          console.error('❌ Erreur modification utilisateur:', error);
          this.handleFormError(error);
          this.isEditLoading = false;
        }
      });
    } else {
      this.handleInvalidForm();
    }
  }

  // CORRECTION: Méthode pour les modifications avec fichiers
  submitEditWithDocuments(): void {
    if (this.editForm.valid && this.editingUser) {
      this.isEditLoading = true;
      
      // Créer un FormData avec les données du formulaire et les fichiers
      const formData = new FormData();
      
      // Ajouter les données du formulaire avec correction des booléens
      const formValues = this.editForm.value;
      console.log('📝 Valeurs formulaire avant traitement:', formValues);
      
      Object.keys(formValues).forEach(key => {
        if (formValues[key] !== null && formValues[key] !== undefined) {
          let value = formValues[key];
          
          // CORRECTION: Conversion explicite des booléens pour FormData
          if (key === 'est_administrateur') {
            // Convertir en booléen puis en chaîne pour FormData
            const boolValue = Boolean(value);
            value = boolValue.toString();
            console.log(`📎 Conversion ${key}: ${formValues[key]} → ${boolValue} → "${value}" (${typeof value})`);
          }
          
          formData.append(key, value);
        }
      });

      // Ajouter les fichiers s'ils existent
      Object.keys(this.editUploadFiles).forEach(documentType => {
        const file = this.editUploadFiles[documentType];
        if (file) {
          formData.append(documentType, file);
          console.log(`📎 Ajout du fichier ${documentType}:`, file.name);
        }
      });
      console.log('📝 Envoi des données de modification avec la nouvelle API POST...');

      // Utiliser la nouvelle méthode API POST
      this.authService.updateUserWithFormData(this.editingUser.id_utilisateur, formData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          console.log('✅ Utilisateur modifié avec succès via POST:', response);
          this.handleSuccessfulUpdate(response);
        },
        error: (error: any) => {
          console.error('❌ Erreur modification utilisateur via POST:', error);
          this.handleFormError(error);
        }
      });
    } else {
      this.handleInvalidForm();
    }
  }

  // CORRECTION: Gestion améliorée des erreurs de formulaire
  private handleFormError(error: any): void {
    console.error('📋 Détail de l\'erreur:', error);
    
    if (error.error && error.error.errors) {
      // Gestion des erreurs de validation détaillées
      const validationErrors = error.error.errors;
      console.error('📋 Erreurs de validation:', validationErrors);
      
      const errorMessages = Object.keys(validationErrors).map(key => {
        const messages = Array.isArray(validationErrors[key]) 
          ? validationErrors[key] 
          : [validationErrors[key]];
        return `${key}: ${messages.join(', ')}`;
      }).join(' | ');
      
      this.message.error(`Erreurs de validation: ${errorMessages}`);
    } else if (error.error && error.error.message) {
      this.message.error(error.error.message);
    } else {
      this.message.error('Erreur lors de la modification de l\'utilisateur');
    }
    
    this.isEditLoading = false;
  }

  closeEditModal(): void {
    this.isEditModalVisible = false;
    this.editingUser = null;
    this.isEditLoading = false;
    this.editForm.reset();
    console.log('🚪 Modal fermée, loading arrêté');
  }

  toggleUserStatus(user: User): void {
    console.log('🔄 Changer statut utilisateur:', user);
    this.selectedUserForStatus = user;
    this.newStatus = user.statut_utilisateur;
    this.isStatusModalVisible = true;
  }

  // CORRECTION: Changement de statut avec gestion des booléens
  confirmStatusChange(): void {
    if (this.selectedUserForStatus && this.newStatus) {
      this.isStatusLoading = true;

      const updateData: Partial<User> = {
        statut_utilisateur: this.newStatus
      };

      console.log('🔄 Changement de statut - Données à envoyer:', updateData);

      this.authService.updateUserProfile(this.selectedUserForStatus.id_utilisateur, updateData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          console.log('✅ Statut modifié avec succès:', response);
          this.message.success('Statut modifié avec succès');
          this.closeStatusModal();
          this.loadUsers();
        },
        error: (error) => {
          console.error('❌ Erreur changement statut:', error);
          this.handleFormError(error);
        }
      });
    }
  }

  closeStatusModal(): void {
    this.isStatusModalVisible = false;
    this.selectedUserForStatus = null;
    this.newStatus = 'actif';
    this.isStatusLoading = false;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Non définie';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }

  getStatusLabel(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'actif':
        return 'Actif';
      case 'suspendu':
        return 'Suspendu';
      case 'inactif':
        return 'Inactif';
      default:
        return statut || 'Non défini';
    }
  }

  getStatusColor(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'actif':
        return 'green';
      case 'suspendu':
        return 'orange';
      case 'inactif':
        return 'red';
      default:
        return 'default';
    }
  }

  getUserTypeLabel(type: string): string {
    switch (type) {
      case 'superAdmin':
        return 'Super Admin';
      case 'admin':
        return 'Administrateur';
      case 'user':
        return 'Utilisateur';
      default:
        return type || 'Non défini';
    }
  }

  getUserTypeColor(type: string): string {
    switch (type) {
      case 'superAdmin':
        return 'purple';
      case 'admin':
        return 'orange';
      case 'user':
        return 'cyan';
      default:
        return 'default';
    }
  }

  isAdmin(user: User): boolean {
    return user.est_administrateur || user.type === 'superAdmin' || user.type === 'admin';
  }

  // CORRECTION: Méthodes modifiées pour la colonne Admin basée sur le type
  getAdminLabel(user: User): string {
    const type = user.type;
    return (type === 'superAdmin' || type === 'admin') ? 'Oui' : 'Non';
  }

  getAdminColor(user: User): string {
    const type = user.type;
    return (type === 'superAdmin' || type === 'admin') ? 'green' : 'red';
  }

  viewUser(user: User): void {
    console.log('👁️ Voir utilisateur:', user);
  }

  deleteUser(user: User): void {
    console.log('🗑️ Supprimer utilisateur:', user);
    this.message.info('Fonctionnalité de suppression à implémenter');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (field.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }

  trackByUserId(index: number, user: User): number {
    return user.id_utilisateur;
  }

  // Méthode pour obtenir l'URL de la photo de profil d'un utilisateur
  getUserPhotoUrl(user: User): string | undefined {
    if (user.photo_profil && user.photo_profil.chemin_fichier) {
      const imagePath = user.photo_profil.chemin_fichier.replace(/\\/g, '/');
      return `${environment.storageUrl}/${imagePath}`;
    }
    return undefined;
  }

  // Méthode pour afficher la photo de profil dans un modal
  viewUserPhoto(user: User): void {
    if (user.photo_profil) {
      const document: DocumentData = {
        ...user.photo_profil,
        id_souscription: user.photo_profil.id_souscription ?? null,
        type_mime: user.photo_profil.type_mime ?? null
      };
      this.selectedDocument = document;
      this.isDocumentModalVisible = true;
    }
  }

  // Méthode pour obtenir l'URL de la photo actuelle dans le modal d'édition
  getCurrentPhotoUrl(): string | undefined {
    if (this.photoProfilDoc && this.photoProfilDoc.chemin_fichier) {
      const imagePath = this.photoProfilDoc.chemin_fichier.replace(/\\/g, '/');
      return `${environment.storageUrl}/${imagePath}`;
    }
    return undefined;
  }

  // Méthodes pour la gestion des documents
  private loadUserDocuments(userData: any): void {
    this.editUserDocuments = {
      carte_professionnelle: userData.carte_professionnelle || null,
      cni: userData.cni || null,
      photo_profil: userData.photo_profil || null,
      fiche_souscription: userData.fiche_souscription || null
    };
    console.log('📋 Documents utilisateur chargés:', this.editUserDocuments);
  }

  // Getters pour accéder en sécurité aux documents
  get carteProf(): DocumentData | null {
    return this.editUserDocuments?.carte_professionnelle || null;
  }

  get cniDoc(): DocumentData | null {
    return this.editUserDocuments?.cni || null;
  }

  get photoProfilDoc(): DocumentData | null {
    return this.editUserDocuments?.photo_profil || null;
  }

  get ficheSouscriptionDoc(): DocumentData | null {
    return this.editUserDocuments?.fiche_souscription || null;
  }

  viewDocument(document: DocumentData): void {
    this.selectedDocument = document;
    this.isDocumentModalVisible = true;
  }

  closeDocumentModal(): void {
    this.isDocumentModalVisible = false;
    this.selectedDocument = null;
  }

  getDocumentUrl(document: DocumentData | null): string {
    if (!document || !document.chemin_fichier) return '';
    const imagePath = document.chemin_fichier.replace(/\\/g, '/');
    return `${environment.storageUrl}/${imagePath}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.nextElementSibling) {
      target.style.display = 'none';
      (target.nextElementSibling as HTMLElement).style.display = 'block';
    }
  }

  // Méthodes pour l'upload des documents dans l'édition
  beforeUploadEditCni = (file: NzUploadFile): boolean => {
    console.log('🔄 beforeUploadEditCni appelé avec:', file);
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile) {
      if (this.validateFileSize(actualFile, 'CNI')) {
        this.onEditFileChange(actualFile, 'cni');
      }
    } else {
      console.error('❌ Aucun fichier trouvé pour CNI');
    }
    return false;
  };

  beforeUploadEditCartePro = (file: NzUploadFile): boolean => {
    console.log('🔄 beforeUploadEditCartePro appelé avec:', file);
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile) {
      if (this.validateFileSize(actualFile, 'Carte Professionnelle')) {
        this.onEditFileChange(actualFile, 'carte_professionnelle');
      }
    } else {
      console.error('❌ Aucun fichier trouvé pour Carte Pro');
    }
    return false;
  };

  beforeUploadEditPhotoProfil = (file: NzUploadFile): boolean => {
    console.log('🔄 beforeUploadEditPhotoProfil appelé avec:', file);
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile) {
      if (this.validateFileSize(actualFile, 'Photo de Profil')) {
        this.onEditFileChange(actualFile, 'photo_profil');
        this.generatePhotoPreview(actualFile);
      }
    } else {
      console.error('❌ Aucun fichier trouvé pour Photo Profil');
    }
    return false;
  };

  beforeUploadEditFicheSouscription = (file: NzUploadFile): boolean => {
    console.log('🔄 beforeUploadEditFicheSouscription appelé avec:', file);
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile) {
      if (this.validateFileSize(actualFile, 'Fiche de Souscription')) {
        this.onEditFileChange(actualFile, 'fiche_souscription');
      }
    } else {
      console.error('❌ Aucun fichier trouvé pour Fiche Souscription');
    }
    return false;
  };

  private validateFileSize(file: File, fileType: string): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.message.error(`Le fichier ${fileType} est trop volumineux. Taille maximale: 5MB`);
      this.notification.error(
        'Fichier trop volumineux',
        `Le fichier ${fileType} (${(file.size / 1024 / 1024).toFixed(1)}MB) dépasse la limite de 5MB.`
      );
      return false;
    }
    return true;
  }

  private onEditFileChange(file: File, documentType: string): void {
    console.log(`📎 Fichier ${documentType} sélectionné:`, file.name);
    
    // Stocker le fichier pour l'envoi lors de la soumission
    this.editUploadFiles[documentType] = file;
    
    this.message.success(`Fichier ${documentType} sélectionné: ${file.name}`);
    this.notification.success(
      'Fichier sélectionné',
      `Le fichier ${documentType} sera mis à jour lors de l'enregistrement des modifications.`
    );
  }

  // Méthode pour générer l'aperçu de la photo de profil
  private generatePhotoPreview(file: File): void {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editPhotoProfilPreview = e.target.result;
        console.log('📸 Aperçu de la photo généré');
      };
      reader.readAsDataURL(file);
    }
  }

  private handleSuccessfulUpdate(response: any): void {
    const documentCount = Object.keys(this.editUploadFiles).length;
    const documentsMessage = documentCount > 0 ? ` et ${documentCount} document(s)` : '';
    
    console.log('✅ Mise à jour réussie, fermeture du modal et actualisation du tableau');
    
    // Utiliser les informations de l'utilisateur en cours d'édition
    const prenom = this.editingUser?.prenom || 'L\'utilisateur';
    const nom = this.editingUser?.nom || '';
    const fullName = nom ? `${prenom} ${nom}` : prenom;
    
    // Messages de succès d'abord
    this.message.success(`Utilisateur${documentsMessage} modifié${documentCount > 0 ? 's' : ''} avec succès`);
    
    // Arrêter le loading
    this.isEditLoading = false;
    
    // Fermer le modal avec un petit délai pour une meilleure UX
    setTimeout(() => {
      this.closeEditModalWithCleanup();
      
      // Actualiser la liste des utilisateurs après fermeture du modal
      this.loadUsers();
      console.log('🔄 Tableau des utilisateurs actualisé après modification');
    }, 100);
  }

  private handleUpdateError(error: any): void {
    console.error('❌ Détail de l\'erreur de mise à jour:', error);
    
    if (error.error && error.error.errors) {
      // Gestion des erreurs de validation détaillées
      const validationErrors = error.error.errors;
      console.error('📋 Erreurs de validation:', validationErrors);
      
      const errorMessages = Object.keys(validationErrors).map(key => {
        const messages = Array.isArray(validationErrors[key]) 
          ? validationErrors[key] 
          : [validationErrors[key]];
        return `${key}: ${messages.join(', ')}`;
      }).join(' | ');
      
      this.message.error(`Erreurs de validation: ${errorMessages}`);
    } else if (error.error && error.error.message) {
      this.message.error(error.error.message);
    } else {
      this.message.error('Erreur lors de la modification de l\'utilisateur');
    }
    
    this.isEditLoading = false;
  }

  private handleInvalidForm(): void {
    console.log('❌ Formulaire invalide');
    
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      if (control && control.errors) {
        console.log(`❌ Erreur ${key}:`, control.errors);
      }
    });
    
    this.message.warning('Veuillez remplir tous les champs obligatoires');
    
    Object.keys(this.editForm.controls).forEach(key => {
      this.editForm.get(key)?.markAsTouched();
    });
  }

  // Modification de closeEditModal pour nettoyer les fichiers
  closeEditModalWithCleanup(): void {
    this.isEditModalVisible = false;
    this.editingUser = null;
    this.editUserDocuments = null;
    this.editUploadFiles = {};
    this.editPhotoProfilPreview = null;
    this.isEditLoading = false;
    this.editForm.reset();
    console.log('🚪 Modal fermée avec nettoyage des documents');
  }

  // CORRECTION: Méthode pour diagnostiquer les valeurs du formulaire
  private debugFormValues(): void {
    console.log('🔍 DIAGNOSTIC - Valeurs du formulaire:');
    const formValues = this.editForm.value;
    Object.keys(formValues).forEach(key => {
      const value = formValues[key];
      console.log(`  ${key}: ${value} (type: ${typeof value})`);
      
      if (key === 'est_administrateur') {
        console.log(`    → Booléen natif: ${Boolean(value)}`);
        console.log(`    → Chaîne booléenne: "${Boolean(value).toString()}"`);
      }
    });
    
    console.log('🔍 État des contrôles du formulaire:');
    Object.keys(this.editForm.controls).forEach(key => {
      const control = this.editForm.get(key);
      if (control) {
        console.log(`  ${key}: valeur=${control.value}, valide=${control.valid}, erreurs=`, control.errors);
      }
    });
  }
}