import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Import Router
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
import { SouscriptionService, ApiSouscription, SouscriptionSingleResponse, Terrain } from 'src/app/core/services/souscription.service';

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
  statutOptions = ['active', 'pending', 'suspendu', 'annule'];

  constructor(
    private fb: FormBuilder,
    private souscriptionService: SouscriptionService,
    private authService: AuthService,
    private message: NzMessageService,
    private router: Router // Inject Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.message.error('Seuls les administrateurs peuvent créer des souscriptions.');
      this.router.navigate(['/']); // Use injected Router
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
    // Récupérer les utilisateurs
    this.souscriptionService.getAllSouscriptions({ all_users: true }).subscribe({
      next: (response) => {
        this.users = response.data.map(s => ({
          ...s.utilisateur,
          statut_utilisateur: this.normalizeStatutUtilisateur(s.utilisateur.statut_utilisateur)
        } as User)).filter((v, i, a) => a.findIndex(t => t.id_utilisateur === v.id_utilisateur) === i);
        console.log('👥 Utilisateurs chargés:', this.users);
      },
      error: () => this.message.error('Erreur lors du chargement des utilisateurs.')
    });

    // Récupérer les terrains
    this.souscriptionService.getTerrains().subscribe({
      next: (terrains) => {
        this.terrains = terrains;
        console.log('🌍 Terrains chargés:', this.terrains);
      },
      error: () => this.message.error('Erreur lors du chargement des terrains.')
    });

    // Récupérer les administrateurs
    this.souscriptionService.getAllSouscriptions({ admin_view: true }).subscribe({
      next: (response) => {
        this.admins = response.data.map(s => ({
          ...s.admin,
          statut_utilisateur: this.normalizeStatutUtilisateur(s.admin.statut_utilisateur)
        } as User)).filter((v, i, a) => a.findIndex(t => t.id_utilisateur === v.id_utilisateur) === i);
        console.log('👤 Admins chargés:', this.admins);
      },
      error: () => this.message.error('Erreur lors du chargement des administrateurs.')
    });
  }

  // Normaliser le champ statut_utilisateur pour correspondre à l'interface User
  private normalizeStatutUtilisateur(statut: string): 'actif' | 'suspendu' | 'inactif' {
    const validStatuts = ['actif', 'suspendu', 'inactif'];
    return validStatuts.includes(statut) ? statut as 'actif' | 'suspendu' | 'inactif' : 'inactif';
  }

  prefillAdmin(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && this.authService.isAdmin()) {
      this.subscriptionForm.patchValue({
        id_admin: currentUser.id_utilisateur
      });
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
        this.router.navigate(['/dashboard/admin/details']); // Use injected Router
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