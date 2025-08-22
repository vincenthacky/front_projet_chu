import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-reclamation',
  standalone: true,
  imports: [
    CommonModule, NzTableModule, NzTagModule, NzButtonModule, NzModalModule,
    NzFormModule, NzInputModule, NzSelectModule, NzDatePickerModule,
    FormsModule, ReactiveFormsModule
  ],
  templateUrl: './reclamation.component.html',
  styleUrls: ['./reclamation.component.css']
})
export class ReclamationComponent {
  souscriptions = [
    { id: 1, label: 'Souscription 1 - Terrain A' },
    { id: 2, label: 'Souscription 2 - Terrain B' }
  ];
  paiements = [
    { id: 1, label: 'Paiement 1 - 15/01/2024', souscriptionId: 1 },
    { id: 2, label: 'Paiement 2 - 15/02/2024', souscriptionId: 1 },
    { id: 3, label: 'Paiement 1 - 20/01/2024', souscriptionId: 2 }
  ];
  reclamations = [
    {
      id: 1,
      titre: 'Erreur de paiement',
      description: 'J\'ai payé mais le paiement n\'apparaît pas.',
      type_reclamation: 'anomalie_paiement',
      date_reclamation: '2024-04-01',
      statut: { libelle_statut_reclamation: 'En cours', color: 'blue' },
      priorite: 'Haute',
      reponse_admin: 'Nous vérifions votre dossier.',
      date_reponse: '2024-04-02',
      date_resolution: '',
      satisfaction_client: 0,
      souscription: 'Souscription 1 - Terrain A',
      paiement: 'Paiement 2 - 15/02/2024'
    },
    {
      id: 2,
      titre: 'Document manquant',
      description: 'Je n\'ai pas reçu mon attestation.',
      type_reclamation: 'document_manquant',
      date_reclamation: '2024-03-15',
      statut: { libelle_statut_reclamation: 'Résolue', color: 'green' },
      priorite: 'Normale',
      reponse_admin: 'Document envoyé par email.',
      date_reponse: '2024-03-16',
      date_resolution: '2024-03-17',
      satisfaction_client: 5,
      souscription: 'Souscription 2 - Terrain B',
      paiement: ''
    }
  ];
  isModalVisible = false;
  form: FormGroup;
  typeOptions = [
    { value: 'anomalie_paiement', label: 'Anomalie Paiement' },
    { value: 'information_erronee', label: 'Information Erronée' },
    { value: 'document_manquant', label: 'Document Manquant' },
    { value: 'avancement_projet', label: 'Avancement Projet' },
    { value: 'autre', label: 'Autre' }
  ];
  prioriteOptions = [
    { value: 'Haute', label: 'Haute' },
    { value: 'Normale', label: 'Normale' },
    { value: 'Basse', label: 'Basse' }
  ];
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      souscription: [null, Validators.required],
      paiement: [null],
      titre: [null, [Validators.required, Validators.maxLength(100)]],
      description: [null, [Validators.required, Validators.maxLength(500)]],
      type_reclamation: [null, Validators.required],
      priorite: ['Normale'],
      piece_jointe: [null]
    });
  }
  getPaiementsForSouscription(souscriptionId: number) {
    return this.paiements.filter(p => p.souscriptionId === souscriptionId);
  }
  showModal(): void {
    this.form.reset({ priorite: 'Normale' });
    this.isModalVisible = true;
  }
  handleOk(): void {
    if (this.form.valid) {
      const value = this.form.value;
      this.reclamations.unshift({
        id: this.reclamations.length + 1,
        titre: value.titre as string,
        description: value.description as string,
        type_reclamation: value.type_reclamation as string,
        date_reclamation: new Date().toISOString().slice(0, 10),
        statut: { libelle_statut_reclamation: 'En attente', color: 'orange' },
        priorite: value.priorite as string,
        reponse_admin: '' as string,
        date_reponse: '' as string,
        date_resolution: '' as string,
        satisfaction_client: 0 as number,
        souscription: (this.souscriptions.find(s => s.id === value.souscription)?.label ?? '') as string,
        paiement: value.paiement ? (this.paiements.find(p => p.id === value.paiement)?.label ?? '') : '' as string
      });
      this.isModalVisible = false;
    } else {
      Object.values(this.form.controls).forEach(control => control.markAsTouched());
    }
  }
  handleCancel(): void {
    this.isModalVisible = false;
  }
} 