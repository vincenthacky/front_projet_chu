import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule, NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ApiDocument } from 'src/app/core/models/documents';
import { DocumentService } from 'src/app/core/services/documents.service';

@Component({
  selector: 'app-mes-documents',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzPaginationModule,
    NzEmptyModule,
    NzModalModule
  ],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentComponent implements OnInit {
  documents: ApiDocument[] = [];
  loading: boolean = false;

  // Propriétés pour la pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalDocuments: number = 0;

  constructor(
    private documentService: DocumentService,
    private modalService: NzModalService
  ) {}

  ngOnInit(): void {
    this.chargerMesDocuments();
  }

  /**
   * Charge les documents avec pagination
   */
  chargerMesDocuments(): void {
    this.loading = true;

    this.documentService.getMesDocuments({
      page: this.currentPage,
      per_page: this.pageSize
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.documents = response.data;
          this.totalDocuments = response.pagination.total;
          console.log('Documents récupérés:', this.documents);
          console.log('Total documents:', this.totalDocuments);
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des documents:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Gère le changement de page
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.chargerMesDocuments();
  }

  /**
   * Ouvre/visualise le document sélectionné dans un modal
   */
  onConsulter(document: ApiDocument): void {
    console.log('Consultation du document:', document);

    // Construire l'URL complète du document
    const documentUrl = this.documentService.getDocumentUrl(document.chemin_fichier);
    const extension = document.nom_original.split('.').pop()?.toLowerCase();

    // Créer le contenu du modal en fonction du type de fichier
    let modalContent: string;
    if (this.documentService.isImage(document.nom_original)) {
      // Pour les images, afficher une balise <img>
      modalContent = `
        <div style="display: flex; justify-content: center; align-items: center; max-height: 80vh;">
          <img src="${documentUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${document.nom_original}">
        </div>
      `;
    } else if (extension === 'pdf') {
      // Pour les PDFs, utiliser un iframe
      modalContent = `
        <div style="width: 100%; height: 80vh;">
          <iframe src="${documentUrl}" style="width: 100%; height: 100%;" frameborder="0"></iframe>
        </div>
      `;
    } else {
      // Pour les autres types de fichiers, indiquer qu'ils ne peuvent pas être visualisés
      modalContent = `
        <div style="text-align: center;">
          <p>Le fichier "${document.nom_original}" ne peut pas être visualisé directement.</p>
        </div>
      `;
    }

    // Créer le modal
    this.modalService.create({
      nzTitle: document.nom_original,
      nzContent: modalContent,
      nzWidth: '80%',
      nzStyle: { top: '20px' },
      nzOnOk: () => true,
      nzOnCancel: () => true,
      nzFooter: [
        {
          label: 'Fermer',
          onClick: (modal: NzModalRef) => modal.destroy() // Explicitly type modal as NzModalRef
        }
      ]
    });
  }

  /**
   * Rafraîchit la liste des documents
   */
  rafraichir(): void {
    this.currentPage = 1;
    this.chargerMesDocuments();
  }
}