
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
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
    NzCardModule,
    NzModalModule,
    NzTagModule,
    NzToolTipModule,
    NzSpinModule,
    NzTypographyModule
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

  // Propriétés pour le modal
  isModalVisible = false;
  selectedDocument: ApiDocument | null = null;
  documentUrl = '';

  constructor(public documentService: DocumentService) { }

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
   * Ouvre le modal pour visualiser le document
   */
  onConsulter(document: ApiDocument): void {
    console.log('Consultation du document:', document);
    this.selectedDocument = document;
    this.documentUrl = this.documentService.getDocumentUrl(document.chemin_fichier);
    this.isModalVisible = true;
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.isModalVisible = false;
    this.selectedDocument = null;
    this.documentUrl = '';
  }

  /**
   * Obtient l'icône appropriée selon le type de fichier
   */
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'file-image';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return 'video-camera';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'xls':
      case 'xlsx':
        return 'file-excel';
      default:
        return 'file';
    }
  }

  /**
   * Détermine si le fichier est une image
   */
  isImage(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  }

  /**
   * Détermine si le fichier est un PDF
   */
  isPdf(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension === 'pdf';
  }

  /**
   * Détermine si le fichier est une vidéo
   */
  isVideo(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension || '');
  }

  /**
   * Obtient la couleur du tag selon le type de document
   */
  getDocumentTypeColor(typeDocument: string): string {
    switch (typeDocument) {
      case 'CNI':
        return 'blue';
      case 'Photo de Profil':
        return 'green';
      case 'Carte Professionnelle':
        return 'orange';
      case 'Fiche de Souscription':
        return 'purple';
      default:
        return 'default';
    }
  }

  /**
   * Formate la taille du fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Ouvre le document dans un nouvel onglet
   */
  openInNewTab(): void {
    if (this.documentUrl) {
      window.open(this.documentUrl, '_blank');
    }
  }

  /**
   * Gère les erreurs de chargement d'images
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/image-error.png';
  }

  /**
   * Télécharge un document
   */
  telechargerDocument(doc: ApiDocument): void {
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