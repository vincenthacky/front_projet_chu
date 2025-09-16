
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { ApiDocument } from 'src/app/core/models/documents';
import { DocumentService } from 'src/app/core/services/documents.service';
import { NzEmptyModule } from 'ng-zorro-antd/empty';


@Component({
  selector: 'app-mes-documents',
  standalone: true,
  imports: [
    CommonModule, 
    NzButtonModule, 
    NzIconModule, 
    NzPaginationModule,
    NzEmptyModule
  ],
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.css']
})
export class DocumentComponent implements OnInit {
  documents: ApiDocument[] = [];
  loading: boolean = false;
  
  // Propriétés pour la pagination
  currentPage: number = 1;
  pageSize: number = 5; // 5 documents par page
  totalDocuments: number = 0;

  constructor(private documentService: DocumentService) { }

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
   * Ouvre/visualise le document sélectionné
   */
  onConsulter(document: ApiDocument): void {
    console.log('Consultation du document:', document);
    
    // Construire l'URL complète du document
    const baseUrl = this.documentService.getDocumentUrl(document.chemin_fichier);
    
    // Si c'est une image, on peut l'afficher directement
    const extension = document.nom_original.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      // Ouvrir l'image dans un nouvel onglet
      window.open(baseUrl, '_blank');
    } else if (extension === 'pdf') {
      // Ouvrir le PDF dans un nouvel onglet
      window.open(baseUrl, '_blank');
    } else {
      // Pour les autres types de fichiers, proposer le téléchargement
      this.telechargerDocument(document);
    }
  }

  /**
   * Télécharge un document
   */
  private telechargerDocument(doc: ApiDocument): void {
    this.documentService.telechargerDocument(doc.id_document).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a'); // Utiliser window.document
        link.href = url;
        link.download = doc.nom_original;
        window.document.body.appendChild(link); // Utiliser window.document
        link.click();
        window.document.body.removeChild(link); // Utiliser window.document
        window.URL.revokeObjectURL(url);
        
        console.log('Document téléchargé:', doc.nom_original);
      },
      error: (err: any) => {
        console.error('Erreur lors du téléchargement:', err);
        alert('Erreur lors du téléchargement du document');
      }
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