import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule, AbstractControl } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile, NzUploadChangeParam } from 'ng-zorro-antd/upload';
import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzModalModule } from 'ng-zorro-antd/modal';
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

// Interface pour les statistiques utilisateur
interface UserStats {
  connections: number;
  projects: number;
}

// Validateur personnalisé pour vérifier que les mots de passe correspondent
function passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (!newPassword || !confirmPassword) {
    return null;
  }

  return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-parameter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzGridModule,
    NzCardModule,
    NzUploadModule,
    NzStatisticModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    NzTagModule,
    NzDescriptionsModule,
    NzProgressModule,
    NzModalModule
  ],
  templateUrl: './parameter.component.html',
  styleUrl: './parameter.component.css'
})
export class ParameterComponent implements OnInit {
  
  // Formulaire de modification du mot de passe
  passwordForm!: FormGroup;
  
  // Formulaire de profil utilisateur (lecture seule)
  userForm!: FormGroup;
  
  // Variables pour contrôler la visibilité des mots de passe
  passwordVisible1 = false;
  passwordVisible2 = false;
  passwordVisible3 = false;
  
  // Variable pour gérer l'état de soumission du mot de passe
  isPasswordSubmitting = false;
  
  // Variables pour le profil utilisateur
  avatarUrl?: string;
  userStats: UserStats = {
    connections: 0,
    projects: 0
  };
  
  // Variables pour l'upload d'avatar
  loading = false;
  
  // Variables pour les informations du compte
  showAdditionalInfo = true;
  memberSince?: Date;
  lastConnection?: Date;
  accountStatus?: string;
  passwordLastUpdated?: Date;
  hasStrongPassword = false;

  // Variables pour les documents
  carteProf: DocumentData | null = null;
  cni: DocumentData | null = null;
  ficheSouscription: DocumentData | null = null;
  photoProfile: DocumentData | null = null;
  
  // Modal pour l'affichage des documents
  isDocumentModalVisible = false;
  selectedDocument: DocumentData | null = null;

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.initPasswordForm();
    this.initUserForm();
    this.loadUserProfile();
  }

  // Initialisation du formulaire utilisateur (champs désactivés)
  private initUserForm(): void {
    this.userForm = this.fb.group({
      firstName: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
      lastName: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      phone: [{ value: '', disabled: true }],
      jobTitle: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }]
    });
  }

  // Charger le profil utilisateur
  private loadUserProfile(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('👤 Chargement du profil utilisateur:', currentUser);
      this.getUserProfile(currentUser.id_utilisateur);
    }
  }

  // Récupérer le profil utilisateur depuis l'API
  private getUserProfile(userId: number): void {
    this.authService.getUserProfile(userId).subscribe({
      next: (response) => {
        console.log('✅ Profil utilisateur récupéré:', response);
        if (response.success && response.data) {
          this.populateUserForm(response.data);
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement du profil:', error);
        this.message.error('Erreur lors du chargement du profil utilisateur');
      }
    });
  }

  // Remplir le formulaire avec les données utilisateur
  private populateUserForm(userData: any): void {
    this.userForm.patchValue({
      firstName: userData.prenom?.trim() || '',
      lastName: userData.nom || '',
      email: userData.email || '',
      phone: userData.telephone || '',
      jobTitle: userData.poste || '',
      address: userData.service || ''
    });
    
    // Gestion des documents
    this.photoProfile = userData.photo_profil;
    this.carteProf = userData.carte_professionnelle;
    this.cni = userData.cni;
    this.ficheSouscription = userData.fiche_souscription;
    
    // Définition de l'URL de l'avatar à partir de photo_profil
    if (this.photoProfile && this.photoProfile.chemin_fichier) {
      const imagePath = this.photoProfile.chemin_fichier.replace(/\\/g, '/'); // Remplacer les backslashes par des slashes
      this.avatarUrl = `${environment.storageUrl}/${imagePath}`; // Ajout du préfixe /storage/ pour Laravel
      console.log('🖼️ Avatar URL set:', this.avatarUrl);
    } else {
      // Image par défaut si aucune photo de profil
      this.avatarUrl = 'assets/images/default-avatar.png';
      console.log('🖼️ Default avatar set:', this.avatarUrl);
    }
    
    // Forcer la détection des changements pour garantir l'affichage
    this.cdr.detectChanges();
    
    // Remplir les informations du compte
    this.populateAccountInfo(userData);
  }

  // Remplir les informations du compte
  private populateAccountInfo(userData: any): void {
    if (userData.date_inscription) {
      this.memberSince = new Date(userData.date_inscription);
    }
    
    if (userData.derniere_connexion) {
      this.lastConnection = new Date(userData.derniere_connexion);
    }
    
    this.accountStatus = userData.statut_utilisateur || 'actif';
    
    if (userData.updated_at) {
      this.passwordLastUpdated = new Date(userData.updated_at);
    }
    
    this.evaluatePasswordStrength(userData);
  }

  // Évaluer la force du mot de passe basée sur les informations disponibles
  private evaluatePasswordStrength(userData: any): void {
    let passwordScore = 30;
    
    if (this.passwordLastUpdated) {
      const daysSinceUpdate = Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate < 30) {
        passwordScore += 20;
      } else if (daysSinceUpdate < 90) {
        passwordScore += 10;
      }
    }
    
    if (userData.est_administrateur) {
      passwordScore += 15;
    }
    
    if (userData.telephone && userData.poste && userData.service) {
      passwordScore += 10;
    }
    
    if (this.memberSince) {
      const accountAge = Math.floor((new Date().getTime() - this.memberSince.getTime()) / (1000 * 60 * 60 * 24));
      if (accountAge > 365 && (!this.passwordLastUpdated || 
          Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24)) > 180)) {
        passwordScore -= 15;
      }
    }
    
    this.hasStrongPassword = passwordScore >= 60;
  }

  // Obtenir la couleur du statut du compte
  getAccountStatusColor(): string {
    switch (this.accountStatus?.toLowerCase()) {
      case 'actif':
        return 'success';
      case 'suspendu':
        return 'warning';
      case 'inactif':
        return 'error';
      default:
        return 'default';
    }
  }

  // Obtenir le texte du statut du compte
  getAccountStatusText(): string {
    switch (this.accountStatus?.toLowerCase()) {
      case 'actif':
        return 'Actif';
      case 'suspendu':
        return 'Suspendu';
      case 'inactif':
        return 'Inactif';
      default:
        return 'Inconnu';
    }
  }

  // Obtenir le niveau de sécurité
  getSecurityLevel(): string {
    let securityScore = 0;
    const currentUser = this.authService.getCurrentUser();
    
    let passwordScore = this.evaluateCurrentPasswordStrength();
    securityScore += passwordScore;
    
    if (currentUser?.est_administrateur) {
      securityScore += 10;
    }
    
    if (currentUser?.email && this.isValidEmail(currentUser.email)) {
      securityScore += 8;
    }
    
    if (currentUser?.telephone && currentUser.telephone.length >= 8) {
      securityScore += 8;
    }
    
    if (this.lastConnection) {
      const daysSinceConnection = Math.floor((new Date().getTime() - this.lastConnection.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceConnection < 1) {
        securityScore += 20;
      } else if (daysSinceConnection < 7) {
        securityScore += 15;
      } else if (daysSinceConnection < 30) {
        securityScore += 8;
      } else if (daysSinceConnection < 90) {
        securityScore += 3;
      }
    }
    
    if (this.accountStatus === 'actif') {
      securityScore += 6;
    }
    
    if (currentUser?.poste && currentUser?.service && currentUser?.telephone) {
      securityScore += 8;
    }
    
    let penalties = 0;
    
    if (this.memberSince && this.lastConnection) {
      const accountAgeDays = Math.floor((new Date().getTime() - this.memberSince.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceConnection = Math.floor((new Date().getTime() - this.lastConnection.getTime()) / (1000 * 60 * 60 * 24));
      
      if (accountAgeDays > 365 && daysSinceConnection > 30) {
        penalties += 10;
      }
    }
    
    if (this.passwordLastUpdated) {
      const daysSincePasswordUpdate = Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSincePasswordUpdate > 180) {
        penalties += 8;
      }
    }
    
    securityScore = Math.max(0, securityScore - penalties);
    
    console.log('🔐 Score de sécurité détaillé:', {
      passwordScore,
      isAdmin: currentUser?.est_administrateur ? 10 : 0,
      emailScore: (currentUser?.email && this.isValidEmail(currentUser.email)) ? 8 : 0,
      phoneScore: (currentUser?.telephone && currentUser.telephone.length >= 8) ? 8 : 0,
      connectionScore: this.getConnectionScore(),
      accountScore: this.accountStatus === 'actif' ? 6 : 0,
      profileScore: (currentUser?.poste && currentUser?.service && currentUser?.telephone) ? 8 : 0,
      penalties: penalties,
      totalScore: securityScore,
      level: this.determineSecurityLevel(securityScore)
    });
    
    return this.determineSecurityLevel(securityScore);
  }

  private getConnectionScore(): number {
    if (!this.lastConnection) return 0;
    
    const daysSinceConnection = Math.floor((new Date().getTime() - this.lastConnection.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceConnection < 1) return 20;
    if (daysSinceConnection < 7) return 15;
    if (daysSinceConnection < 30) return 8;
    if (daysSinceConnection < 90) return 3;
    return 0;
  }

  private determineSecurityLevel(score: number): string {
    if (score >= 85) {
      return 'Très élevé';
    } else if (score >= 70) {
      return 'Élevé';
    } else if (score >= 50) {
      return 'Moyen';
    } else if (score >= 30) {
      return 'Faible';
    } else {
      return 'Très faible';
    }
  }

  private evaluateCurrentPasswordStrength(): number {
    let score = 5;
    
    if (this.passwordLastUpdated) {
      const daysSinceUpdate = Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate < 7) {
        score += 25;
      } else if (daysSinceUpdate < 30) {
        score += 18;
      } else if (daysSinceUpdate < 90) {
        score += 12;
      } else if (daysSinceUpdate < 180) {
        score += 8;
      } else {
        score += 3;
      }
    } else {
      score += 10;
    }
    
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.est_administrateur) {
      score += 5;
    }
    
    if (this.memberSince && this.passwordLastUpdated) {
      const accountAgeDays = Math.floor((new Date().getTime() - this.memberSince.getTime()) / (1000 * 60 * 60 * 24));
      const daysSincePasswordUpdate = Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      
      if (accountAgeDays > 365 && daysSincePasswordUpdate > 365) {
        score -= 8;
      }
    }
    
    return Math.max(5, Math.min(score, 40));
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getSecurityLevelColor(): string {
    const level = this.getSecurityLevel();
    switch (level) {
      case 'Très élevé':
        return 'success';
      case 'Élevé':
        return 'processing';
      case 'Moyen':
        return 'warning';
      case 'Faible':
        return 'error';
      case 'Très faible':
        return 'error';
      default:
        return 'default';
    }
  }

  // Gestion de l'upload d'avatar (désactivé)
  beforeUpload = (file: NzUploadFile): boolean => {
    this.message.error('La modification de l\'avatar est désactivée.');
    return false;
  };

  handleChange(info: NzUploadChangeParam): void {
    console.log('📷 Tentative d\'upload d\'avatar bloquée:', info);
  }

  // Initialisation du formulaire de mot de passe
  private initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    this.passwordForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  // Soumission du formulaire de modification de mot de passe
  onPasswordSubmit(): void {
    if (!this.passwordForm.valid) {
      Object.values(this.passwordForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isPasswordSubmitting = true;

    const formValue = this.passwordForm.value;
    const passwordData = {
      ancien_mot_de_passe: formValue.currentPassword,
      nouveau_mot_de_passe: formValue.newPassword,
      nouveau_mot_de_passe_confirmation: formValue.confirmPassword
    };

    console.log('🔐 Envoi des données de modification du mot de passe:', passwordData);

    this.authService.updatePassword(passwordData).subscribe({
      next: (response) => {
        console.log('✅ Mot de passe modifié avec succès:', response);
        this.message.success('Mot de passe modifié avec succès !');
        
        this.passwordLastUpdated = new Date();
        this.hasStrongPassword = this.getPasswordStrength() >= 60;
        
        this.passwordForm.reset();
        this.isPasswordSubmitting = false;
        
        setTimeout(() => {
          this.message.info('Vous allez être déconnecté pour des raisons de sécurité...');
          setTimeout(() => {
            this.authService.forceLogout();
          }, 2000);
        }, 3000);
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la modification du mot de passe:', error);
        
        let errorMessage = 'Erreur lors de la modification du mot de passe';
        
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        this.message.error(errorMessage);
        this.isPasswordSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  getPasswordStrength(): number {
    const password = this.passwordForm.get('newPassword')?.value || '';
    if (!password) return 0;

    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    else if (password.length >= 6) strength += 15;
    
    if (/[a-z]/.test(password)) strength += 20;
    
    if (/[A-Z]/.test(password)) strength += 20;
    
    if (/\d/.test(password)) strength += 20;
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

    return Math.min(100, strength);
  }

  getPasswordStrengthStatus(): 'success' | 'exception' | 'active' | 'normal' {
    const strength = this.getPasswordStrength();
    if (strength >= 80) return 'success';
    if (strength >= 60) return 'active';
    if (strength >= 40) return 'normal';
    return 'exception';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength >= 80) return 'Très fort';
    if (strength >= 60) return 'Fort';
    if (strength >= 40) return 'Moyen';
    if (strength >= 20) return 'Faible';
    return 'Très faible';
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength >= 80) return 'strength-very-strong';
    if (strength >= 60) return 'strength-strong';
    if (strength >= 40) return 'strength-medium';
    if (strength >= 20) return 'strength-weak';
    return 'strength-very-weak';
  }

  // Méthodes pour la gestion des documents
  openDocumentModal(document: DocumentData): void {
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

  getDocumentTypeLabel(documentType: 'carte_professionnelle' | 'cni' | 'fiche_souscription'): string {
    switch (documentType) {
      case 'carte_professionnelle':
        return 'Carte Professionnelle';
      case 'cni':
        return 'Carte Nationale d\'Identité';
      case 'fiche_souscription':
        return 'Fiche de Souscription';
      default:
        return '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.nextElementSibling) {
      target.style.display = 'none';
      (target.nextElementSibling as HTMLElement).style.display = 'block';
    }
  }
}