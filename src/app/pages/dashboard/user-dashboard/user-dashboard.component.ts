import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PLATFORM_ID } from '@angular/core';
import { Subscription } from 'rxjs';
import { User, UserProfileResponse } from 'src/app/core/models/auth';
import { AuthService } from 'src/app/core/services/auth.service';
import { environment } from '@/environment';


@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzAvatarModule,
    NzModalModule,
    NzToolTipModule,
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  userName = 'Utilisateur';
  profilePhoto = '/assets/images/default-avatar.png'; // Avatar par défaut local
  currentUser: User | null = null;
  isBrowser: boolean;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService, // Injection via constructeur
    private modal: NzModalService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser && window.innerWidth <= 768) {
      this.isCollapsed = true;
    }
  }

  ngOnInit(): void {
    console.log('🟢 ngOnInit: Initialisation du composant');
    // S'abonner aux changements de l'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe((user: User | null) => {
      console.log('🔄 currentUser$ émis:', user);
      this.currentUser = user;
      this.updateUserName();
      this.updateProfilePhoto();
    });

    // Vérifier l'utilisateur courant
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Utilisateur initial:', this.currentUser);

    // Si aucun utilisateur, essayer de récupérer le profil
    if (!this.currentUser && this.isBrowser) {
      console.log('⚠️ Aucun utilisateur, tentative de récupération du profil');
      const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id_utilisateur;
      if (userId) {
        this.authService.getUserProfile(userId).subscribe({
          next: (response: UserProfileResponse) => {
            console.log('✅ Profil récupéré:', response.data);
            this.currentUser = response.data;
            this.authService.updateCurrentUser(response.data); // Nouvelle méthode publique
            this.updateUserName();
            this.updateProfilePhoto();
          },
          error: (error: any) => {
            console.error('❌ Erreur récupération profil:', error);
          }
        });
      } else {
        console.warn('⚠️ Aucun userId dans localStorage');
      }
    } else {
      this.updateUserName();
      this.updateProfilePhoto();
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      console.log('🔚 ngOnDestroy: Désabonnement de currentUser$');
    }
  }

  private updateUserName(): void {
    if (this.currentUser) {
      this.userName =
        `${this.currentUser.prenom} ${this.currentUser.nom}`.trim() ||
        this.currentUser.prenom ||
        'Utilisateur';
      console.log('✍️ Nom utilisateur mis à jour:', this.userName);
    } else {
      this.userName = 'Utilisateur';
      console.log('✍️ Nom utilisateur par défaut: Aucun utilisateur');
    }
  }

  private updateProfilePhoto(): void {
    console.log('🖼️ updateProfilePhoto: Vérification des conditions', {
      currentUser: !!this.currentUser,
      photoProfil: !!this.currentUser?.photo_profil,
      cheminFichier: this.currentUser?.photo_profil?.chemin_fichier,
      storageUrl: environment.storageUrl,
    });

    if (
      this.currentUser?.photo_profil?.chemin_fichier &&
      environment.storageUrl
    ) {
      this.profilePhoto = `${environment.storageUrl}/${this.currentUser.photo_profil.chemin_fichier}`;
      console.log('✅ URL photo de profil définie:', this.profilePhoto);
    } else {
      this.profilePhoto = '/assets/images/default-avatar.png';
      console.log('⚠️ Avatar par défaut utilisé. Raison:', {
        hasCurrentUser: !!this.currentUser,
        hasPhotoProfil: !!this.currentUser?.photo_profil,
        hasCheminFichier: !!this.currentUser?.photo_profil?.chemin_fichier,
        hasStorageUrl: !!environment.storageUrl,
      });
    }
  }

  onImageError(event: Event): void {
    console.error('� ❌ Image non chargée:', this.profilePhoto);
    this.profilePhoto = '/assets/images/default-avatar.png';
    console.log('🔙 Retour à l’avatar par défaut');
  }

  showLogoutConfirm() {
    this.modal.confirm({
      nzTitle: 'Confirmation',
      nzContent: `Voulez-vous vous déconnecter, ${this.userName} ?`,
      nzOkText: 'Oui',
      nzCancelText: 'Non',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.logout(),
    });
  }

  logout() {
    console.log('🚪 Déconnexion initiée');
    this.authService.manualLogout();
  }
}