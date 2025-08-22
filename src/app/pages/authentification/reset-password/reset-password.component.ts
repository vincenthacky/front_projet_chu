// pages/authentification/reset-password/reset-password.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService, ResetPasswordResponse } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  token: string | null = null;
  passwordVisible = false;
  confirmPasswordVisible = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private message = inject(NzMessageService);

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, this.passwordStrengthValidator]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      console.log('🔑 Token récupéré depuis URL:', this.token ? 'Token présent (longueur: ' + this.token.length + ')' : 'Aucun token');
      
      if (!this.token) {
        this.message.error('Token de réinitialisation manquant ou invalide');
        console.error('❌ Token manquant dans l\'URL');
        setTimeout(() => {
          this.router.navigate(['/authentification/login']);
        }, 2000);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('password_confirmation');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  passwordStrengthValidator(control: any) {
    const value = control.value;
    
    if (!value) {
      return null;
    }

    const errors: any = {};

    if (value.length < 8) {
      errors.minLength = true;
    }

    if (!/(?=.*[a-z])/.test(value)) {
      errors.lowercase = true;
    }

    if (!/(?=.*[A-Z])/.test(value)) {
      errors.uppercase = true;
    }

    if (!/(?=.*\d)/.test(value)) {
      errors.digit = true;
    }

    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(value)) {
      errors.specialChar = true;
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }

  onSubmit(): void {
    console.log('🚀 onSubmit() appelé');
    console.log('📊 Formulaire valide:', this.resetForm.valid);
    console.log('📊 Token présent:', !!this.token);
    
    if (this.resetForm.invalid || !this.token) {
      console.log('❌ Validation échouée - arrêt de la soumission');
      this.markFormGroupTouched();
      if (!this.token) {
        this.message.error('Token manquant');
      }
      return;
    }

    this.isLoading = true;
    const formData = this.resetForm.value;

    console.log('🔐 Tentative de réinitialisation mot de passe...');
    console.log('📊 Token:', this.token);
    console.log('📊 Données du formulaire:', formData);

    // Vérification finale des valeurs
    if (!this.token || !formData.password || !formData.password_confirmation) {
      console.error('❌ ERREUR: Une ou plusieurs valeurs requises sont manquantes');
      this.isLoading = false;
      this.message.error('Données manquantes. Veuillez réessayer.');
      return;
    }

    this.authService.resetPassword(
      this.token,
      formData.password,
      formData.password_confirmation
    ).subscribe({
      next: (response: ResetPasswordResponse) => {
        this.isLoading = false;
        
        if (response.success) {
          // Message automatiquement décodé par l'interceptor
          this.message.success(response.message || 'Mot de passe réinitialisé avec succès !');
          console.log('✅ Mot de passe réinitialisé (décodé automatiquement):', {
            status_code: response.status_code,
            success: response.success,
            message: response.message
          });
          
          setTimeout(() => {
            this.router.navigate(['/authentification/login']);
          }, 2000);
        } else {
          // Message d'erreur automatiquement décodé
          this.message.error(response.message || 'Erreur lors de la réinitialisation');
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        let errorMessage = 'Erreur lors de la réinitialisation du mot de passe';

        console.error('❌ Erreur complète:', error);

        switch (error.status) {
          case 400:
            errorMessage = 'Token invalide ou expiré';
            break;
          case 422:
            // Messages de validation automatiquement décodés par l'interceptor
            if (error.error && error.error.message) {
              try {
                const validationErrors = JSON.parse(error.error.message);
                const errorMessages = [];
                
                if (validationErrors.token_reset) {
                  errorMessages.push('Token de réinitialisation invalide ou expiré');
                }
                if (validationErrors.mot_de_passe) {
                  errorMessages.push('Mot de passe invalide');
                }
                if (validationErrors.mot_de_passe_confirmation) {
                  errorMessages.push('Confirmation du mot de passe invalide');
                }
                
                errorMessage = errorMessages.length > 0 
                  ? errorMessages.join(', ') 
                  : 'Données de validation invalides';
              } catch (parseError) {
                // Le message a été décodé par l'interceptor, on peut l'utiliser directement
                errorMessage = error.error.message || 'Données invalides. Vérifiez votre mot de passe.';
              }
            } else {
              errorMessage = 'Données invalides. Vérifiez votre mot de passe.';
            }
            break;
          case 404:
            errorMessage = 'Token non trouvé';
            break;
          case 0:
            errorMessage = 'Impossible de se connecter au serveur.';
            break;
          default:
            // Message automatiquement décodé par l'interceptor
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
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
    Object.values(this.resetForm.controls).forEach(control => {
      control.markAsDirty();
      control.updateValueAndValidity({ onlySelf: true });
    });
  }

  goToLogin(): void {
    this.router.navigate(['/authentification/login']);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  getPasswordStrength(): number {
    const password = this.password.value;
    if (!password) return 0;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) strength++;

    return strength;
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 0:
      case 1: return 'Très faible';
      case 2: return 'Faible';
      case 3: return 'Moyen';
      case 4: return 'Fort';
      case 5: return 'Très fort';
      default: return '';
    }
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 0:
      case 1: return '#ff4d4f';
      case 2: return '#fa8c16';
      case 3: return '#fadb14';
      case 4: return '#a0d911';
      case 5: return '#52c41a';
      default: return '#d9d9d9';
    }
  }

  get password() { return this.resetForm.get('password')!; }
  get password_confirmation() { return this.resetForm.get('password_confirmation')!; }
}