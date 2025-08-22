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

interface UserStats {
  connections: number;
  projects: number;
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
    NzProgressModule
  ],
  templateUrl: './parameter.component.html',
  styleUrl: './parameter.component.css'
})
export class ParameterComponent implements OnInit {
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  isSubmitting = false;
  isPasswordSubmitting = false;
  avatarUrl?: string;
  passwordVisible1 = false;
  passwordVisible2 = false;
  passwordVisible3 = false;
  userStats: UserStats = {
    connections: 127,
    projects: 23
  };
  showAdditionalInfo = true;
  memberSince = new Date('2023-01-15');
  lastConnection = new Date();

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initPasswordForm();
    this.loadUserData();
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const cards = document.querySelectorAll('.card-animated');
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('animate__animated', 'animate__fadeInUp');
          }, index * 200);
        });
      }, 100);
    }
  }

  initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      jobTitle: [''],
      address: ['']
    });
  }

  initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [
        Validators.required, 
        Validators.minLength(6)
      ]],
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(6),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, { validators: this.passwordsMatchValidator });

    this.passwordForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  passwordStrengthValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.value;
    if (!password) return null;
    const hasNumber = /[0-9]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const strength = [hasNumber, hasLower, hasUpper, hasSpecial].filter(Boolean).length;
    if (strength < 2) {
      return { 'weakPassword': { value: password } };
    }
    return null;
  }

  passwordsMatchValidator(form: AbstractControl): {[key: string]: any} | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  getPasswordStrength(): number {
    const password = this.passwordForm.get('newPassword')?.value || '';
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    else if (password.length >= 6) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;
    if (password.length >= 12) strength += 20;
    return Math.min(strength, 100);
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
    return 'Faible';
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength >= 80) return 'strength-excellent';
    if (strength >= 60) return 'strength-good';
    if (strength >= 40) return 'strength-fair';
    return 'strength-weak';
  }

  getSecurityLevel(): string {
    const hasStrongPassword = this.getPasswordStrength() >= 80;
    const hasRecentActivity = (new Date().getTime() - this.lastConnection.getTime()) < 7 * 24 * 60 * 60 * 1000;
    if (hasStrongPassword && hasRecentActivity) return 'Élevé';
    if (hasStrongPassword || hasRecentActivity) return 'Moyen';
    return 'Faible';
  }

  getSecurityLevelColor(): string {
    const level = this.getSecurityLevel();
    switch (level) {
      case 'Élevé': return 'success';
      case 'Moyen': return 'warning';
      default: return 'error';
    }
  }

  loadUserData(): void {
    setTimeout(() => {
      const userData = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@chu-angre-cite.ci',
        phone: '+33 1 23 45 67 89',
        jobTitle: 'Développeur Full Stack',
        address: '123 Avenue de la République'
      };
      this.userForm.patchValue(userData);
      this.avatarUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    }, 1000);
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      this.message.error('Seuls les fichiers JPG, PNG et WebP sont acceptés!');
      return false;
    }
    const isLt5M = file.size! / 1024 / 1024 < 5;
    if (!isLt5M) {
      this.message.error('L\'image doit faire moins de 5MB!');
      return false;
    }
    return false;
  };

  handleChange(info: NzUploadChangeParam): void {
    if (info.file.status === 'uploading') {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        this.avatarUrl = reader.result as string;
        this.message.success('Photo de profil mise à jour avec succès!');
      }, 1500);
    };
    reader.readAsDataURL(info.file.originFileObj!);
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      this.message.loading('Sauvegarde en cours...', { nzDuration: 0 });
      setTimeout(() => {
        this.message.remove();
        this.message.success('Profil mis à jour avec succès!', { nzDuration: 3000 });
        this.isSubmitting = false;
        this.userStats.connections += Math.floor(Math.random() * 3);
        this.lastConnection = new Date();
      }, 2000);
    } else {
      this.message.error('Veuillez corriger les erreurs dans le formulaire');
      this.markFormGroupTouched();
      this.scrollToFirstError();
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.valid) {
      this.isPasswordSubmitting = true;
      this.message.loading('Modification du mot de passe...', { nzDuration: 0 });
      setTimeout(() => {
        this.message.remove();
        this.message.success('Mot de passe modifié avec succès!', { nzDuration: 3000 });
        this.isPasswordSubmitting = false;
        this.passwordForm.reset();
        this.passwordVisible1 = false;
        this.passwordVisible2 = false;
        this.passwordVisible3 = false;
      }, 2500);
    } else {
      this.message.error('Veuillez corriger les erreurs dans le formulaire');
      this.markPasswordFormTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  private markPasswordFormTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  private scrollToFirstError(): void {
    const firstError = document.querySelector('.ant-form-item-has-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}