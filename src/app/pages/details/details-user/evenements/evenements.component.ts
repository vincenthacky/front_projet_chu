import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { EvenementOrganise, ApiEvenement, TypeEvenement } from 'src/app/core/models/evenements';
import { DocumentService } from 'src/app/core/services/documents.service';
import { EvenementsService } from 'src/app/core/services/evenements.service';

interface DocumentWithType {
  id_document: number;
  nom_original: string;
  chemin_fichier: string;
  type_mime: string | null;
  taille_fichier: number;
  description_document: string;
}

@Component({
  selector: 'app-evenements',
  standalone: true,
  imports: [
    CommonModule, 
    NzCardModule, 
    NzTagModule, 
    NzProgressModule, 
    NzGridModule, 
    NzPaginationModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule
  ],
  templateUrl: './evenements.component.html',
  styleUrls: ['./evenements.component.css']
})
export class EvenementsComponent implements OnInit {
  isBrowser: boolean;

  evenementsOrganises: EvenementOrganise[] = [];
  evenementsSouscription: ApiEvenement[] = [];
  evenementsGlobaux: ApiEvenement[] = [];
  statistiques: any = null;
  loading: boolean = false;
  error: string = '';
  
  // Propriétés de pagination
  currentPage: number = 1;
  pageSize: number = 3;
  
  // Modal pour agrandir une image
  isImageModalVisible: boolean = false;
  selectedImageUrl: string = '';
  selectedImageTitle: string = '';
  
  // Modal pour visualiser un PDF
  isPdfModalVisible: boolean = false;
  selectedPdfUrl: string = '';
  selectedPdfTitle: string = '';
  
  // Filtres
  selectedStatut: string = '';
  searchQuery: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private evenementsService: EvenementsService,
    private documentService: DocumentService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.chargerMesEvenements();
  }

  // Méthode pour afficher les informations de pagination
  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.evenementsSouscription.length);
    return `${start}-${end} sur ${this.evenementsSouscription.length}`;
  }

  // Méthode pour obtenir les événements paginés
  getPaginatedEvents(): ApiEvenement[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.evenementsSouscription.slice(startIndex, endIndex);
  }

  // Gestionnaire de changement de page
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // Gestion dynamique du statut basé sur les dates
  getEventStatusDynamic(event: ApiEvenement): { 
    status: string; 
    percentage: number; 
    color: string;
    bgColor: string;
  } {
    const now = new Date();
    const dateDebut = new Date(event.date_debut_evenement);
    const dateFin = new Date(event.date_fin_evenement);
    
    // Normaliser les dates (enlever l'heure pour la comparaison)
    now.setHours(0, 0, 0, 0);
    dateDebut.setHours(0, 0, 0, 0);
    dateFin.setHours(0, 0, 0, 0);
    
    if (now < dateDebut) {
      // À venir
      return {
        status: 'À venir',
        percentage: 0,
        color: '#6b7280',
        bgColor: '#f3f4f6'
      };
    } else if (now >= dateDebut && now <= dateFin) {
      // En cours
      return {
        status: 'En cours',
        percentage: 50,
        color: '#3b82f6',
        bgColor: '#dbeafe'
      };
    } else {
      // Terminé
      return {
        status: 'Terminé',
        percentage: 100,
        color: '#10b981',
        bgColor: '#d1fae5'
      };
    }
  }

  // Récupère les images d'un événement
  getEventImages(event: ApiEvenement): DocumentWithType[] {
    if (!event.documents || event.documents.length === 0) {
      return [];
    }
    
    return event.documents.filter((doc: any) => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isImageByExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension);
      const isImageByMime = doc.type_mime?.startsWith('image/') || false;
      
      return isImageByExtension || isImageByMime;
    });
  }
  
  // Récupère les vidéos d'un événement
  getEventVideos(event: ApiEvenement): DocumentWithType[] {
    if (!event.documents || event.documents.length === 0) {
      return [];
    }
    
    return event.documents.filter((doc: any) => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isVideoByExtension = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(extension);
      const isVideoByMime = doc.type_mime?.startsWith('video/') || false;
      
      return isVideoByExtension || isVideoByMime;
    });
  }

  // Récupère les PDFs d'un événement
  getEventPdfs(event: ApiEvenement): DocumentWithType[] {
    if (!event.documents || event.documents.length === 0) {
      return [];
    }
    
    return event.documents.filter((doc: any) => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isPdfByExtension = extension === 'pdf';
      const isPdfByMime = doc.type_mime === 'application/pdf';
      
      return isPdfByExtension || isPdfByMime;
    });
  }
  
  // Génère l'URL complète d'un document
  getDocumentUrl(doc: DocumentWithType): string {
    if (!doc || !doc.chemin_fichier) {
      return this.documentService.getImagePlaceholder();
    }

    return this.documentService.getDocumentUrl(doc.chemin_fichier);
  }
  
  // Ouvre le modal pour agrandir une image
  openImageModal(imageUrl: string, eventTitle: string): void {
    this.selectedImageUrl = imageUrl;
    this.selectedImageTitle = eventTitle;
    this.isImageModalVisible = true;
  }
  
  // Ferme le modal d'image
  closeImageModal(): void {
    this.isImageModalVisible = false;
    this.selectedImageUrl = '';
    this.selectedImageTitle = '';
  }

  // Ouvre le modal pour visualiser un PDF
  openPdfModal(pdfUrl: string, eventTitle: string): void {
    this.selectedPdfUrl = pdfUrl;
    this.selectedPdfTitle = eventTitle;
    this.isPdfModalVisible = true;
  }
  
  // Ferme le modal PDF
  closePdfModal(): void {
    this.isPdfModalVisible = false;
    this.selectedPdfUrl = '';
    this.selectedPdfTitle = '';
  }

  // Ouvre le PDF dans un nouvel onglet
  openPdfInNewTab(pdfUrl: string): void {
    window.open(pdfUrl, '_blank');
  }
  
  // Gestion d'erreur d'image
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src) {
      imgElement.src = this.documentService.getImagePlaceholder();
      imgElement.alt = 'Image non disponible';
    }
  }
  
  // Gestion d'erreur vidéo
  onVideoError(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    if (videoElement) {
      videoElement.style.display = 'none';
      
      const errorMsg = document.createElement('div');
      errorMsg.className = 'video-error-message';
      errorMsg.textContent = 'Vidéo non disponible';
      errorMsg.style.cssText = 'color: #ef4444; font-size: 0.875rem; padding: 0.5rem;';
      
      if (videoElement.parentNode) {
        videoElement.parentNode.insertBefore(errorMsg, videoElement.nextSibling);
      }
    }
  }

  // Obtenir l'icône selon le type d'événement
  getEventIcon(typeEvenement: TypeEvenement): string {
    if (typeEvenement.icone_type) {
      return typeEvenement.icone_type.replace('fas ', '');
    }
    
    const icons: { [key: string]: string } = {
      'Viabilisation': 'fa-tools',
      'Construction': 'fa-hard-hat',
      'Cérémonie': 'fa-certificate',
      'Annonce': 'fa-flag',
      'Attribution': 'fa-certificate',
      'Inauguration': 'fa-flag',
      'Aménagement Paysager': 'fa-tree'
    };
    return icons[typeEvenement.libelle_type_evenement] || 'fa-calendar';
  }

  // Obtenir la couleur selon le type et l'avancement
  getEventColor(typeEvenement: TypeEvenement, avancement: number): string {
    if (avancement === 100) {
      return 'bg-green';
    }
    
    if (typeEvenement.couleur_affichage) {
      return `bg-custom`;
    }
    
    const colors: { [key: string]: string } = {
      'Viabilisation': 'bg-blue',
      'Construction': 'bg-orange',
      'Cérémonie': 'bg-green',
      'Annonce': 'bg-purple',
      'Attribution': 'bg-green',
      'Inauguration': 'bg-purple',
      'Aménagement Paysager': 'bg-teal'
    };
    return colors[typeEvenement.libelle_type_evenement] || 'bg-blue';
  }

  // Obtenir la classe CSS pour le type d'événement
  getTypeClass(typeLibelle: string): string {
    return 'type-' + typeLibelle.toLowerCase().replace(/\s+/g, '-');
  }

  // Obtenir le label de progression
  getProgressLabel(typeLibelle: string): string {
    const labels: { [key: string]: string } = {
      'Viabilisation': 'Avancement des travaux de viabilisation',
      'Construction': 'Avancement de la construction',
      'Cérémonie': 'Processus de cérémonie',
      'Annonce': 'Projet global',
      'Attribution': 'Processus d\'attribution',
      'Inauguration': 'Projet global',
      'Aménagement Paysager': 'Avancement de l\'aménagement'
    };
    return labels[typeLibelle] || 'Progression';
  }

  // Obtenir le dégradé de progression
  getProgressGradient(avancement: number, event?: ApiEvenement): string {
    if (event) {
      const statusInfo = this.getEventStatusDynamic(event);
      if (statusInfo.percentage === 100) {
        return 'linear-gradient(135deg, #10b981, #059669)';
      } else if (statusInfo.percentage >= 50) {
        return 'linear-gradient(135deg, #3b82f6, #1e40af)';
      } else {
        return 'linear-gradient(135deg, #6b7280, #4b5563)';
      }
    }
    
    // Fallback
    if (avancement === 100) {
      return 'linear-gradient(135deg, #10b981, #059669)';
    } else if (avancement >= 50) {
      return 'linear-gradient(135deg, #3b82f6, #1e40af)';
    } else {
      return 'linear-gradient(135deg, #f59e0b, #d97706)';
    }
  }

  // Gestionnaire de clic sur événement
  onEventClick(event: ApiEvenement): void {
    // Action personnalisée lors du clic sur un événement
  }

  // Méthodes utilitaires
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Calcul des labels de dates dynamiques
  getDateRangeLabel(events: ApiEvenement[]): string {
    if (!events || events.length === 0) return '';
    
    const sortedEvents = events.sort((a, b) => 
      new Date(a.date_debut_evenement).getTime() - new Date(b.date_debut_evenement).getTime()
    );
    
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    
    const firstDate = new Date(firstEvent.date_debut_evenement);
    const lastDate = new Date(lastEvent.date_debut_evenement);
    
    if (firstDate.getMonth() === lastDate.getMonth() && firstDate.getFullYear() === lastDate.getFullYear()) {
      return this.formatMonthYear(firstDate);
    }
    
    if (firstDate.getFullYear() === lastDate.getFullYear()) {
      return `${this.formatMonthYear(firstDate)} - ${this.formatMonthYear(lastDate)}`;
    }
    
    return `${this.formatMonthYear(firstDate)} - ${this.formatMonthYear(lastDate)}`;
  }

  formatMonthYear(date: Date): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  chargerMesEvenements(): void {
    this.loading = true;
    this.error = '';
    
    const filters = {
      per_page: 50,
      ...(this.selectedStatut && { statut: this.selectedStatut }),
      ...(this.searchQuery && { search: this.searchQuery })
    };

    this.evenementsService.getMesEvenements(filters).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.evenementsOrganises = response.data.evenements_organises;
          this.statistiques = response.data.statistiques;
          this.convertirDonneesApi();
          this.currentPage = 1;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des événements';
        console.error('Erreur lors du chargement des événements:', err);
      }
    });
  }

  convertirDonneesApi(): void {
    this.evenementsSouscription = [];
    this.evenementsGlobaux = [];
    
    this.evenementsOrganises.forEach(typeGroup => {
      typeGroup.mois.forEach(mois => {
        mois.evenements.forEach(apiEvent => {
          if (this.estEvenementPersonnel(apiEvent)) {
            this.evenementsSouscription.push(apiEvent);
          } else {
            this.evenementsGlobaux.push(apiEvent);
          }
        });
      });
    });
    
    this.sortEventsByDate();
  }

  estEvenementPersonnel(event: ApiEvenement): boolean {
    return event.souscription !== null && 
           (event.type_evenement.categorie_type === 'travaux_terrain' || 
            event.type_evenement.categorie_type === 'personnel');
  }

  sortEventsByDate(): void {
    this.evenementsSouscription.sort((a, b) => 
      new Date(b.date_debut_evenement).getTime() - new Date(a.date_debut_evenement).getTime()
    );
    this.evenementsGlobaux.sort((a, b) => 
      new Date(b.date_debut_evenement).getTime() - new Date(a.date_debut_evenement).getTime()
    );
  }

  onFilterChange(): void {
    this.chargerMesEvenements();
  }

  onSearch(): void {
    this.chargerMesEvenements();
  }

  voirDocuments(event: ApiEvenement): void {
    // Action pour voir les documents d'un événement
  }

  // Méthodes utilitaires du service
  getStatutClass(statut: string): string {
    return this.evenementsService.getStatutClass(statut);
  }

  getPrioriteClass(priorite: string): string {
    return this.evenementsService.getPrioriteClass(priorite);
  }

  getPrioriteLabel(priorite: string): string {
    return this.evenementsService.getPrioriteLabel(priorite);
  }

  formatCurrency(amount: number | null): string {
    return this.evenementsService.formatCurrency(amount);
  }

  getProgressColor(percentage: number): string {
    if (percentage < 25) return '#dc3545';
    if (percentage < 50) return '#fd7e14';
    if (percentage < 75) return '#ffc107';
    return '#28a745';
  }

  // Méthodes utilitaires pour le template

  // Vérifie si un événement a des documents
  hasDocuments(event: ApiEvenement): boolean {
    return event.documents && event.documents.length > 0;
  }

  // Obtient le nombre de documents
  getDocumentsLength(event: ApiEvenement): number {
    return event.documents ? event.documents.length : 0;
  }

  // Obtient l'extension d'un fichier
  getFileExtension(fileName: string): string {
    return fileName ? fileName.split('.').pop()?.toLowerCase() || '' : '';
  }

  // Vérifie si un document est une image
  isDocumentImage(fileName: string): boolean {
    return this.documentService.isImage(fileName);
  }

  // Vérifie si un document est une vidéo
  isDocumentVideo(fileName: string): boolean {
    return this.documentService.isVideo(fileName);
  }

  // Vérifie si un document est un PDF
  isDocumentPdf(fileName: string): boolean {
    const extension = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
    return extension === 'pdf';
  }
}