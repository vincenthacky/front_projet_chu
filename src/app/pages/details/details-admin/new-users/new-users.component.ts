import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
// Ng-Zorro imports
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, of, map, catchError, Observable } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzIconModule,
    NzGridModule,
    NzSpaceModule,
    NzProgressModule,
    NzAlertModule
  ],
  templateUrl: './new-users.component.html',
  styleUrl: './new-users.component.css'
})
export class NewUsersComponent implements OnInit, OnDestroy {
  createUserForm!: FormGroup;
  isSubmitting = false;
  passwordVisible = false;
  confirmPasswordVisible = false;
  private destroy$ = new Subject<void>();

  // Options de statut
  statusOptions = [
    { label: 'Actif', value: 'actif' },
    { label: 'Suspendu', value: 'suspendu' },
    { label: 'Inactif', value: 'inactif' }
  ];

  // Options de type d'utilisateur
  userTypeOptions = [
    { label: 'Utilisateur', value: 'user' },
    { label: 'Super Admin', value: 'superAdmin' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.setupRealTimeValidation();
    this.loadDraft();
  }

  ngOnDestroy(): void {
    this.clearDraft();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Modifiez le validateur asynchrone avec le typage correct
private emailUniqueValidator = (control: AbstractControl): Observable<ValidationErrors | null> => {
  if (!control.value) {
    return of(null);
  }

  return this.authService.checkEmailExists(control.value).pipe(
    map((exists: boolean) => exists ? { emailTaken: true } : null),
    catchError(() => of(null))
  );
};

  private initForm(): void {
    this.createUserForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email], [this.emailUniqueValidator]], // Validation asynchrone
      telephone: ['', [Validators.pattern(/^\+[0-9]{10,15}$/)]],
      poste: [''],
      service: [''],
      type: ['user', Validators.required],
      statut_utilisateur: ['actif', Validators.required],
      mot_de_passe: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator.bind(this)]],
      confirmer_mot_de_passe: ['', [Validators.required]],
      est_administrateur: [false]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('mot_de_passe');
    const confirmPassword = control.get('confirmer_mot_de_passe');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Si les mots de passe correspondent, retirer l'erreur passwordMismatch
      if (confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
      return null;
    }
  }

  // Validateur pour la force du mot de passe
  private passwordStrengthValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null;
    
    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const valid = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && password.length >= 8;
    
    if (!valid) {
      return { 
        passwordStrength: {
          hasUpperCase,
          hasLowerCase,
          hasNumbers,
          hasSpecialChar,
          minLength: password.length >= 8
        }
      };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.createUserForm.valid) {
      this.isSubmitting = true;
  
      const formData = { ...this.createUserForm.value };
      delete formData.confirmer_mot_de_passe;
  
      console.log('📝 Données à envoyer pour création:', formData);
  
      this.authService.createUser(formData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          console.log('✅ Réponse reçue:', response);
          this.isSubmitting = false;
  
          // Vérifier que response.data existe
          const userName = response.data?.prenom && response.data?.nom 
            ? `${response.data.prenom} ${response.data.nom}`
            : 'Utilisateur';
  
          this.message.success('Utilisateur créé avec succès');
          this.notification.success(
            'Création réussie',
            `L'utilisateur ${userName} a été créé avec succès.`
          );
  
          this.clearDraft();
          
          // Redirection avec gestion des erreurs
          console.log('Redirection en cours vers /dashboard/admin/details/users-admin');
          this.router.navigate(['/dashboard/admin/details/users-admin']).then(success => {
            if (!success) {
              console.error('❌ Échec de la redirection');
              this.message.error('Erreur lors de la redirection vers la page des utilisateurs');
            }
          });
        },
        error: (error) => {
          console.error('❌ Erreur création utilisateur:', error);
          this.isSubmitting = false;
  
          // Vérifier spécifiquement l'erreur d'email dupliqué
          const errorMessage = error.error?.message || '';
  
          if (errorMessage.includes('Duplicate entry') && errorMessage.includes('email')) {
            this.createUserForm.get('email')?.setErrors({ emailTaken: true });
            this.message.error('Cette adresse email est déjà utilisée par un autre utilisateur');
            this.notification.error(
              'Email déjà utilisé',
              'Veuillez choisir une autre adresse email pour créer ce compte.'
            );
          } else {
            this.message.error('Erreur lors de la création de l\'utilisateur: ' + (error.error?.message || 'Email déjà utilisé'));
          }
        }
      });
    } else {
      console.log('❌ Formulaire invalide');
      this.message.warning('Veuillez remplir tous les champs obligatoires correctement');
  
      Object.keys(this.createUserForm.controls).forEach(key => {
        this.createUserForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/admin/details/home-admin']);
  }

  onReset(): void {
    this.createUserForm.reset({
      type: 'user',
      statut_utilisateur: 'actif',
      est_administrateur: false
    });
    this.passwordVisible = false;
    this.confirmPasswordVisible = false;
    this.clearDraft();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createUserForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.createUserForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      const errors = field.errors;
      
      if (errors['required']) {
        return 'Ce champ est obligatoire';
      }
      if (errors['email']) {
        return 'Format d\'email invalide';
      }
      if (errors['emailTaken']) {
        return 'Cette adresse email est déjà utilisée';
      }
      if (errors['minlength']) {
        return `Minimum ${errors['minlength'].requiredLength} caractères`;
      }
      if (errors['pattern']) {
        if (fieldName === 'telephone') {
          return 'Format: +225XXXXXXXXX (10-15 chiffres après l\'indicatif)';
        }
      }
      if (errors['passwordMismatch']) {
        return 'Les mots de passe ne correspondent pas';
      }
      if (errors['passwordStrength']) {
        const strength = errors['passwordStrength'];
        const missing = [];
        if (!strength.hasUpperCase) missing.push('majuscule');
        if (!strength.hasLowerCase) missing.push('minuscule');
        if (!strength.hasNumbers) missing.push('chiffre');
        if (!strength.hasSpecialChar) missing.push('caractère spécial');
        if (!strength.minLength) missing.push('8 caractères minimum');
        
        return `Mot de passe faible. Manque: ${missing.join(', ')}`;
      }
    }
    return '';
  }

  // Calculer le pourcentage de completion du formulaire
  getFormCompletionPercentage(): number {
    const requiredFields = ['nom', 'prenom', 'email', 'type', 'statut_utilisateur', 'mot_de_passe', 'confirmer_mot_de_passe'];
    
    let completedRequired = 0;
    requiredFields.forEach(field => {
      const control = this.createUserForm.get(field);
      if (control && control.value && control.valid) {
        completedRequired++;
      }
    });
    
    return Math.round((completedRequired / requiredFields.length) * 100);
  }

  // Obtenir le label du type d'utilisateur
  getUserTypeLabel(type: string): string {
    const option = this.userTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  }

  // Obtenir le label du statut
  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  // Méthode pour vérifier la force du mot de passe visuellement
  getPasswordStrength(): { level: number; text: string; color: string } {
    const password = this.createUserForm.get('mot_de_passe')?.value || '';
    
    if (!password) return { level: 0, text: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    const levels = [
      { level: 0, text: '', color: '' },
      { level: 1, text: 'Très faible', color: '#ff4d4f' },
      { level: 2, text: 'Faible', color: '#ff7a45' },
      { level: 3, text: 'Moyen', color: '#ffa940' },
      { level: 4, text: 'Fort', color: '#52c41a' },
      { level: 5, text: 'Très fort', color: '#389e0d' }
    ];
    
    return levels[score];
  }

  // Méthode pour générer un mot de passe sécurisé
  generateSecurePassword(): void {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // S'assurer qu'on a au moins un caractère de chaque type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Majuscule
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minuscule
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Chiffre
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Spécial
    
    // Compléter avec des caractères aléatoires
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mélanger les caractères
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    this.createUserForm.patchValue({
      mot_de_passe: password,
      confirmer_mot_de_passe: password
    });
    
    this.message.success('Mot de passe sécurisé généré automatiquement');
  }

  // Auto-remplir certains champs basés sur l'email
  onEmailChange(): void {
    const email = this.createUserForm.get('email')?.value;
    if (email && email.includes('@')) {
      const domain = email.split('@')[1];
      
      // Exemple: auto-complétion du service basé sur le domaine
      if (domain === 'entreprise.com') {
        this.createUserForm.patchValue({
          service: 'Informatique'
        });
      }
    }
  }

  // Valider le format du téléphone en temps réel
  formatPhoneNumber(): void {
    const phoneControl = this.createUserForm.get('telephone');
    if (phoneControl && phoneControl.value) {
      let phone = phoneControl.value.replace(/\D/g, ''); // Enlever tout sauf les chiffres
      
      if (phone.length > 0 && !phone.startsWith('225')) {
        phone = '225' + phone;
      }
      
      if (phone.length > 0) {
        phoneControl.setValue('+' + phone, { emitEvent: false });
      }
    }
  }

  // Sauvegarder en brouillon (localStorage)
  saveDraft(): void {
    const formData = { ...this.createUserForm.value };
    delete formData.mot_de_passe;
    delete formData.confirmer_mot_de_passe;
    
    localStorage.setItem('createUserDraft', JSON.stringify(formData));
    this.message.success('Brouillon sauvegardé');
  }

  // Charger un brouillon
  loadDraft(): void {
    const draft = localStorage.getItem('createUserDraft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        this.createUserForm.patchValue(draftData);
        this.message.info('Brouillon chargé');
      } catch (error) {
        console.error('Erreur lors du chargement du brouillon:', error);
      }
    }
  }

  // Supprimer le brouillon
  clearDraft(): void {
    localStorage.removeItem('createUserDraft');
  }

  // Validation en temps réel personnalisée
  setupRealTimeValidation(): void {
    // Validation email en temps réel
    this.createUserForm.get('email')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(email => {
      if (email) {
        this.onEmailChange();
      }
    });
    
    // Formatage téléphone en temps réel
    this.createUserForm.get('telephone')?.valueChanges.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.formatPhoneNumber();
    });
    
    // Sauvegarde automatique en brouillon
    this.createUserForm.valueChanges.pipe(
      debounceTime(2000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.createUserForm.dirty) {
        this.saveDraft();
      }
    });
  }

}
