import { Component, Inject, OnInit, OnDestroy, inject } from '@angular/core';
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
import { User } from 'src/app/core/models/auth';
import { AuthService } from 'src/app/core/services/auth.service';


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
  private authService = inject(AuthService);

  isCollapsed = false;
  userName = 'Utilisateur'; // Valeur par défaut
  currentUser: User | null = null;
  isBrowser: boolean;
  private userSubscription?: Subscription;

  constructor(
    private modal: NzModalService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Fermer le menu par défaut sur mobile
    if (this.isBrowser && window.innerWidth <= 768) {
      this.isCollapsed = true;
    }
  }

  ngOnInit(): void {
    // S'abonner aux changements d'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.updateUserName();
    });

    // Récupérer l'utilisateur actuel immédiatement
    this.currentUser = this.authService.getCurrentUser();
    this.updateUserName();
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
      this.userName =
        `${this.currentUser.prenom} ${this.currentUser.nom}`.trim() ||
        this.currentUser.prenom ||
        'Utilisateur';
    } else {
      this.userName = 'Utilisateur';
    }
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
    // Utiliser le service d'authentification pour une déconnexion propre
    this.authService.manualLogout();
  }
}