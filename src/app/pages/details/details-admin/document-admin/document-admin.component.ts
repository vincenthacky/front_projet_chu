import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ApiDocument } from 'src/app/core/models/documents';
import { DocumentService } from 'src/app/core/services/documents.service';


@Component({
  selector: 'app-document-admin',
  standalone: true,
  imports: [ 
    CommonModule, 
    NzButtonModule, 
    NzIconModule, 
    NzPaginationModule,
    NzSpinModule,
    NzEmptyModule,
    NzCardModule,
    NzTagModule,
    NzToolTipModule
  ],
  templateUrl: './document-admin.component.html',
  styleUrl: './document-admin.component.css'
})
export class DocumentAdminComponent implements OnInit {
  documents: ApiDocument[] = [];
  loading: boolean = false;
  error: string | null = null;
  
  // Propriétés pour la pagination
  currentPage: number = 1;
  pageSize: number = 10; // Augmenté à 10 documents par page
  totalDocuments: number = 0;

  constructor(private documentService: DocumentService) { }

  ngOnInit(): void {
    this.chargerTousLesDocuments();
  }

  onPageSizeChange(size: number): void {
    console.log('Changement de taille de page de', this.pageSize, 'vers', size);
    this.pageSize = size;
    this.currentPage = 1; // Retour à la première page
    this.chargerTousLesDocuments();
  }

  /**
   * CORRECTION: Charge TOUS les documents (pas seulement ceux de l'utilisateur)
   */
  chargerTousLesDocuments(): void {
    console.log('🔍 Chargement de tous les documents...');
    this.loading = true;
    this.error = null;
    
    // CORRECTION: Utiliser getAllDocuments au lieu de getMesDocuments
    this.documentService.getAllDocuments({ 
      page: this.currentPage, 
      per_page: this.pageSize 
    }).subscribe({
      next: (response: any) => {
        console.log('📡 Réponse API:', response);
        
        if (response.success && response.data) {
          this.documents = response.data;
          this.totalDocuments = response.pagination?.total || 0;
          
          console.log('✅ Documents récupérés:', this.documents.length);
          console.log('📊 Total documents dans la base:', this.totalDocuments);
          
          // Log des premiers documents pour debug
          if (this.documents.length > 0) {
            console.log('📄 Premier document:', this.documents[0]);
          }
        } else {
          console.warn('⚠️ Réponse API sans succès:', response);
          this.documents = [];
          this.totalDocuments = 0;
        }
        
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur lors du chargement des documents:', err);
        this.error = 'Impossible de charger les documents. Veuillez réessayer.';
        this.documents = [];
        this.totalDocuments = 0;
        this.loading = false;
      }
    });
  }

  /**
   * Gère le changement de page
   */
  onPageChange(page: number): void {
    console.log('📄 Changement de page vers:', page);
    this.currentPage = page;
    this.chargerTousLesDocuments();
  }

  /**
   * Ouvre/visualise le document sélectionné
   */
  onConsulter(document: ApiDocument): void {
    console.log('👁️ Consultation du document:', document.nom_original);
    
    // Construire l'URL complète du document
    const baseUrl = this.documentService.getDocumentUrl(document.chemin_fichier);
    
    // Déterminer l'extension du fichier
    const extension = document.nom_original.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) {
      // Ouvrir l'image dans un nouvel onglet
      window.open(baseUrl, '_blank');
    } else if (extension === 'pdf') {
      // Ouvrir le PDF dans un nouvel onglet
      window.open(baseUrl, '_blank');
    } else if (['txt', 'html', 'xml', 'json'].includes(extension || '')) {
      // Ouvrir les fichiers texte dans un nouvel onglet
      window.open(baseUrl, '_blank');
    } else {
      // Pour les autres types de fichiers, proposer le téléchargement
      this.telechargerDocument(document);
    }
  }

  /**
   * Télécharge un document
   */
  public telechargerDocument(doc: ApiDocument): void {
    console.log('⬇️ Téléchargement du document:', doc.nom_original);
    
    this.documentService.telechargerDocument(doc.id_document).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.nom_original;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Document téléchargé avec succès:', doc.nom_original);
      },
      error: (err: any) => {
        console.error('❌ Erreur lors du téléchargement:', err);
        this.error = 'Erreur lors du téléchargement du document';
      }
    });
  }

  /**
   * Rafraîchit la liste des documents
   */
  rafraichir(): void {
    console.log('🔄 Rafraîchissement de la liste des documents');
    this.currentPage = 1;
    this.chargerTousLesDocuments();
  }

  /**
   * Retourne l'icône appropriée pour le type de fichier
   */
  getFileIcon(document: ApiDocument): string {
    return this.documentService.getFileIcon(document.nom_original);
  }

  /**
   * Formate la taille du fichier
   */
  formatTaille(taille: number): string {
    return this.documentService.formatTailleFichier(taille);
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatutClass(statut: string): string {
    return this.documentService.getStatutClass(statut);
  }

  /**
   * Retourne le label du statut
   */
  getStatutLabel(statut: string): string {
    return this.documentService.getStatutLabel(statut);
  }

  /**
   * Vérifie si le document est récent (moins de 7 jours)
   */
  isRecent(date: string): boolean {
    return this.documentService.isRecent(date);
  }

  /**
   * Formate la date de téléchargement
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }

  /**
   * Retourne le nom du type de document
   */
  getTypeDocument(document: ApiDocument): string {
    return document.type_document?.libelle_type_document || 'Type non défini';
  }

  /**
   * Retourne des informations sur la souscription liée
   */
  getSouscriptionInfo(document: ApiDocument): string {
    if (document.souscription) {
      return `Souscription #${document.souscription.id_souscription}`;
    }
    return 'Aucune souscription liée';
  }

  /**
   * Réessaie le chargement en cas d'erreur
   */
  retry(): void {
    this.error = null;
    this.chargerTousLesDocuments();
  }
}