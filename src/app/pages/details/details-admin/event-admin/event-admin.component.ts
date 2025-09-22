import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzButtonModule } from 'ng-zorro-antd/button';
// MODULES POUR LES MODALS
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EvenementOrganise, ApiEvenement, TypeEvenement } from 'src/app/core/models/evenements';
import { EvenementsService } from 'src/app/core/services/evenements.service';
import { DocumentService } from 'src/app/core/services/documents.service';

// Déclaration pour PDF.js
declare const pdfjsLib: any;

// INTERFACE POUR DOCUMENTS
interface DocumentWithType {
  id_document: number;
  nom_original: string;
  chemin_fichier: string;
  type_mime: string | null;
  taille_fichier: number;
  description_document: string;
  type_document?: string;
  mime_type?: string;
  extension?: string;
  url_document?: string;
}

@Component({
  selector: 'app-event-admin',
  standalone: true,
  imports: [
    CommonModule, 
    NzCardModule, 
    NzTagModule, 
    NzProgressModule, 
    NzGridModule, 
    NzPaginationModule, 
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule
  ],
  templateUrl: './event-admin.component.html',
  styleUrl: './event-admin.component.css'
})
export class EventAdminComponent implements OnInit, AfterViewInit {
  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;
  
  isBrowser: boolean;

  evenementsOrganises: EvenementOrganise[] = [];
  evenementsSouscription: ApiEvenement[] = [];
  evenementsGlobaux: ApiEvenement[] = [];
  statistiques: any = null;
  loading: boolean = false;
  
  // Propriétés de pagination
  currentPage: number = 1;
  pageSize: number = 3;
  
  // PROPRIÉTÉS POUR LES MODALS
  isImageModalVisible: boolean = false;
  selectedImageUrl: string = '';
  selectedImageTitle: string = '';
  
  isPdfModalVisible: boolean = false;
  selectedPdfUrl: string = '';
  selectedPdfTitle: string = '';
  
  // NOUVELLES PROPRIÉTÉS POUR LE VISUALISEUR PDF
  pdfLoading: boolean = false;
  pdfError: boolean = false;
  pdfErrorMessage: string = '';
  pdfDoc: any = null;
  currentPdfPage: number = 1;
  totalPages: number = 0;
  
  // Filtres
  selectedStatut: string = '';
  searchQuery: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private evenementsService: EvenementsService,
    private documentService: DocumentService,
    private router: Router,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.chargerMesEvenements();
    this.loadPdfJs();
  }

  ngAfterViewInit(): void {
    // Méthode appelée après l'initialisation de la vue
  }

  // CHARGEMENT DE PDF.JS
  private loadPdfJs(): void {
    if (!this.isBrowser) return;

    // Vérifier si PDF.js est déjà chargé
    if (typeof pdfjsLib !== 'undefined') {
      this.initPdfJs();
      return;
    }

    // Charger PDF.js depuis CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      this.initPdfJs();
    };
    script.onerror = () => {
      console.error('Erreur lors du chargement de PDF.js');
    };
    document.head.appendChild(script);
  }

  private initPdfJs(): void {
    if (typeof pdfjsLib !== 'undefined') {
      // Configuration du worker PDF.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      console.log('PDF.js initialisé avec succès');
    }
  }

  // Navigation vers le formulaire de création d'événement
  navigateToCreateEvent(): void {
    this.router.navigate(['/dashboard/admin/details/new-event-admin']);
  }

  // MÉTHODES DE PAGINATION
  getPaginatedEvents(): ApiEvenement[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.evenementsSouscription.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.evenementsSouscription.length);
    return `${start}-${end} sur ${this.evenementsSouscription.length}`;
  }

  // MÉTHODES POUR LA GESTION DES DOCUMENTS - CORRIGÉES
  
  getEventImages(event: ApiEvenement): DocumentWithType[] {
    if (!event.documents || event.documents.length === 0) {
      return [];
    }
    
    return event.documents.filter((doc: any) => {
      // Vérifier par extension
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isImageByExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension);
      
      // Vérifier par type MIME
      const isImageByMime = doc.type_mime?.startsWith('image/') || false;
      
      // Vérifier par type_document
      const isImageByType = doc.type_document === 'photo' || doc.type_document === 'image';
      
      return isImageByExtension || isImageByMime || isImageByType;
    });
  }

  getEventPdfs(event: ApiEvenement): DocumentWithType[] {
    if (!event.documents || event.documents.length === 0) {
      return [];
    }
    
    return event.documents.filter((doc: any) => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isPdfByExtension = extension === 'pdf';
      const isPdfByMime = doc.type_mime === 'application/pdf';
      const isPdfByType = doc.type_document === 'pdf';
      
      return isPdfByExtension || isPdfByMime || isPdfByType;
    });
  }

  // MÉTHODE CORRIGÉE POUR GÉNÉRER L'URL DES DOCUMENTS
  getDocumentUrl(doc: DocumentWithType): string {
    if (!doc || (!doc.chemin_fichier && !doc.url_document)) {
      return this.documentService.getImagePlaceholder();
    }
    
    // Utiliser url_document en priorité, sinon chemin_fichier
    const path = doc.url_document || doc.chemin_fichier;
    
    // Si l'URL est déjà complète, la retourner directement
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Sinon, construire l'URL avec le service
    return this.documentService.getDocumentUrl(path);
  }

  hasDocuments(event: ApiEvenement): boolean {
    return event.documents && event.documents.length > 0;
  }

  // MÉTHODES POUR LES MODALS - CORRIGÉES

  openImageModal(imageUrl: string, eventTitle: string): void {
    // Vérifier que l'URL est valide
    if (!imageUrl || imageUrl === this.documentService.getImagePlaceholder()) {
      console.warn('URL d\'image invalide:', imageUrl);
      return;
    }
    
    this.selectedImageUrl = imageUrl;
    this.selectedImageTitle = eventTitle || 'Image de l\'événement';
    this.isImageModalVisible = true;
    
    console.log('Ouverture modal image:', { url: imageUrl, title: eventTitle });
  }
  
  closeImageModal(): void {
    this.isImageModalVisible = false;
    this.selectedImageUrl = '';
    this.selectedImageTitle = '';
  }

  // NOUVELLES MÉTHODES POUR LE PDF AVEC PDF.JS
  openPdfModal(pdfUrl: string, pdfTitle: string): void {
    if (!pdfUrl) {
      console.warn('URL de PDF invalide:', pdfUrl);
      return;
    }
    
    this.selectedPdfUrl = pdfUrl;
    this.selectedPdfTitle = pdfTitle || 'Document PDF';
    this.isPdfModalVisible = true;
    this.resetPdfState();
    
    // Charger le PDF après un petit délai pour s'assurer que le modal est ouvert
    setTimeout(() => {
      this.loadPdf(pdfUrl);
    }, 100);
    
    console.log('Ouverture modal PDF:', { url: pdfUrl, title: pdfTitle });
  }
  
 closePdfModal(): void {
    this.isPdfModalVisible = false;
    this.selectedPdfUrl = '';
    this.selectedPdfTitle = '';
  }

  private resetPdfState(): void {
    this.pdfLoading = false;
    this.pdfError = false;
    this.pdfErrorMessage = '';
    this.pdfDoc = null;
    this.currentPdfPage = 1;
    this.totalPages = 0;
  }

  // CHARGEMENT ET RENDU PDF AVEC PDF.JS
  private async loadPdf(url: string): Promise<void> {
    if (!this.isBrowser || typeof pdfjsLib === 'undefined') {
      this.showPdfError('PDF.js non disponible');
      return;
    }

    this.pdfLoading = true;
    this.pdfError = false;

    try {
      console.log('Chargement PDF:', url);
      
      // Charger le PDF
      const loadingTask = pdfjsLib.getDocument(url);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPdfPage = 1;
      
      console.log('PDF chargé:', { totalPages: this.totalPages });
      
      // Rendre la première page
      await this.renderPdfPage(1);
      
      this.pdfLoading = false;
    } catch (error) {
      console.error('Erreur lors du chargement du PDF:', error);
      this.showPdfError('Impossible de charger le document PDF');
    }
  }

  private async renderPdfPage(pageNumber: number): Promise<void> {
    if (!this.pdfDoc || !this.pdfCanvas) {
      return;
    }

    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d');

      // Calculer la taille d'affichage
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const scale = Math.min(containerWidth / viewport.width, 1.5);
      const scaledViewport = page.getViewport({ scale });

      // Configurer le canvas
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Rendre la page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };

      await page.render(renderContext).promise;
      console.log('Page PDF rendue:', pageNumber);
    } catch (error) {
      console.error('Erreur lors du rendu de la page PDF:', error);
      this.showPdfError('Erreur lors de l\'affichage de la page');
    }
  }

  private showPdfError(message: string): void {
    this.pdfLoading = false;
    this.pdfError = true;
    this.pdfErrorMessage = message;
  }

  // NAVIGATION DANS LE PDF
  async nextPage(): Promise<void> {
    if (this.currentPdfPage < this.totalPages) {
      this.currentPdfPage++;
      await this.renderPdfPage(this.currentPdfPage);
    }
  }

  async previousPage(): Promise<void> {
    if (this.currentPdfPage > 1) {
      this.currentPdfPage--;
      await this.renderPdfPage(this.currentPdfPage);
    }
  }

  // MÉTHODES POUR OUVRIR DANS NOUVEAUX ONGLETS
  openPdfInNewTab(pdfUrl: string): void {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  }

  openImageInNewTab(imageUrl: string): void {
    if (imageUrl) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    }
  }

  // GESTION D'ERREURS AMÉLIORÉE
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      console.warn('Erreur de chargement d\'image:', imgElement.src);
      imgElement.src = this.documentService.getImagePlaceholder();
      imgElement.alt = 'Image non disponible';
    }
  }

  onImageModalError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      console.error('Erreur de chargement d\'image dans le modal:', imgElement.src);
      imgElement.src = this.documentService.getImagePlaceholder();
      imgElement.alt = 'Image non disponible';
    }
  }

  onImageLoad(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      console.log('Image chargée avec succès:', imgElement.src);
      imgElement.style.opacity = '1';
    }
  }
  
  onVideoError(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    if (videoElement) {
      videoElement.style.display = 'none';
      
      const errorMsg = document.createElement('div');
      errorMsg.className = 'video-error-message';
      errorMsg.textContent = 'Vidéo non disponible';
      errorMsg.style.cssText = 'color: #ef4444; font-size: 0.875rem; padding: 0.5rem; text-align: center;';
      
      if (videoElement.parentNode) {
        videoElement.parentNode.insertBefore(errorMsg, videoElement.nextSibling);
      }
    }
  }

  // MÉTHODES POUR LES ÉVÉNEMENTS

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

  getTypeClass(typeLibelle: string): string {
    return 'type-' + typeLibelle.toLowerCase().replace(/\s+/g, '-');
  }

  // LOGIQUE DE STATUT BASÉE SUR LA DATE
  getEventStatus(event: ApiEvenement): string {
    const now = new Date();
    const dateDebut = new Date(event.date_debut_evenement);
    const dateFin = new Date(event.date_fin_evenement);

    if (now < dateDebut) {
      return 'À venir';
    } else if (now >= dateDebut && now <= dateFin) {
      return 'En cours';
    } else {
      return 'Terminé';
    }
  }

  getEventProgress(event: ApiEvenement): number {
    const status = this.getEventStatus(event);
    
    switch (status) {
      case 'À venir':
        return 0;
      case 'En cours':
        return 50;
      case 'Terminé':
        return 100;
      default:
        return event.niveau_avancement_pourcentage || 0;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'À venir':
        return '#6b7280';
      case 'En cours':
        return '#3b82f6';
      case 'Terminé':
        return '#10b981';
      default:
        return '#6b7280';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'À venir':
        return 'status-upcoming';
      case 'En cours':
        return 'status-in-progress';
      case 'Terminé':
        return 'status-completed';
      default:
        return 'status-default';
    }
  }

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

  getProgressGradient(event: ApiEvenement): string {
    const status = this.getEventStatus(event);
    
    switch (status) {
      case 'À venir':
        return 'linear-gradient(135deg, #6b7280, #4b5563)';
      case 'En cours':
        return 'linear-gradient(135deg, #3b82f6, #1e40af)';
      case 'Terminé':
        return 'linear-gradient(135deg, #10b981, #059669)';
      default:
        return 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
  }

  // GESTIONNAIRES D'ÉVÉNEMENTS
  onEventClick(event: ApiEvenement): void {
    console.log('Événement cliqué:', event);
    // Logique pour afficher plus de détails
  }

  // Animation des barres de progression
  private animateProgressBars(): void {
    if (!this.isBrowser) return;
    
    setTimeout(() => {
      const progressBars = document.querySelectorAll('.progress-fill');
      progressBars.forEach((bar, index) => {
        setTimeout(() => {
          const element = bar as HTMLElement;
          const width = element.style.width;
          element.style.width = '0%';
          setTimeout(() => {
            element.style.width = width;
          }, 100);
        }, index * 200);
      });
    }, 500);
  }

  // MÉTHODES UTILITAIRES
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getDateRangeLabel(events: ApiEvenement[]): string {
    if (!events || events.length === 0) return '';
    
    // Ne pas trier, utiliser les événements dans leur ordre d'origine
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    
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

  // MÉTHODES DE CHARGEMENT ET CONVERSION DES DONNÉES
  chargerMesEvenements(): void {
    this.loading = true;
    const filters = {
      per_page: 50,
      ...(this.selectedStatut && { statut: this.selectedStatut }),
      ...(this.searchQuery && { search: this.searchQuery })
    };

    this.evenementsService.getMesEvenements(filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.evenementsOrganises = response.data.evenements_organises;
          this.statistiques = response.data.statistiques;
          this.convertirDonneesApi();
          this.currentPage = 1;
          this.animateProgressBars();
          console.log('Événements chargés:', this.evenementsOrganises);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des événements:', err);
        this.loading = false;
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
    
    // Ne pas trier, conserver l'ordre de l'API
    // this.sortEventsByDate(); <- LIGNE SUPPRIMÉE
  }

  estEvenementPersonnel(event: ApiEvenement): boolean {
    return event.souscription !== null && 
           (event.type_evenement.categorie_type === 'travaux_terrain' || 
            event.type_evenement.categorie_type === 'personnel');
  }

  // MÉTHODE SUPPRIMÉE - Ne plus trier les événements
  // sortEventsByDate(): void {
  //   this.evenementsSouscription.sort((a, b) => 
  //     new Date(b.date_debut_evenement).getTime() - new Date(a.date_debut_evenement).getTime()
  //   );
  //   this.evenementsGlobaux.sort((a, b) => 
  //     new Date(b.date_debut_evenement).getTime() - new Date(a.date_debut_evenement).getTime()
  //   );
  // }

  // MÉTHODES DE FILTRAGE
  onFilterChange(): void {
    this.chargerMesEvenements();
  }

  onSearch(): void {
    this.chargerMesEvenements();
  }

  // MÉTHODES UTILITAIRES DU SERVICE
  voirDocuments(event: ApiEvenement): void {
    console.log('Voir documents de l\'événement:', event);
  }

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
}