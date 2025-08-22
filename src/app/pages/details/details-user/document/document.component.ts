import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzModalModule],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentComponent {
  documents = [
    {
      titre: 'Contrat de souscription',
      date: '2025-01-15',
      statut: 'success',
      statutLabel: 'Disponible',
      action: 'Consulter',
      contenu: `<p><strong>Contrat N°:</strong> CHU-2025-045</p><p><strong>Souscripteur:</strong> Jean KOUAME</p><p><strong>Type de terrain:</strong> 500m²</p><p><strong>Parcelle:</strong> A-045</p><p>Ceci est un aperçu du contrat. Le document complet contient tous les termes et conditions...</p>`
    },
    {
      titre: 'Attestation de paiement - Juin 2025',
      date: '2025-06-16',
      statut: 'success',
      statutLabel: 'Disponible',
      action: 'Consulter',
      contenu: `<p><strong>Montant:</strong> 625 000 FCFA</p><p><strong>Date:</strong> 15 juin 2025</p><p><strong>Mode:</strong> Virement bancaire</p><p><strong>Référence:</strong> VIR-2025-0615-001</p><p>Nous attestons avoir reçu la somme mentionnée ci-dessus...</p>`
    },
    {
      titre: 'Plan de la parcelle A-045',
      date: '2025-06-10',
      statut: 'success',
      statutLabel: 'Disponible',
      action: 'Consulter',
      contenu: `<p>Plan de la parcelle A-045. (Aperçu non contractuel)</p>`
    },
    {
      titre: 'Règlement intérieur de la cité',
      date: '2025-06-01',
      statut: 'success',
      statutLabel: 'Disponible',
      action: 'Consulter',
      contenu: `<p>Règlement intérieur de la cité. (Aperçu)</p>`
    }
  ];
  constructor(private modal: NzModalService) {}
  onConsulter(doc: any) {
    this.showDocumentModal(doc);
  }
  showDocumentModal(doc: any) {
    this.modal.create({
      nzTitle: doc.titre,
      nzContent: doc.contenu,
      nzWidth: 600,
      nzFooter: null
    });
  }
} 