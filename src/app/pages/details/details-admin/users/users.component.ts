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
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Subject, Observable, of, debounceTime, distinctUntilChanged, takeUntil, tap, catchError } from 'rxjs';
import { User, AuthService } from 'src/app/core/services/auth.service';

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
    NzAlertModule
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

  // Options de statut
  statusOptions = [
    { label: 'Actif', value: 'actif' },
    { label: 'Suspendu', value: 'suspendu' },
    { label: 'Inactif', value: 'inactif' }
  ];

  // Options de type d'utilisateur (CORRIGÉ : valeur en minuscule pour matcher le backend)
  userTypeOptions = [
    { label: 'Utilisateur', value: 'user' },
    { label: 'Super Admin', value: 'superadmin' }  
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
        console.log('📊 Nombre d\'utilisateurs:', users.length);
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
        this.users = users;
        this.calculateStatistics();
        this.applyFiltersAndPagination();
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
      console.log('📋 Aucun filtre. Tous les utilisateurs:', this.filteredUsers.length);
    }

    this.totalItems = this.filteredUsers.length;

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
    this.isEditLoading = true;  // Démarrer le loading pour la récupération du profil

    this.authService.getUserProfile(user.id_utilisateur).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('👤 Profil utilisateur récupéré:', response);
        this.editingUser = response.data;
        this.populateEditForm(response.data);
        this.isEditModalVisible = true;
        this.isEditLoading = false;  // Arrêter le loading après succès
      },
      error: (error) => {
        console.error('❌ Erreur récupération profil:', error);
        this.message.error('Erreur lors de la récupération du profil utilisateur');
        this.isEditLoading = false;  // Arrêter le loading en cas d'erreur
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
      type: user.type.toLowerCase(),  // Forcer en minuscule pour cohérence avec options
      est_administrateur: user.est_administrateur,
      statut_utilisateur: user.statut_utilisateur
    });
  }

  submitEdit(): void {
    if (this.editForm.valid && this.editingUser) {
      this.isEditLoading = true;
      const formData = this.editForm.value;

      console.log('📝 Données à modifier:', formData);
      console.log('📝 Type sélectionné:', formData.type);
      console.log('📝 Types valides:', this.userTypeOptions.map(opt => opt.value));

      // Vérification du type
      const validTypes = this.userTypeOptions.map(opt => opt.value);
      if (!validTypes.includes(formData.type)) {
        console.error('❌ Type invalide:', formData.type);
        this.message.error('Type d\'utilisateur invalide');
        this.isEditLoading = false;
        return;
      }

      this.authService.updateUserProfile(this.editingUser.id_utilisateur, formData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          console.log('✅ Utilisateur modifié avec succès:', response);
          this.message.success('Utilisateur modifié avec succès');
          this.notification.success(
            'Modification réussie',
            `Le profil de ${response.data.prenom} ${response.data.nom} a été mis à jour.`
          );
          
          this.isEditLoading = false;  // Arrêter le loading
          this.closeEditModal();
          this.loadUsers();
        },
        error: (error) => {
          console.error('❌ Erreur modification utilisateur:', error);
          
          // Affichage d'erreur plus détaillé
          if (error.error && error.error.message) {
            this.message.error(error.error.message);
          } else {
            this.message.error('Erreur lors de la modification de l\'utilisateur');
          }
          
          this.isEditLoading = false;  // Arrêter le loading en cas d'erreur
        }
      });
    } else {
      console.log('❌ Formulaire invalide');
      console.log('❌ Erreurs du formulaire:', this.editForm.errors);
      
      // Debug des erreurs par champ
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
          console.log('✅ Statut modifié avec succès:', response);
          this.message.success('Statut modifié avec succès');
          this.notification.success(
            'Changement de statut',
            `Le statut de ${response.data.prenom} ${response.data.nom} est maintenant : ${this.getStatusLabel(response.data.statut_utilisateur)}`
          );
          this.closeStatusModal();
          this.loadUsers();
        },
        error: (error) => {
          console.error('❌ Erreur changement statut:', error);
          this.message.error('Erreur lors du changement de statut');
          this.isStatusLoading = false;
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
    switch (type?.toLowerCase()) {
      case 'superadmin':
        return 'Super Admin';
      case 'user':
        return 'Utilisateur';
      default:
        return type || 'Non défini';
    }
  }

  getUserTypeColor(type: string): string {
    switch (type?.toLowerCase()) {
      case 'superadmin':
        return 'purple';
      case 'user':
        return 'cyan';
      default:
        return 'default';
    }
  }

  isAdmin(user: User): boolean {
    return user.est_administrateur || user.type.toLowerCase() === 'superadmin';
  }

  getAdminLabel(user: User): string {
    return this.isAdmin(user) ? 'Oui' : 'Non';
  }

  getAdminColor(user: User): string {
    return this.isAdmin(user) ? 'green' : 'default';
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
}