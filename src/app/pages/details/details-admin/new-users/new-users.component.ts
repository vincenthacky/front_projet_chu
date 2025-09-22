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
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzUploadFile } from 'ng-zorro-antd/upload';
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
    NzAlertModule,
    NzUploadModule
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

  // Variables pour les fichiers
  cniFile: File | null = null;
  carteProFile: File | null = null;
  ficheSouscriptionFile: File | null = null;
  photoProfilFile: File | null = null;

  // Variables pour les aperçus des fichiers
  cniPreview: string | null = null;
  carteProPreview: string | null = null;
  ficheSouscriptionPreview: string | null = null;
  photoProfilPreview: string | null = null;

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
      est_administrateur: [false],
      cni: [''],
      carte_professionnel: [''],
      fiche_souscription: [''],
      photo_profil: ['']
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
  
      const formDataObj = new FormData();
      
      // Ajouter les données du formulaire
      const userData = { ...this.createUserForm.value };
      delete userData.confirmer_mot_de_passe;
      delete userData.cni;
      delete userData.carte_professionnel;
      delete userData.fiche_souscription;
      delete userData.photo_profil;
      
      // Ajouter chaque champ individuellement au FormData
      Object.keys(userData).forEach(key => {
        if (userData[key] !== null && userData[key] !== undefined) {
          formDataObj.append(key, userData[key]);
        }
      });
      
      // Ajouter les fichiers s'ils existent
      if (this.cniFile) {
        formDataObj.append('cni', this.cniFile);
      }
      if (this.carteProFile) {
        formDataObj.append('carte_professionnel', this.carteProFile);
      }
      if (this.ficheSouscriptionFile) {
        formDataObj.append('fiche_souscription', this.ficheSouscriptionFile);
      }
      if (this.photoProfilFile) {
        formDataObj.append('photo_profil', this.photoProfilFile);
      }
  
      console.log('📝 Données à envoyer pour création:', userData);
      console.log('📎 Fichiers à envoyer:', {
        cni: this.cniFile?.name,
        carte_professionnel: this.carteProFile?.name,
        fiche_souscription: this.ficheSouscriptionFile?.name,
        photo_profil: this.photoProfilFile?.name
      });
      
      // Debug: afficher le contenu du FormData
      console.log('📦 Contenu FormData:');
      console.log('  Champs utilisateur:', Object.keys(userData));
      console.log('  Fichiers ajoutés:', {
        cni: this.cniFile ? `${this.cniFile.name} (${(this.cniFile.size / 1024).toFixed(1)}KB)` : 'Aucun',
        carte_professionnel: this.carteProFile ? `${this.carteProFile.name} (${(this.carteProFile.size / 1024).toFixed(1)}KB)` : 'Aucun',
        fiche_souscription: this.ficheSouscriptionFile ? `${this.ficheSouscriptionFile.name} (${(this.ficheSouscriptionFile.size / 1024).toFixed(1)}KB)` : 'Aucun',
        photo_profil: this.photoProfilFile ? `${this.photoProfilFile.name} (${(this.photoProfilFile.size / 1024).toFixed(1)}KB)` : 'Aucun'
      });
  
      this.authService.createUserWithFiles(formDataObj).pipe(
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
  
          // Gestion des différents types d'erreurs
          if (error.status === 413) {
            this.message.error('Les fichiers sont trop volumineux pour le serveur');
            this.notification.error(
              'Fichiers trop volumineux',
              'Veuillez réduire la taille de vos fichiers ou en sélectionner de plus petits.'
            );
          } else if (error.status === 422) {
            // Erreurs de validation
            const errors = error.error?.errors || {};
            if (errors.mot_de_passe) {
              this.message.error('Erreur de validation: ' + errors.mot_de_passe[0]);
            } else if (errors.email) {
              this.message.error('Erreur email: ' + errors.email[0]);
            } else {
              this.message.error('Erreur de validation des données');
            }
          } else {
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
              this.message.error('Erreur lors de la création de l\'utilisateur: ' + (error.error?.message || 'Erreur serveur'));
            }
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

  // Méthodes pour gérer les fichiers
  beforeUploadCni = (file: NzUploadFile): boolean => {
    console.log('🔄 beforeUploadCni appelé avec:', file);
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile) {
      if (this.validateFileSize(actualFile, 'CNI')) {
        this.onCniChange(actualFile);
      }
    } else {
      console.error('❌ Aucun fichier trouvé pour CNI');
    }
    return false;
  };

  beforeUploadCartePro = (file: NzUploadFile): boolean => {
    console.log('🔄 beforeUploadCartePro appelé avec:', file);
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile) {
      if (this.validateFileSize(actualFile, 'Carte Pro')) {
        this.onCarteProChange(actualFile);
      }
    } else {
      console.error('❌ Aucun fichier trouvé pour Carte Pro');
    }
    return false;
  };

  beforeUploadFicheSouscription = (file: NzUploadFile): boolean => {
    console.log('🔄 beforeUploadFicheSouscription appelé avec:', file);
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile) {
      if (this.validateFileSize(actualFile, 'Fiche Souscription')) {
        this.onFicheSouscriptionChange(actualFile);
      }
    } else {
      console.error('❌ Aucun fichier trouvé pour Fiche Souscription');
    }
    return false;
  };

  beforeUploadPhotoProfil = (file: NzUploadFile): boolean => {
    console.log('🔄 beforeUploadPhotoProfil appelé avec:', file);
    const actualFile = file.originFileObj || (file as any as File);
    if (actualFile) {
      if (this.validateFileSize(actualFile, 'Photo Profil')) {
        this.onPhotoProfilChange(actualFile);
      }
    } else {
      console.error('❌ Aucun fichier trouvé pour Photo Profil');
    }
    return false;
  };

  // Validation de la taille du fichier
  validateFileSize(file: File, fileType: string): boolean {
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

  // Compression d'image
  async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions (max 1920x1080)
        let { width, height } = img;
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob avec qualité réduite
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            console.log(`📉 Compression: ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8); // Qualité 80%
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  async onCniChange(file: File): Promise<void> {
    let finalFile = file;
    
    // Compresser si c'est une image
    if (file.type.startsWith('image/')) {
      finalFile = await this.compressImage(file);
    }
    
    this.cniFile = finalFile;
    this.createUserForm.patchValue({ cni: finalFile.name });
    this.createFilePreview(finalFile, 'cni');
  }

  async onCarteProChange(file: File): Promise<void> {
    let finalFile = file;
    
    if (file.type.startsWith('image/')) {
      finalFile = await this.compressImage(file);
    }
    
    this.carteProFile = finalFile;
    this.createUserForm.patchValue({ carte_professionnel: finalFile.name });
    this.createFilePreview(finalFile, 'carte_professionnel');
  }

  async onFicheSouscriptionChange(file: File): Promise<void> {
    let finalFile = file;
    
    if (file.type.startsWith('image/')) {
      finalFile = await this.compressImage(file);
    }
    
    this.ficheSouscriptionFile = finalFile;
    this.createUserForm.patchValue({ fiche_souscription: finalFile.name });
    this.createFilePreview(finalFile, 'fiche_souscription');
  }

  async onPhotoProfilChange(file: File): Promise<void> {
    let finalFile = file;
    
    if (file.type.startsWith('image/')) {
      finalFile = await this.compressImage(file);
    }
    
    this.photoProfilFile = finalFile;
    this.createUserForm.patchValue({ photo_profil: finalFile.name });
    this.createFilePreview(finalFile, 'photo_profil');
  }

  // Créer un aperçu du fichier
  createFilePreview(file: File, fileType: string): void {
    console.log('📷 Création aperçu pour:', fileType, 'Type de fichier:', file.type);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('📷 Aperçu créé pour:', fileType, 'URL:', result ? 'OK' : 'ERREUR');
        
        switch (fileType) {
          case 'cni':
            this.cniPreview = result;
            break;
          case 'carte_professionnel':
            this.carteProPreview = result;
            break;
          case 'fiche_souscription':
            this.ficheSouscriptionPreview = result;
            break;
          case 'photo_profil':
            this.photoProfilPreview = result;
            break;
        }
        
        // Forcer la détection de changement
        setTimeout(() => {
          console.log('📷 État aperçu après création:', {
            cni: !!this.cniPreview,
            cartePro: !!this.carteProPreview,
            fiche: !!this.ficheSouscriptionPreview,
            photo: !!this.photoProfilPreview
          });
        }, 100);
      };
      
      reader.onerror = (error) => {
        console.error('❌ Erreur lecture fichier:', error);
      };
      
      reader.readAsDataURL(file);
    } else {
      console.log('📄 Fichier PDF détecté pour:', fileType);
      // Pour les fichiers PDF, on affiche une icône
      switch (fileType) {
        case 'cni':
          this.cniPreview = 'pdf';
          break;
        case 'carte_professionnel':
          this.carteProPreview = 'pdf';
          break;
        case 'fiche_souscription':
          this.ficheSouscriptionPreview = 'pdf';
          break;
        case 'photo_profil':
          this.photoProfilPreview = 'pdf';
          break;
      }
    }
  }

  // Méthode pour supprimer un fichier
  removeFile(fileType: string): void {
    switch (fileType) {
      case 'cni':
        this.cniFile = null;
        this.cniPreview = null;
        this.createUserForm.patchValue({ cni: '' });
        break;
      case 'carte_professionnel':
        this.carteProFile = null;
        this.carteProPreview = null;
        this.createUserForm.patchValue({ carte_professionnel: '' });
        break;
      case 'fiche_souscription':
        this.ficheSouscriptionFile = null;
        this.ficheSouscriptionPreview = null;
        this.createUserForm.patchValue({ fiche_souscription: '' });
        break;
      case 'photo_profil':
        this.photoProfilFile = null;
        this.photoProfilPreview = null;
        this.createUserForm.patchValue({ photo_profil: '' });
        break;
    }
  }

  // Vérifier si un fichier est sélectionné
  hasFile(fileType: string): boolean {
    switch (fileType) {
      case 'cni':
        return !!this.cniFile;
      case 'carte_professionnel':
        return !!this.carteProFile;
      case 'fiche_souscription':
        return !!this.ficheSouscriptionFile;
      case 'photo_profil':
        return !!this.photoProfilFile;
      default:
        return false;
    }
  }

  // Obtenir le nom du fichier
  getFileName(fileType: string): string {
    switch (fileType) {
      case 'cni':
        return this.cniFile?.name || '';
      case 'carte_professionnel':
        return this.carteProFile?.name || '';
      case 'fiche_souscription':
        return this.ficheSouscriptionFile?.name || '';
      case 'photo_profil':
        return this.photoProfilFile?.name || '';
      default:
        return '';
    }
  }

}
