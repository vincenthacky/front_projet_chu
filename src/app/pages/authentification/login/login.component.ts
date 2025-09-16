// login/login.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Inject, PLATFORM_ID } from '@angular/core';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { LoginResponse, ForgotPasswordResponse } from 'src/app/core/models/auth';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup = new FormGroup({
    identifiant: new FormControl('', [Validators.required, Validators.email]),
    mot_de_passe: new FormControl('', [Validators.required, Validators.minLength(8)])
  });
  
  isLoading = false;
  isBrowser: boolean;
  showPassword: boolean = false; // Pour l'œil du mot de passe

  private authService = inject(AuthService);
  private router = inject(Router);
  private message = inject(NzMessageService);

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initForm();
    if (this.isBrowser) {
      this.initAnimations();
      this.checkIfAlreadyAuthenticated();
      
    }
  }

  /**
   * Toggle pour afficher/masquer le mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    console.log('👁️ Toggle password visibility:', this.showPassword);
  }

  private checkIfAlreadyAuthenticated(): void {
    if (this.authService.isAuthenticated()) {
      console.log('🔄 Utilisateur déjà connecté, redirection...');
      this.authService.redirectAfterLogin();
    }
  }

  private initForm(): void {
    this.loginForm = this.fb.group({
      identifiant: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  private initAnimations(): void {
    if (!this.isBrowser) return;
    setTimeout(() => {
      const elements = document.querySelectorAll('.fade-in');
      elements.forEach((el, index) => {
        (el as HTMLElement).style.animationDelay = `${index * 0.1}s`;
      });

      const devices = document.querySelectorAll('.device');
      devices.forEach((device, index) => {
        (device as HTMLElement).style.animationDelay = `${index * 0.2}s`;
        device.classList.add('fade-in');
      });
    }, 100);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const credentials = this.loginForm.value;

    console.log('🔑 Tentative de connexion avec:', credentials);

    this.authService.login(credentials).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false;
        console.log('📨 Réponse de connexion (automatiquement décodée):', response);
        
        // Plus besoin de vérifier le décodage, c'est fait automatiquement !
        if (response.success === true && response.data && response.data.user && response.data.token) {
          // Afficher le message décodé directement
          this.message.success(response.message || 'Connexion réussie !');
          
          console.log('✅ Connexion réussie:', {
            status_code: response.status_code,
            success: response.success,
            message: response.message, // Maintenant décodé automatiquement
            user: response.data.user,
            type: response.data.user.type,
            est_administrateur: response.data.user.est_administrateur
          });

          // Redirection après un court délai
          setTimeout(() => {
            console.log('🔄 Démarrage de la redirection...');
            this.authService.redirectAfterLogin();
          }, 500);
          
        } else {
          // Message d'erreur déjà décodé
          const errorMessage = response.message || 'Erreur de connexion';
          this.message.error(errorMessage);
          
          console.error('❌ Échec de la connexion:', response);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        let errorMessage = 'Erreur de connexion';

        console.error('❌ Erreur complète:', error);

        // Gestion des erreurs selon le status code
        switch (error.status) {
          case 401:
            errorMessage = 'Adresse mail ou mot de passe incorrect';
            break;
          case 0:
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
            break;
          case 422:
            errorMessage = 'Données de connexion invalides';
            break;
          case 500:
            errorMessage = 'Erreur du serveur, veuillez réessayer plus tard';
            break;
          default:
            // Le message d'erreur est automatiquement décodé par l'interceptor
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            } else {
              errorMessage = error.message || 'Erreur inconnue';
            }
        }

        this.message.error(errorMessage);
        console.error('📊 Erreur détaillée:', {
          status_code: error.status || 500,
          success: false,
          message: errorMessage
        });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    });
  }

  get identifiant() { return this.loginForm.get('identifiant')!; }
  get mot_de_passe() { return this.loginForm.get('mot_de_passe')!; }

  // === MODAL MOT DE PASSE OUBLIÉ ===
  isVisible = false;
  isOkLoading = false;
  forgotEmail = '';
  showErrorMessage = false;

  showModal(): void {
    this.isVisible = true;
    this.forgotEmail = '';
    this.showErrorMessage = false;
  }

  handleOk(): void {
    if (!this.forgotEmail || !this.isValidEmail(this.forgotEmail)) {
      this.showErrorMessage = true;
      this.message.error('Adresse email invalide');
      return;
    }
    
    this.isOkLoading = true;
    this.showErrorMessage = false;
    
    console.log('📧 Envoi de l\'email de récupération pour:', this.forgotEmail);
    
    this.authService.forgotPassword(this.forgotEmail).subscribe({
      next: (response: ForgotPasswordResponse) => {
        this.isVisible = false;
        this.isOkLoading = false;
        
        if (response.success) {
          // Les données sont automatiquement décodées
          const emailSentTo = response.data.email_sent_to;
          const expiresAt = new Date(response.data.expires_at).toLocaleString('fr-FR');
          
          // Message automatiquement décodé par l'interceptor
          this.message.success(
            `Email de réinitialisation envoyé à ${emailSentTo}. Le lien expire le ${expiresAt}.`
          );
          
          console.log('✅ Email de récupération envoyé (décodé automatiquement):', {
            status_code: response.status_code,
            success: true,
            message: response.message,
            email_sent_to: emailSentTo,
            expires_at: expiresAt
          });
        } else {
          // Message automatiquement décodé
          const errorMessage = response.message || 'Erreur lors de l\'envoi de l\'email';
          this.message.error(errorMessage);
          
          console.error('❌ Échec envoi email:', {
            status_code: response.status_code,
            success: false,
            message: errorMessage
          });
        }
      },
      error: (error: any) => {
        this.isOkLoading = false;
        let errorMessage = 'Erreur lors de l\'envoi de l\'email de récupération';
        
        // Messages d'erreur automatiquement décodés par l'interceptor
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 404) {
          errorMessage = 'Adresse email non trouvée dans notre système';
        } else if (error.status === 429) {
          errorMessage = 'Trop de tentatives. Veuillez patienter avant de réessayer.';
        } else if (error.status === 0) {
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
        }
        
        this.message.error(errorMessage);
        console.error('❌ Erreur envoi email:', {
          status_code: error.status || 500,
          success: false,
          message: errorMessage
        });
      }
    });
  }

  handleCancel(): void {
    this.isVisible = false;
    this.forgotEmail = '';
    this.showErrorMessage = false;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}