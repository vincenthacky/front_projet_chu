import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { CommonModule } from '@angular/common';
import { AuthService, User } from 'src/app/core/services/auth.service';
import { TerrainsService, Terrain, TerrainResponse } from 'src/app/core/services/terrains.service';
import { SouscriptionService, ApiSouscription, SouscriptionSingleResponse } from 'src/app/core/services/souscription.service';

@Component({
  selector: 'app-create-subscription-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzGridModule,
    NzCardModule
  ],
  templateUrl: './create-subscription-admin.component.html',
  styleUrls: ['./create-subscription-admin.component.css']
})
export class CreateSubscriptionAdminComponent implements OnInit {
  subscriptionForm!: FormGroup;
  isSubmitting = false;
  users: User[] = [];
  terrains: Terrain[] = [];
  admins: User[] = [];
  statutOptions = ['active', 'suspendu', 'annule'];

  constructor(
    private fb: FormBuilder,
    private terrainsService: TerrainsService,
    private souscriptionService: SouscriptionService,
    private authService: AuthService,
    private message: NzMessageService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.message.error('Seuls les administrateurs peuvent créer des souscriptions.');
      this.router.navigate(['/']);
      return;
    }
    this.loadDropdownData();
    this.prefillAdmin();
  }

  initForm(): void {
    this.subscriptionForm = this.fb.group({
      id_utilisateur: [null, [Validators.required]],
      id_terrain: [null, [Validators.required]],
      id_admin: [null, [Validators.required]],
      nombre_terrains: [1, [Validators.required, Validators.min(1)]],
      montant_mensuel: [0, [Validators.required, Validators.min(0)]],
      nombre_mensualites: [1, [Validators.required, Validators.min(1)]],
      date_souscription: [new Date(), [Validators.required]],
      date_debut_paiement: [null, [Validators.required]],
      statut_souscription: ['active', [Validators.required]],
      groupe_souscription: ['', [Validators.required]],
      notes_admin: ['']
    });
  }

  loadDropdownData(): void {
    // Récupérer les utilisateurs non-administrateurs
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users
          .map(user => ({
            ...user,
            statut_utilisateur: this.normalizeStatutUtilisateur(user.statut_utilisateur)
          } as User))
          .filter(user => user.type !== 'superAdmin' && user.type !== 'admin');
        console.log('👥 Utilisateurs non-admin chargés:', this.users);
      },
      error: () => this.message.error('Erreur lors du chargement des utilisateurs.')
    });

    // Récupérer les terrains disponibles
    this.terrainsService.getAllTerrains().subscribe({
      next: (response: TerrainResponse) => {
        this.terrains = response.data.filter(terrain => terrain.statut_terrain === 'disponible');
        console.log('🌍 Terrains bruts récupérés:', response.data);
        console.log('🌍 Terrains disponibles chargés:', this.terrains);
      },
      error: () => this.message.error('Erreur lors du chargement des terrains.')
    });

    // Récupérer uniquement l'administrateur connecté
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.authService.isAdmin()) {
      this.admins = [{
        ...currentUser,
        statut_utilisateur: this.normalizeStatutUtilisateur(currentUser.statut_utilisateur)
      } as User];
      console.log('👤 Admin connecté chargé:', this.admins);
    } else {
      this.admins = [];
      console.warn('⚠️ Aucun administrateur connecté ou utilisateur non-admin');
      this.message.error('Aucun administrateur connecté détecté.');
    }
  }

  private normalizeStatutUtilisateur(statut: string): 'actif' | 'suspendu' | 'inactif' {
    const validStatuts = ['actif', 'suspendu', 'inactif'];
    return validStatuts.includes(statut) ? statut as 'actif' | 'suspendu' | 'inactif' : 'inactif';
  }

  prefillAdmin(): void {
    const currentUser = this.authService.getCurrentUser();
    console.log('🔍 Pré-remplissage admin - Utilisateur connecté:', currentUser);
    if (currentUser && this.authService.isAdmin()) {
      this.subscriptionForm.patchValue({
        id_admin: currentUser.id_utilisateur
      });
      console.log('✅ Champ id_admin pré-rempli avec:', currentUser.id_utilisateur);
    } else {
      console.warn('⚠️ Aucun admin connecté ou utilisateur non-admin');
    }
  }

  onSubmit(): void {
    if (this.subscriptionForm.invalid) {
      this.message.error('Veuillez remplir tous les champs requis correctement.');
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const subscriptionData: Partial<ApiSouscription> = {
      ...this.subscriptionForm.value,
      montant_mensuel: this.subscriptionForm.value.montant_mensuel.toString()
    };

    this.souscriptionService.createSouscription(subscriptionData).subscribe({
      next: (response: SouscriptionSingleResponse) => {
        this.isSubmitting = false;
        this.message.success('Souscription créée avec succès !');
        this.subscriptionForm.reset({
          id_utilisateur: null,
          id_terrain: null,
          id_admin: this.authService.getCurrentUser()?.id_utilisateur || null,
          nombre_terrains: 1,
          montant_mensuel: 0,
          nombre_mensualites: 1,
          date_souscription: new Date(),
          date_debut_paiement: null,
          statut_souscription: 'active',
          groupe_souscription: '',
          notes_admin: ''
        });
        this.router.navigate(['/dashboard/admin/details/souscription-admin']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.message.error(error.message || 'Erreur lors de la création de la souscription.');
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.values(this.subscriptionForm.controls).forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  }
}