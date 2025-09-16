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
import { User } from 'src/app/core/models/auth';
import { AuthService } from 'src/app/core/services/auth.service';



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
    // S'abonner aux changements d'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
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
      this.userName = `${this.currentUser.prenom} ${this.currentUser.nom}`.trim() || 
                      this.currentUser.prenom || 
                      'Administrateur';
    } else {
      this.userName = 'Administrateur';
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
      nzOnOk: () => this.logout()
    });
  }

  logout() {
    // Utiliser le service d'authentification pour une déconnexion propre
    this.authService.manualLogout();
  }
}