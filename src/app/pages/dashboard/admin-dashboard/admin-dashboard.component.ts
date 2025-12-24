import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { Subscription } from 'rxjs';
import { User, UserProfileResponse } from 'src/app/core/models/auth';
import { AuthService } from 'src/app/core/services/auth.service';
import { environment } from 'src/assets/environment/environment';



@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NzLayoutModule, NzMenuModule, NzIconModule, RouterLink, RouterOutlet, NzToolTipModule, NzAvatarModule, NzModalModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  
  isCollapsed = false;
  userName = 'Administrateur'; // Sera mis à jour avec les vraies données
  profilePhoto = '/assets/images/default-avatar.png'; // Avatar par défaut local
  currentUser: User | null = null;
  isBrowser: boolean;
  
  // Subscription pour les mises à jour de l'utilisateur
  private userSubscription?: Subscription;

  constructor(private modal: NzModalService, @Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Fermer le menu par défaut sur mobile
    if (this.isBrowser && window.innerWidth <= 768) {
      this.isCollapsed = true;
    }
  }

  ngOnInit(): void {
    console.log('🟢 ngOnInit: Initialisation du composant admin');
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
            this.authService.updateCurrentUser(response.data);
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
    }
  }

  /**
   * Mettre à jour le nom d'utilisateur
   */
  private updateUserName(): void {
    if (this.currentUser) {
      // Utiliser prenom + nom, ou juste prenom, ou fallback
      this.userName = `${this.currentUser.prenom} ${this.currentUser.nom}`.trim() || 
                      this.currentUser.prenom || 
                      'Administrateur';
      console.log('✍️ Nom utilisateur mis à jour:', this.userName);
    } else {
      this.userName = 'Administrateur';
      console.log('✍️ Nom utilisateur par défaut: Aucun utilisateur');
    }
  }

  /**
   * Mettre à jour la photo de profil
   */
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

  /**
   * Gérer les erreurs d'image
   */
  onImageError(event: Event): void {
    console.error('❌ Image non chargée:', this.profilePhoto);
    this.profilePhoto = '/assets/images/default-avatar.png';
    console.log('🔙 Retour à l\'avatar par défaut');
  }

  showLogoutConfirm() {
    this.modal.confirm({
      nzTitle: 'Confirmation',
      nzContent: `Voulez-vous vous déconnecter, ${this.userName} ?`,
      nzOkText: 'Oui',
      nzCancelText: 'Non',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.logout()
    });
  }

  logout() {
    // Utiliser le service d'authentification pour une déconnexion propre
    this.authService.manualLogout();
  }
}