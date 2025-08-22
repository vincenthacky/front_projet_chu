// create-subscription-admin.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// ng-zorro imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

// Interfaces
interface User {
  id?: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  poste?: string;
  service?: string;
}

interface Terrain {
  id: number;
  libelle: string;
  localisation: string;
  superficie: number;
  prix_unitaire: number;
  description: string;
  statut_terrain: string;
  coordonnees_gps: string;
}

interface SubscriptionData {
  terrain: Terrain;
  nombreTerrains: number;
  montantMensuel: number;
  nombreMensualites: number;
  dateDebutPaiement: string;
  notesAdmin?: string;
}

@Component({
  selector: 'app-create-subscription-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzStepsModule,
    NzProgressModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzAlertModule,
    NzTagModule,
    NzStatisticModule,
    NzDescriptionsModule,
    NzSpinModule,
    NzIconModule,
    NzGridModule,
    NzModalModule
  ],
  templateUrl: './create-subscription-admin.component.html',
  styleUrl: './create-subscription-admin.component.css'
})
export class CreateSubscriptionAdminComponent implements OnInit, OnDestroy {
  currentStep = 0;
  userForm!: FormGroup;
  subscriptionForm!: FormGroup;
  
  selectedTerrain: Terrain | null = null;
  userData: User | null = null;
  subscriptionData: SubscriptionData | null = null;
  
  users: User[] = [];
  filteredUsers: User[] = [];
  terrains: Terrain[] = [];
  
  userSearchValue = '';
  showUserDropdown = false;
  isLoading = false;
  isCreating = false;
  
  private destroy$ = new Subject<void>();
  
  // Options pour les selects
  nombreTerrainsOptions = [
    { label: '1 terrain', value: 1 },
    { label: '2 terrains', value: 2 },
    { label: '3 terrains', value: 3 },
    { label: '4 terrains', value: 4 },
    { label: '5 terrains', value: 5 }
  ];
  
  nombreMensualitesOptions = [
    { label: '64 mensualités (5 ans et 4 mois)', value: 64 },
    { label: '60 mensualités (5 ans)', value: 60 },
    { label: '48 mensualités (4 ans)', value: 48 },
    { label: '36 mensualités (3 ans)', value: 36 }
  ];

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {
    this.initializeForms();
    this.loadMockData();
  }

  ngOnInit(): void {
    this.setupUserSearch();
    this.setupFormValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.userForm = this.fb.group({
      userSearch: [''],
      matricule: ['', [Validators.required, this.matriculeValidator]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [this.phoneValidator]],
      poste: [''],
      service: ['']
    });

    this.subscriptionForm = this.fb.group({
      terrainId: [null, [Validators.required]],
      nombreTerrains: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      montantMensuel: [64400, [Validators.required, Validators.min(1000)]],
      nombreMensualites: [64, [Validators.required]],
      dateDebutPaiement: [new Date('2024-05-01'), [Validators.required]],
      notesAdmin: ['', [Validators.maxLength(1000)]]
    });
  }

  // Validators personnalisés
  private matriculeValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) return null;
    
    const matriculePattern = /^[A-Z]{2,4}\d{3,6}$/;
    return matriculePattern.test(control.value) ? null : { invalidMatricule: true };
  }

  private phoneValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) return null;
    
    const phonePattern = /^[0-9+\-\s()]+$/;
    return phonePattern.test(control.value) ? null : { invalidPhone: true };
  }

  private loadMockData(): void {
    // Données mockées pour la démonstration
    this.users = [
      {
        id: 1,
        matricule: "CHU001",
        nom: "ADON",
        prenom: "AMIEPO RAYNOUARD",
        email: "admin@chu-angre-cite.ci",
        telephone: "0759106404",
        poste: "Technicien Biologie Médicale",
        service: "Laboratoire"
      },
      {
        id: 2,
        matricule: "CHU002",
        nom: "KOUAME",
        prenom: "YVES ALAIN",
        email: "y.kouame@chu-angre-cite.ci",
        telephone: "0759106405",
        poste: "Infirmier",
        service: "Urgences"
      },
      {
        id: 3,
        matricule: "CHU003",
        nom: "DIABATE",
        prenom: "FATOU",
        email: "f.diabate@chu-angre-cite.ci",
        telephone: "0759106406",
        poste: "Sage-femme",
        service: "Maternité"
      },
      {
        id: 4,
        matricule: "CHU004",
        nom: "TRAORE",
        prenom: "IBRAHIM",
        email: "i.traore@chu-angre-cite.ci",
        telephone: "0759106407",
        poste: "Médecin",
        service: "Cardiologie"
      },
      {
        id: 5,
        matricule: "CHU005",
        nom: "BAMBA",
        prenom: "AMINATA",
        email: "a.bamba@chu-angre-cite.ci",
        telephone: "0759106408",
        poste: "Pharmacienne",
        service: "Pharmacie"
      }
    ];

    this.terrains = [
      {
        id: 1,
        libelle: "Lot A1 - Zone Résidentielle",
        localisation: "Secteur Nord - Angré",
        superficie: 250.00,
        prix_unitaire: 4121600.00,
        description: "Terrain de 250m² en zone résidentielle calme, proche commodités",
        statut_terrain: "disponible",
        coordonnees_gps: "5.3697,-3.9956"
      },
      {
        id: 2,
        libelle: "Lot A2 - Zone Résidentielle",
        localisation: "Secteur Nord - Angré",
        superficie: 250.00,
        prix_unitaire: 4121600.00,
        description: "Terrain de 250m² avec vue dégagée",
        statut_terrain: "disponible",
        coordonnees_gps: "5.3698,-3.9955"
      },
      {
        id: 3,
        libelle: "Lot B1 - Zone Premium",
        localisation: "Secteur Sud - Angré",
        superficie: 500.00,
        prix_unitaire: 8243200.00,
        description: "Terrain de 500m² en zone premium, accès direct route principale",
        statut_terrain: "disponible",
        coordonnees_gps: "5.3695,-3.9958"
      },
      {
        id: 4,
        libelle: "Lot B2 - Zone Premium",
        localisation: "Secteur Sud - Angré",
        superficie: 500.00,
        prix_unitaire: 8243200.00,
        description: "Terrain de 500m² d'angle, double façade",
        statut_terrain: "disponible",
        coordonnees_gps: "5.3696,-3.9957"
      },
      {
        id: 5,
        libelle: "Lot C1 - Zone Commerciale",
        localisation: "Centre - Angré",
        superficie: 400.00,
        prix_unitaire: 6486400.00,
        description: "Terrain de 400m² en zone commerciale, forte affluence",
        statut_terrain: "disponible",
        coordonnees_gps: "5.3700,-3.9960"
      }
    ];
  }

  private setupUserSearch(): void {
    this.userForm.get('userSearch')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        this.filterUsers(value);
      });
  }

  private setupFormValueChanges(): void {
    // Écouter les changements pour recalculer automatiquement
    this.subscriptionForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Les calculs sont automatiques via les getters
      });
  }

  private filterUsers(query: string): void {
    if (!query || query.length < 2) {
      this.filteredUsers = [];
      this.showUserDropdown = false;
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user =>
      user.nom.toLowerCase().includes(searchTerm) ||
      user.prenom.toLowerCase().includes(searchTerm) ||
      user.matricule.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );

    this.showUserDropdown = this.filteredUsers.length > 0;
  }

  selectUser(user: User): void {
    this.userData = user;
    this.showUserDropdown = false;
    
    // Remplir le formulaire
    this.userForm.patchValue({
      userSearch: `${user.nom} ${user.prenom}`,
      matricule: user.matricule,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone || '',
      poste: user.poste || '',
      service: user.service || ''
    });

    // Marquer les champs comme touchés
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  selectTerrain(terrain: Terrain): void {
    this.selectedTerrain = terrain;
    this.subscriptionForm.patchValue({
      terrainId: terrain.id
    });
  }

  nextStep(): void {
    if (this.currentStep === 0 && this.validateUserForm()) {
      this.extractUserData();
      this.currentStep = 1;
    } else if (this.currentStep === 1 && this.validateSubscriptionForm()) {
      this.extractSubscriptionData();
      this.currentStep = 2;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  private extractUserData(): void {
    const formValue = this.userForm.value;
    this.userData = {
      matricule: formValue.matricule,
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      telephone: formValue.telephone,
      poste: formValue.poste,
      service: formValue.service
    };
  }

  private extractSubscriptionData(): void {
    if (!this.selectedTerrain) return;

    const formValue = this.subscriptionForm.value;
    this.subscriptionData = {
      terrain: this.selectedTerrain,
      nombreTerrains: formValue.nombreTerrains,
      montantMensuel: formValue.montantMensuel,
      nombreMensualites: formValue.nombreMensualites,
      dateDebutPaiement: this.formatDate(formValue.dateDebutPaiement),
      notesAdmin: formValue.notesAdmin
    };
  }

  private validateUserForm(): boolean {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      this.message.error('Veuillez corriger les erreurs dans le formulaire');
      return false;
    }
    return true;
  }

  private validateSubscriptionForm(): boolean {
    if (!this.selectedTerrain) {
      this.message.error('Veuillez sélectionner un terrain');
      return false;
    }

    if (this.subscriptionForm.invalid) {
      this.markFormGroupTouched(this.subscriptionForm);
      this.message.error('Veuillez vérifier les informations de souscription');
      return false;
    }
    return true;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  createSubscription(): void {
    if (!this.userData || !this.selectedTerrain || !this.subscriptionData) {
      this.message.error('Données incomplètes');
      return;
    }

    this.isCreating = true;
    
    // Simulation d'appel API
    const subscriptionPayload = {
      user: this.userData,
      subscription: this.subscriptionData
    };

    console.log('Création souscription:', subscriptionPayload);

    // Simuler le délai d'une requête API
    setTimeout(() => {
      this.isCreating = false;
      
      // Simuler une réponse de succès
      const mockResponse = {
        success: true,
        subscription_id: Math.floor(Math.random() * 1000) + 1,
        message: 'Souscription créée avec succès',
        data: {
          subscription: {
            id_souscription: Math.floor(Math.random() * 1000) + 1,
            montant_total: this.montantTotalMensualites,
            date_fin_prevue: this.dateFinPrevue
          },
          payment_plan_created: true,
          total_payments: this.subscriptionData!.nombreMensualites
        }
      };

      this.handleSuccessfulCreation(mockResponse);
    }, 2000);
  }

  private handleSuccessfulCreation(response: any): void {
    this.notification.success(
      'Succès',
      'La souscription a été créée avec succès !',
      {
        nzPlacement: 'topRight',
        nzDuration: 4000
      }
    );

    // Afficher le modal de confirmation avec les détails
    this.modal.confirm({
      nzTitle: 'Souscription créée avec succès',
      nzContent: `
        <div style="margin: 20px 0;">
          <p><strong>ID Souscription:</strong> ${response.data.subscription.id_souscription}</p>
          <p><strong>Agent:</strong> ${this.userData!.nom} ${this.userData!.prenom}</p>
          <p><strong>Terrain:</strong> ${this.selectedTerrain!.libelle}</p>
          <p><strong>Montant total:</strong> ${this.formatAmount(response.data.subscription.montant_total)} FCFA</p>
          <p><strong>Nombre de paiements:</strong> ${response.data.total_payments}</p>
        </div>
      `,
      nzOkText: 'Nouvelle souscription',
      nzCancelText: 'Voir les souscriptions',
      nzOnOk: () => {
        this.resetForm();
      },
      nzOnCancel: () => {
        // Ici vous pouvez naviguer vers la liste des souscriptions
        console.log('Navigation vers la liste des souscriptions');
      }
    });
  }

  private resetForm(): void {
    this.currentStep = 0;
    this.selectedTerrain = null;
    this.userData = null;
    this.subscriptionData = null;
    this.filteredUsers = [];
    this.showUserDropdown = false;
    
    this.userForm.reset();
    this.subscriptionForm.reset({
      nombreTerrains: 1,
      montantMensuel: 64400,
      nombreMensualites: 64,
      dateDebutPaiement: new Date('2024-05-01')
    });
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Getters pour les calculs et l'affichage
  get prixTotal(): number {
    if (!this.selectedTerrain) return 0;
    return this.selectedTerrain.prix_unitaire * this.subscriptionForm.value.nombreTerrains;
  }

  get montantTotalMensualites(): number {
    if (!this.selectedTerrain) return 0;
    const formValue = this.subscriptionForm.value;
    return formValue.montantMensuel * formValue.nombreMensualites * formValue.nombreTerrains;
  }

  get progressPercent(): number {
    return (this.currentStep / 2) * 100;
  }

  get dateFinPrevue(): string {
    if (!this.subscriptionForm.value.dateDebutPaiement) return '';
    
    const startDate = new Date(this.subscriptionForm.value.dateDebutPaiement);
    startDate.setMonth(startDate.getMonth() + this.subscriptionForm.value.nombreMensualites);
    
    return startDate.toLocaleDateString('fr-FR');
  }

  // Méthodes utilitaires pour le template
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    const errors = control.errors;
    
    if (errors['required']) return `${fieldName} est obligatoire`;
    if (errors['email']) return 'Format email invalide';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} caractères`;
    if (errors['min']) return `Valeur minimum: ${errors['min'].min}`;
    if (errors['max']) return `Valeur maximum: ${errors['max'].max}`;
    if (errors['invalidMatricule']) return 'Format matricule invalide (ex: CHU001)';
    if (errors['invalidPhone']) return 'Format téléphone invalide';

    return 'Champ invalide';
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  isFieldValid(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.valid && control.touched);
  }

  // Gestion des clics extérieurs
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-search-section')) {
      this.showUserDropdown = false;
    }
  }

  // Gestion du focus sur les champs
  onUserSearchFocus(): void {
    if (this.filteredUsers.length > 0) {
      this.showUserDropdown = true;
    }
  }

  // Getters pour les validations du template
  get canProceedToStep2(): boolean {
    return this.userForm.valid && this.userData !== null;
  }

  get canProceedToStep3(): boolean {
    return this.subscriptionForm.valid && this.selectedTerrain !== null;
  }

  get canCreateSubscription(): boolean {
    return this.canProceedToStep2 && this.canProceedToStep3 && !this.isCreating;
  }

  // Méthode pour calculer les statistiques rapides
  getQuickStats() {
    return {
      totalUsers: this.users.length,
      availableTerrains: this.terrains.filter(t => t.statut_terrain === 'disponible').length,
      averagePrice: this.terrains.reduce((sum, t) => sum + t.prix_unitaire, 0) / this.terrains.length
    };
  }
}