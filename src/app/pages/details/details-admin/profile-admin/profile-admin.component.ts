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
import { AuthService } from 'src/app/core/services/auth.service';
import { environment } from 'src/assets/environment/environment';


// Import du service d'authentification


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
  selector: 'app-profile-admin',
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
    NzProgressModule],
  templateUrl: './profile-admin.component.html',
  styleUrl: './profile-admin.component.css'
})
export class ProfileAdminComponent implements OnInit{
 // Formulaire de modification du mot de passe
 passwordForm!: FormGroup;
  
 // Formulaire de modification du profil utilisateur
 userForm!: FormGroup;
 
 // Variables pour contrôler la visibilité des mots de passe
 passwordVisible1 = false;
 passwordVisible2 = false;
 passwordVisible3 = false;
 
 // Variable pour gérer l'état de soumission
 isPasswordSubmitting = false;
 isSubmitting = false;
 
 // Variables pour le profil utilisateur
 avatarUrl?: string;
 photoProfile: any = null;
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

 // Initialisation du formulaire utilisateur
 private initUserForm(): void {
   this.userForm = this.fb.group({
     firstName: ['', [Validators.required, Validators.minLength(2)]],
     lastName: ['', [Validators.required, Validators.minLength(2)]],
     email: ['', [Validators.required, Validators.email]],
     phone: [''],
     jobTitle: [''],
     address: ['']
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
         // Vous pouvez aussi mettre à jour les stats ici si nécessaire
         // this.userStats = { connections: ..., projects: ... };
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
     address: userData.service || '' // Utilisant service comme adresse par défaut
   });
   
   // Gestion de la photo de profil
   this.photoProfile = userData.photo_profil;
   
   // Définition de l'URL de l'avatar à partir de photo_profil
   if (this.photoProfile && this.photoProfile.chemin_fichier) {
     const imagePath = this.photoProfile.chemin_fichier.replace(/\\/g, '/'); // Remplacer les backslashes par des slashes
     this.avatarUrl = `${environment.storageUrl}/${imagePath}`;
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
   // Date d'inscription (membre depuis)
   if (userData.date_inscription) {
     this.memberSince = new Date(userData.date_inscription);
   }
   
   // Dernière connexion
   if (userData.derniere_connexion) {
     this.lastConnection = new Date(userData.derniere_connexion);
   }
   
   // Statut du compte
   this.accountStatus = userData.statut_utilisateur || 'actif';
   
   // Dernière mise à jour du mot de passe (utilise updated_at comme approximation)
   if (userData.updated_at) {
     this.passwordLastUpdated = new Date(userData.updated_at);
   }
   
   // Évaluation initiale de la force du mot de passe (basée sur des heuristiques)
   this.evaluatePasswordStrength(userData);
 }

 // Évaluer la force du mot de passe basée sur les informations disponibles
 private evaluatePasswordStrength(userData: any): void {
   // Heuristique basée sur la récence de la mise à jour du profil
   // et d'autres facteurs disponibles
   let passwordScore = 30; // Score de base
   
   // Si le profil a été récemment mis à jour (moins de 30 jours), on assume un mot de passe plus récent
   if (this.passwordLastUpdated) {
     const daysSinceUpdate = Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24));
     if (daysSinceUpdate < 30) {
       passwordScore += 20; // Mot de passe potentiellement récent
     } else if (daysSinceUpdate < 90) {
       passwordScore += 10;
     }
   }
   
   // Bonus pour les administrateurs (supposés avoir des mots de passe plus forts)
   if (userData.est_administrateur) {
     passwordScore += 15;
   }
   
   // Bonus pour profil complet (utilisateurs consciencieux)
   if (userData.telephone && userData.poste && userData.service) {
     passwordScore += 10;
   }
   
   // Pénalité pour les comptes anciens sans mise à jour récente
   if (this.memberSince) {
     const accountAge = Math.floor((new Date().getTime() - this.memberSince.getTime()) / (1000 * 60 * 60 * 24));
     if (accountAge > 365 && (!this.passwordLastUpdated || 
         Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24)) > 180)) {
       passwordScore -= 15; // Compte ancien sans mise à jour récente
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

 // Obtenir le niveau de sécurité basé sur différents critères
 getSecurityLevel(): string {
   let securityScore = 0;
   const currentUser = this.authService.getCurrentUser();
   
   // 1. Évaluation du mot de passe (40 points max - plus important)
   let passwordScore = this.evaluateCurrentPasswordStrength();
   securityScore += passwordScore;
   
   // 2. Points pour être administrateur (10 points - réduit)
   if (currentUser?.est_administrateur) {
     securityScore += 10;
   }
   
   // 3. Points pour avoir un email valide (8 points - réduit)
   if (currentUser?.email && this.isValidEmail(currentUser.email)) {
     securityScore += 8;
   }
   
   // 4. Points pour avoir un téléphone (8 points - réduit)
   if (currentUser?.telephone && currentUser.telephone.length >= 8) {
     securityScore += 8;
   }
   
   // 5. Points pour connexion récente (20 points max - plus strict)
   if (this.lastConnection) {
     const daysSinceConnection = Math.floor((new Date().getTime() - this.lastConnection.getTime()) / (1000 * 60 * 60 * 24));
     if (daysSinceConnection < 1) {
       securityScore += 20; // Aujourd'hui
     } else if (daysSinceConnection < 7) {
       securityScore += 15; // Cette semaine
     } else if (daysSinceConnection < 30) {
       securityScore += 8; // Ce mois
     } else if (daysSinceConnection < 90) {
       securityScore += 3; // Ces 3 mois
     }
     // Pas de points si plus de 90 jours
   }
   
   // 6. Points pour compte actif (6 points - réduit)
   if (this.accountStatus === 'actif') {
     securityScore += 6;
   }
   
   // 7. Points pour profil complet (8 points - réduit)
   if (currentUser?.poste && currentUser?.service && currentUser?.telephone) {
     securityScore += 8;
   }
   
   // Pénalités pour réduire les scores trop élevés
   let penalties = 0;
   
   // Pénalité pour compte ancien sans activité récente
   if (this.memberSince && this.lastConnection) {
     const accountAgeDays = Math.floor((new Date().getTime() - this.memberSince.getTime()) / (1000 * 60 * 60 * 24));
     const daysSinceConnection = Math.floor((new Date().getTime() - this.lastConnection.getTime()) / (1000 * 60 * 60 * 24));
     
     if (accountAgeDays > 365 && daysSinceConnection > 30) {
       penalties += 10; // Compte ancien + connexion pas récente
     }
   }
   
   // Pénalité si mot de passe pas récemment mis à jour
   if (this.passwordLastUpdated) {
     const daysSincePasswordUpdate = Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24));
     if (daysSincePasswordUpdate > 180) {
       penalties += 8; // Mot de passe ancien
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

 // Méthode séparée pour calculer le score de connexion
 private getConnectionScore(): number {
   if (!this.lastConnection) return 0;
   
   const daysSinceConnection = Math.floor((new Date().getTime() - this.lastConnection.getTime()) / (1000 * 60 * 60 * 24));
   if (daysSinceConnection < 1) return 20;
   if (daysSinceConnection < 7) return 15;
   if (daysSinceConnection < 30) return 8;
   if (daysSinceConnection < 90) return 3;
   return 0;
 }

 // Méthode séparée pour déterminer le niveau
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

 // Évaluer la force du mot de passe actuel (sur 40 points maintenant)
 private evaluateCurrentPasswordStrength(): number {
   // Score de base très bas
   let score = 5;
   
   // Évaluation basée sur la récence de mise à jour du mot de passe
   if (this.passwordLastUpdated) {
     const daysSinceUpdate = Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24));
     
     if (daysSinceUpdate < 7) {
       score += 25; // Mot de passe très récent - probablement fort
     } else if (daysSinceUpdate < 30) {
       score += 18; // Mot de passe récent
     } else if (daysSinceUpdate < 90) {
       score += 12; // Mot de passe modérément récent
     } else if (daysSinceUpdate < 180) {
       score += 8; // Mot de passe un peu ancien
     } else {
       score += 3; // Mot de passe ancien - probablement faible
     }
   } else {
     // Pas d'info sur la date de mise à jour - score moyen-faible
     score += 10;
   }
   
   // Petit bonus pour les administrateurs
   const currentUser = this.authService.getCurrentUser();
   if (currentUser?.est_administrateur) {
     score += 5;
   }
   
   // Pénalité si le compte est très ancien et pas de mise à jour récente
   if (this.memberSince && this.passwordLastUpdated) {
     const accountAgeDays = Math.floor((new Date().getTime() - this.memberSince.getTime()) / (1000 * 60 * 60 * 24));
     const daysSincePasswordUpdate = Math.floor((new Date().getTime() - this.passwordLastUpdated.getTime()) / (1000 * 60 * 60 * 24));
     
     if (accountAgeDays > 365 && daysSincePasswordUpdate > 365) {
       score -= 8; // Compte et mot de passe très anciens
     }
   }
   
   return Math.max(5, Math.min(score, 40)); // Entre 5 et 40 points
 }

 // Valider le format email
 private isValidEmail(email: string): boolean {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return emailRegex.test(email);
 }

 // Obtenir la couleur du niveau de sécurité
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

 // Soumission du formulaire de profil
 onSubmit(): void {
   if (!this.userForm.valid) {
     Object.values(this.userForm.controls).forEach(control => {
       if (control.invalid) {
         control.markAsDirty();
         control.updateValueAndValidity({ onlySelf: true });
       }
     });
     return;
   }

   this.isSubmitting = true;
   const formValue = this.userForm.value;
   const currentUser = this.authService.getCurrentUser();
   
   if (!currentUser) {
     this.message.error('Utilisateur non connecté');
     this.isSubmitting = false;
     return;
   }
   
   const updateData = {
     nom: formValue.lastName,
     prenom: formValue.firstName,
     email: formValue.email,
     telephone: formValue.phone,
     poste: formValue.jobTitle
   };

   console.log('📝 Mise à jour du profil:', updateData);

   this.authService.updateUserProfile(currentUser.id_utilisateur, updateData).subscribe({
     next: (response) => {
       console.log('✅ Profil mis à jour avec succès:', response);
       this.message.success('Profil mis à jour avec succès !');
       this.isSubmitting = false;
       this.cdr.detectChanges();
     },
     error: (error) => {
       console.error('❌ Erreur lors de la mise à jour du profil:', error);
       let errorMessage = 'Erreur lors de la mise à jour du profil';
       
       if (error?.error?.message) {
         errorMessage = error.error.message;
       }

       this.message.error(errorMessage);
       this.isSubmitting = false;
       this.cdr.detectChanges();
     }
   });
 }

 // Gestion de l'upload d'avatar (à implémenter selon vos besoins)
 beforeUpload = (file: NzUploadFile): boolean => {
   const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
   if (!isJpgOrPng) {
     this.message.error('Vous ne pouvez télécharger que des fichiers JPG/PNG !');
   }
   const isLt2M = file.size! / 1024 / 1024 < 2;
   if (!isLt2M) {
     this.message.error('L\'image doit faire moins de 2MB !');
   }
   return isJpgOrPng && isLt2M && false; // Retourner false pour gérer manuellement
 };

 handleChange(info: NzUploadChangeParam): void {
   // Logique d'upload à implémenter selon vos besoins
   console.log('📷 Upload d\'avatar:', info);
 }

 // Initialisation du formulaire de mot de passe
 private initPasswordForm(): void {
   this.passwordForm = this.fb.group({
     currentPassword: ['', [Validators.required]],
     newPassword: ['', [Validators.required, Validators.minLength(8)]],
     confirmPassword: ['', [Validators.required]]
   }, { validators: passwordMatchValidator });

   // Surveiller les changements pour recalculer la force du mot de passe
   this.passwordForm.get('newPassword')?.valueChanges.subscribe(() => {
     this.cdr.detectChanges();
   });
 }

 // Soumission du formulaire de modification de mot de passe
 onPasswordSubmit(): void {
   if (!this.passwordForm.valid) {
     // Marquer tous les champs comme touchés pour afficher les erreurs
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
       
       // Mettre à jour la date de dernière modification du mot de passe
       this.passwordLastUpdated = new Date();
       this.hasStrongPassword = this.getPasswordStrength() >= 60;
       
       // Réinitialiser le formulaire
       this.passwordForm.reset();
       this.isPasswordSubmitting = false;
       
       // Déconnecter l'utilisateur après modification du mot de passe
       setTimeout(() => {
         this.message.info('Vous allez être déconnecté pour des raisons de sécurité...');
         setTimeout(() => {
           this.authService.forceLogout();
         }, 2000); // Délai de 2 secondes pour que l'utilisateur puisse lire le message
       }, 3000); // Délai de 3 secondes après le message de succès
       
       this.cdr.detectChanges();
     },
     error: (error) => {
       console.error('❌ Erreur lors de la modification du mot de passe:', error);
       
       let errorMessage = 'Erreur lors de la modification du mot de passe';
       
       // Traitement des différents types d'erreur
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

 // Calculer la force du mot de passe (en pourcentage)
 getPasswordStrength(): number {
   const password = this.passwordForm.get('newPassword')?.value || '';
   if (!password) return 0;

   let strength = 0;
   
   // Longueur
   if (password.length >= 8) strength += 25;
   else if (password.length >= 6) strength += 15;
   
   // Lettres minuscules
   if (/[a-z]/.test(password)) strength += 20;
   
   // Lettres majuscules
   if (/[A-Z]/.test(password)) strength += 20;
   
   // Chiffres
   if (/\d/.test(password)) strength += 20;
   
   // Caractères spéciaux
   if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

   return Math.min(100, strength);
 }

 // Obtenir le statut de la barre de progression
 getPasswordStrengthStatus(): 'success' | 'exception' | 'active' | 'normal' {
   const strength = this.getPasswordStrength();
   if (strength >= 80) return 'success';
   if (strength >= 60) return 'active';
   if (strength >= 40) return 'normal';
   return 'exception';
 }

 // Obtenir le texte de force du mot de passe
 getPasswordStrengthText(): string {
   const strength = this.getPasswordStrength();
   if (strength >= 80) return 'Très fort';
   if (strength >= 60) return 'Fort';
   if (strength >= 40) return 'Moyen';
   if (strength >= 20) return 'Faible';
   return 'Très faible';
 }

 // Obtenir la classe CSS pour le texte de force
 getPasswordStrengthClass(): string {
   const strength = this.getPasswordStrength();
   if (strength >= 80) return 'strength-very-strong';
   if (strength >= 60) return 'strength-strong';
   if (strength >= 40) return 'strength-medium';
   if (strength >= 20) return 'strength-weak';
   return 'strength-very-weak';
 }
}
