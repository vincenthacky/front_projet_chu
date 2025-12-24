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
import { environment } from 'src/assets/environment/environment';

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

  totalUsers = 0;
  totalAdmins = 0;
  totalRegularUsers = 0;

  isEditModalVisible = false;
  editForm!: FormGroup;
  editingUser: User | null = null;
  isEditLoading = false;

  isStatusModalVisible = false;
  selectedUserForStatus: User | null = null;
  newStatus: 'actif' | 'suspendu' | 'inactif' = 'actif';
  isStatusLoading = false;

  editUserDocuments: UserDocuments | null = null;
  isDocumentModalVisible = false;
  selectedDocument: DocumentData | null = null;
  editUploadFiles: { [key: string]: File } = {};
  editPhotoProfilPreview: string | null = null;

  statusOptions = [
    { label: 'Actif', value: 'actif' },
    { label: 'Suspendu', value: 'suspendu' },
    { label: 'Inactif', value: 'inactif' }
  ];

  // ✅ CORRECTION: Seulement superAdmin et user
  userTypeOptions = [
    { label: 'Super Admin', value: 'superAdmin' },
    { label: 'Utilisateur', value: 'user' }
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
      this.searchTerm = term;
      this.currentPage = 1;
      this.applyFiltersAndPagination();
    });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyFiltersAndPagination();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  private loadUsers(): void {
    this.loading = true;

    this.authService.getAllUsers().pipe(
      tap(users => {
        console.log('✅ Utilisateurs récupérés:', users.length);
      }),
      catchError(error => {
        console.error('❌ Erreur chargement utilisateurs:', error);
        this.message.error('Erreur lors du chargement des utilisateurs');
        this.loading = false;
        return of([]);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.calculateStatistics();
        this.applyFiltersAndPagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur:', error);
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
  }

  private resetStatistics(): void {
    this.totalUsers = 0;
    this.totalAdmins = 0;
    this.totalRegularUsers = 0;
  }

  private applyFiltersAndPagination(): void {
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
    } else {
      this.filteredUsers = [...this.users];
    }

    this.totalItems = this.filteredUsers.length;
  }

  getPaginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  refresh(): void {
    this.loadUsers();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  editUser(user: User): void {
    this.isEditLoading = true;

    this.authService.getUserProfile(user.id_utilisateur).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
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

  submitEditWithDocuments(): void {
    if (this.editForm.valid && this.editingUser) {
      this.isEditLoading = true;
      
      const formData = new FormData();
      const formValues = this.editForm.value;
      
      Object.keys(formValues).forEach(key => {
        if (formValues[key] !== null && formValues[key] !== undefined) {
          let value = formValues[key];
          
          if (key === 'est_administrateur') {
            const boolValue = Boolean(value);
            value = boolValue.toString();
          }
          
          formData.append(key, value);
        }
      });

      Object.keys(this.editUploadFiles).forEach(documentType => {
        const file = this.editUploadFiles[documentType];
        if (file) {
          formData.append(documentType, file);
        }
      });

      this.authService.updateUserWithFormData(this.editingUser.id_utilisateur, formData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          this.handleSuccessfulUpdate(response);
        },
        error: (error: any) => {
          this.handleFormError(error);
        }
      });
    } else {
      this.handleInvalidForm();
    }
  }

  private handleFormError(error: any): void {
    if (error.error && error.error.errors) {
      const validationErrors = error.error.errors;
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
      this.message.error('Erreur lors de la modification');
    }
    
    this.isEditLoading = false;
  }

  closeEditModal(): void {
    this.isEditModalVisible = false;
    this.editingUser = null;
    this.isEditLoading = false;
    this.editForm.reset();
  }

  toggleUserStatus(user: User): void {
    this.selectedUserForStatus = user;
    this.newStatus = user.statut_utilisateur;
    this.isStatusModalVisible = true;
  }

  confirmStatusChange(): void {
    if (this.selectedUserForStatus && this.newStatus) {
      this.isStatusLoading = true;

      const updateData: Partial<User> = {
        statut_utilisateur: this.newStatus
      };

      this.authService.updateUserProfile(this.selectedUserForStatus.id_utilisateur, updateData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.message.success('Statut modifié avec succès');
          this.closeStatusModal();
          this.loadUsers();
        },
        error: (error) => {
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
      case 'actif': return 'Actif';
      case 'suspendu': return 'Suspendu';
      case 'inactif': return 'Inactif';
      default: return statut || 'Non défini';
    }
  }

  getStatusColor(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'actif': return 'green';
      case 'suspendu': return 'orange';
      case 'inactif': return 'red';
      default: return 'default';
    }
  }

  getUserTypeLabel(type: string): string {
    switch (type) {
      case 'superAdmin': return 'Super Admin';
      case 'user': return 'Utilisateur';
      default: return type || 'Non défini';
    }
  }

  getUserTypeColor(type: string): string {
    switch (type) {
      case 'superAdmin': return 'purple';
      case 'user': return 'cyan';
      default: return 'default';
    }
  }

  isAdmin(user: User): boolean {
    return user.type === 'superAdmin';
  }

  getAdminLabel(user: User): string {
    return user.type === 'superAdmin' ? 'Oui' : 'Non';
  }

  getAdminColor(user: User): string {
    return user.type === 'superAdmin' ? 'green' : 'red';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'Ce champ est obligatoire';
      if (field.errors['email']) return 'Format d\'email invalide';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
    }
    return '';
  }

  trackByUserId(index: number, user: User): number {
    return user.id_utilisateur;
  }

  getUserPhotoUrl(user: User): string | undefined {
    if (user.photo_profil && user.photo_profil.chemin_fichier) {
      const imagePath = user.photo_profil.chemin_fichier.replace(/\\/g, '/');
      return `${environment.storageUrl}/${imagePath}`;
    }
    return undefined;
  }

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

  getCurrentPhotoUrl(): string | undefined {
    if (this.photoProfilDoc && this.photoProfilDoc.chemin_fichier) {
      const imagePath = this.photoProfilDoc.chemin_fichier.replace(/\\/g, '/');
      return `${environment.storageUrl}/${imagePath}`;
    }
    return undefined;
  }

  private loadUserDocuments(userData: any): void {
    this.editUserDocuments = {
      carte_professionnelle: userData.carte_professionnelle || null,
      cni: userData.cni || null,
      photo_profil: userData.photo_profil || null,
      fiche_souscription: userData.fiche_souscription || null
    };
  }

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

  beforeUploadEditCni = (file: NzUploadFile): boolean => {
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile && this.validateFileSize(actualFile, 'CNI')) {
      this.onEditFileChange(actualFile, 'cni');
    }
    return false;
  };

  beforeUploadEditCartePro = (file: NzUploadFile): boolean => {
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile && this.validateFileSize(actualFile, 'Carte Professionnelle')) {
      this.onEditFileChange(actualFile, 'carte_professionnelle');
    }
    return false;
  };

  beforeUploadEditPhotoProfil = (file: NzUploadFile): boolean => {
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile && this.validateFileSize(actualFile, 'Photo de Profil')) {
      this.onEditFileChange(actualFile, 'photo_profil');
      this.generatePhotoPreview(actualFile);
    }
    return false;
  };

  beforeUploadEditFicheSouscription = (file: NzUploadFile): boolean => {
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile && this.validateFileSize(actualFile, 'Fiche de Souscription')) {
      this.onEditFileChange(actualFile, 'fiche_souscription');
    }
    return false;
  };

  private validateFileSize(file: File, fileType: string): boolean {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.message.error(`Le fichier ${fileType} est trop volumineux. Taille maximale: 5MB`);
      return false;
    }
    return true;
  }

  private onEditFileChange(file: File, documentType: string): void {
    this.editUploadFiles[documentType] = file;
    this.message.success(`Fichier ${documentType} sélectionné: ${file.name}`);
  }

  private generatePhotoPreview(file: File): void {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editPhotoProfilPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  private handleSuccessfulUpdate(response: any): void {
    const documentCount = Object.keys(this.editUploadFiles).length;
    const documentsMessage = documentCount > 0 ? ` et ${documentCount} document(s)` : '';
    
    this.message.success(`Utilisateur${documentsMessage} modifié${documentCount > 0 ? 's' : ''} avec succès`);
    this.isEditLoading = false;
    
    setTimeout(() => {
      this.closeEditModalWithCleanup();
      this.loadUsers();
    }, 100);
  }

  private handleInvalidForm(): void {
    this.message.warning('Veuillez remplir tous les champs obligatoires');
    Object.keys(this.editForm.controls).forEach(key => {
      this.editForm.get(key)?.markAsTouched();
    });
  }

  closeEditModalWithCleanup(): void {
    this.isEditModalVisible = false;
    this.editingUser = null;
    this.editUserDocuments = null;
    this.editUploadFiles = {};
    this.editPhotoProfilPreview = null;
    this.isEditLoading = false;
    this.editForm.reset();
  }
}