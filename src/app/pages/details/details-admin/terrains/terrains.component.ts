import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Terrain } from 'src/app/core/models/souscription';
import { TerrainsService } from 'src/app/core/services/terrains.service';


@Component({
  selector: 'app-terrains',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTagModule,
    NzIconModule,
    NzToolTipModule,
    NzSpinModule,
    NzGridModule,
    NzModalModule,
    NzMessageModule
  ],
  templateUrl: './terrains.component.html',
  styleUrl: './terrains.component.css'
})
export class TerrainsComponent implements OnInit {
  terrainForm: FormGroup;
  terrains: Terrain[] = [];
  selectedTerrain: Terrain | null = null;
  loading = false;
  submitting = false;
  isEditMode = false;

  statusOptions = [
    { label: 'Disponible', value: 'disponible' },
    { label: 'Vendu', value: 'vendu' },
    { label: 'Réservé', value: 'reserve' }
  ];

  currencyFormatter = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '';
    return `${value.toLocaleString('fr-FR')} FCFA`;
  };

  currencyParser = (value: string): string => {
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    return cleanedValue || '0';
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private terrainService: TerrainsService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {
    this.terrainForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('TerrainsComponent initialisé');
    this.loadTerrains();
    this.route.params.subscribe(params => {
      console.log('Paramètres de route:', params);
    });

    this.terrainForm.valueChanges.subscribe(() => {
      console.log('Formulaire changé - Valide ?', this.terrainForm.valid);
      console.log('Erreurs du formulaire:', this.terrainForm.errors);
      Object.keys(this.terrainForm.controls).forEach(key => {
        const control = this.terrainForm.get(key);
        if (control?.invalid) {
          console.log(`Champ ${key} invalide:`, control.errors);
        }
      });
    });

    this.terrainForm.get('prix_unitaire')?.valueChanges.subscribe(value => {
      if (typeof value === 'string') {
        const numericValue = parseFloat(value) || 0;
        if (numericValue !== this.terrainForm.get('prix_unitaire')?.value) {
          this.terrainForm.get('prix_unitaire')?.setValue(numericValue, { emitEvent: false });
        }
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      libelle: ['', [Validators.required, Validators.minLength(3)]],
      localisation: ['', [Validators.required, Validators.minLength(5)]],
      superficie: [null, [Validators.required, Validators.min(1)]],
      prix_unitaire: [null, [Validators.required, Validators.min(1)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      statut_terrain: ['disponible', [Validators.required]],
    });
  }

  loadTerrains(): void {
    this.loading = true;
    console.log('Chargement des terrains...');
    this.terrainService.getAllTerrains().subscribe({
      next: (response) => {
        console.log('Réponse API:', response);
        if (response.success) {
          this.terrains = response.data;
          console.log('Terrains chargés:', this.terrains);
          if (this.terrains.length > 0 && !this.selectedTerrain) {
            this.selectedTerrain = this.terrains[0];
            console.log('Terrain sélectionné:', this.selectedTerrain);
          }
        } else {
          this.message.error('Erreur lors du chargement des terrains');
        }
      },
      error: (error) => {
        console.error('Erreur API:', error);
        this.message.error('Impossible de charger les terrains');
      },
      complete: () => {
        this.loading = false;
        console.log('Chargement terminé, loading:', this.loading);
      }
    });
  }

  onSubmit(): void {
    console.log('Soumission du formulaire - Valeurs:', this.terrainForm.value);
    console.log('Prix unitaire:', this.terrainForm.get('prix_unitaire')?.value);
    console.log('Formulaire valide ?', this.terrainForm.valid);
    if (this.terrainForm.valid) {
      this.submitting = true;
      const formData = this.terrainForm.value;

      if (!this.isEditMode) {
        formData.date_creation = new Date().toISOString().split('T')[0];
      }

      const operation = this.isEditMode 
        ? this.terrainService.updateTerrain(this.selectedTerrain!.id_terrain!, formData)
        : this.terrainService.createTerrain(formData);

      operation.subscribe({
        next: (response) => {
          if (response.success) {
            this.message.success(
              this.isEditMode ? 'Terrain modifié avec succès' : 'Terrain créé avec succès'
            );
            this.loadTerrains();
            this.resetForm();
          } else {
            this.message.error(response.message || 'Erreur lors de la sauvegarde');
          }
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.message.error('Erreur lors de la sauvegarde du terrain');
        },
        complete: () => {
          this.submitting = false;
        }
      });
    } else {
      this.markFormGroupTouched();
      this.message.warning('Veuillez corriger les erreurs du formulaire');
    }
  }

  editTerrain(terrain: Terrain): void {
    this.isEditMode = true;
    this.selectedTerrain = terrain;
    this.terrainForm.patchValue({
      libelle: terrain.libelle,
      localisation: terrain.localisation,
      superficie: parseFloat(terrain.superficie.toString()),
      prix_unitaire: parseFloat(terrain.prix_unitaire.toString()) || 0,
      description: terrain.description,
      statut_terrain: terrain.statut_terrain,
    });
    console.log('Formulaire après patchValue:', this.terrainForm.value);
  }

  deleteTerrain(terrain: Terrain): void {
    this.modal.confirm({
      nzTitle: 'Confirmer la suppression',
      nzContent: `Êtes-vous sûr de vouloir supprimer le terrain "${terrain.libelle}" ?`,
      nzOkText: 'Supprimer',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Annuler',
      nzOnOk: () => {
        this.terrainService.deleteTerrain(terrain.id_terrain!).subscribe({
          next: (response) => {
            this.message.success('Terrain supprimé avec succès');
            this.loadTerrains();
            if (this.selectedTerrain?.id_terrain === terrain.id_terrain) {
              this.selectedTerrain = null;
              this.resetForm();
            }
          },
          error: (error) => {
            console.error('Erreur:', error);
            this.message.error('Erreur lors de la suppression');
          }
        });
      }
    });
  }

  selectTerrain(terrain: Terrain): void {
    this.selectedTerrain = terrain;
    if (this.isEditMode) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.isEditMode = false;
    this.terrainForm.reset({
      statut_terrain: 'disponible',
      prix_unitaire: null,
      superficie: null,
      libelle: '',
      localisation: '',
      description: '',
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.terrainForm.controls).forEach(key => {
      this.terrainForm.get(key)?.markAsTouched();
    });
  }

  isFieldError(fieldName: string): boolean {
    const field = this.terrainForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.terrainForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `${fieldName} trop court`;
      if (field.errors['min']) return `Valeur trop petite`;
      if (field.errors['pattern']) return 'Format invalide (ex: 5.34567,-4.01234)';
    }
    return '';
  }

  formatPrice(price: string | number): string {
    const value = typeof price === 'string' ? parseFloat(price) : price;
    return `${value.toLocaleString('fr-FR')} FCFA`;
  }

  formatSuperficie(superficie: string | number): string {
    const value = typeof superficie === 'string' ? parseFloat(superficie) : superficie;
    return `${value.toFixed(2)} m²`;
  }

  getStatusColor(status: string): string {
    return this.terrainService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.terrainService.getStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  calculateTotalPrice(terrain: Terrain): string {
    const superficie = parseFloat(terrain.superficie.toString());
    const prixUnitaire = parseFloat(terrain.prix_unitaire.toString());
    return this.formatPrice(superficie * prixUnitaire);
  }

  trackByTerrain(index: number, terrain: Terrain): number | undefined {
    return terrain.id_terrain;
  }

  onPrixUnitaireChange(value: number): void {
    console.log('Prix unitaire changé:', value);
    console.log('FormControl prix_unitaire:', this.terrainForm.get('prix_unitaire')?.value);
    console.log('Formulaire valide ?', this.terrainForm.valid);
  }
}