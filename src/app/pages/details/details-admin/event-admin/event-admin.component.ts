import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageService } from 'ng-zorro-antd/message';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EvenementOrganise, ApiEvenement, TypeEvenement } from 'src/app/core/models/evenements';
import { EvenementsService } from 'src/app/core/services/evenements.service';
import { DocumentService } from 'src/app/core/services/documents.service';

declare const pdfjsLib: any;

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
  refreshing: boolean = false;
  paginationLoading: boolean = false;
  
  currentPage: number = 1;
  pageSize: number = 3;
  
  isImageModalVisible: boolean = false;
  selectedImageUrl: string = '';
  selectedImageTitle: string = '';
  
  isPdfModalVisible: boolean = false;
  selectedPdfUrl: string = '';
  selectedPdfTitle: string = '';
  
  pdfLoading: boolean = false;
  pdfError: boolean = false;
  pdfErrorMessage: string = '';
  pdfDoc: any = null;
  currentPdfPage: number = 1;
  totalPages: number = 0;
  
  selectedStatut: string = '';
  searchQuery: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private evenementsService: EvenementsService,
    private documentService: DocumentService,
    private router: Router,
    private http: HttpClient,
    private message: NzMessageService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.chargerMesEvenements();
    this.loadPdfJs();
  }

  ngAfterViewInit(): void {
  }

  getTotalEvenements(): number {
    return this.evenementsSouscription.length;
  }

  getEvenementsPlanifies(): number {
    return this.evenementsSouscription.filter(event => this.getEventStatus(event) === 'Planifié').length;
  }

  getEvenementsEnCours(): number {
    return this.evenementsSouscription.filter(event => this.getEventStatus(event) === 'En cours').length;
  }

  getEvenementsTermines(): number {
    return this.evenementsSouscription.filter(event => this.getEventStatus(event) === 'Terminé').length;
  }

  actualiserDonnees(): void {
    if (this.refreshing) return;
    this.refreshing = true;

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
          this.message.success('Données actualisées avec succès !', { nzDuration: 3000 });
        } else {
          this.message.error('Erreur lors de l\'actualisation', { nzDuration: 3000 });
        }
        this.refreshing = false;
      },
      error: (err) => {
        console.error('Erreur actualisation:', err);
        this.message.error('Erreur lors de l\'actualisation des données', { nzDuration: 3000 });
        this.refreshing = false;
      }
    });
  }

  private loadPdfJs(): void {
    if (!this.isBrowser) return;
    if (typeof pdfjsLib !== 'undefined') {
      this.initPdfJs();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => this.initPdfJs();
    script.onerror = () => console.error('Erreur chargement PDF.js');
    document.head.appendChild(script);
  }

  private initPdfJs(): void {
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  navigateToCreateEvent(): void {
    this.router.navigate(['/dashboard/admin/details/new-event-admin']);
  }

  getPaginatedEvents(): ApiEvenement[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.evenementsSouscription.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.paginationLoading = true;
    this.currentPage = page;
    setTimeout(() => {
      this.paginationLoading = false;
      if (this.isBrowser) {
        const timelineElement = document.querySelector('.timeline');
        if (timelineElement) {
          timelineElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 300);
  }

  onPageSizeChange(size: number): void {
    this.paginationLoading = true;
    this.pageSize = size;
    this.currentPage = 1;
    setTimeout(() => {
      this.paginationLoading = false;
    }, 300);
  }

  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.evenementsSouscription.length);
    return `${start}-${end} sur ${this.evenementsSouscription.length}`;
  }

  getEventImages(event: ApiEvenement): DocumentWithType[] {
    if (!event.documents || event.documents.length === 0) return [];
    return event.documents.filter((doc: any) => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isImageByExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension);
      const isImageByMime = doc.type_mime?.startsWith('image/') || false;
      const isImageByType = doc.type_document === 'photo' || doc.type_document === 'image';
      return isImageByExtension || isImageByMime || isImageByType;
    });
  }

  getEventPdfs(event: ApiEvenement): DocumentWithType[] {
    if (!event.documents || event.documents.length === 0) return [];
    return event.documents.filter((doc: any) => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isPdfByExtension = extension === 'pdf';
      const isPdfByMime = doc.type_mime === 'application/pdf';
      const isPdfByType = doc.type_document === 'pdf';
      return isPdfByExtension || isPdfByMime || isPdfByType;
    });
  }

  getDocumentUrl(doc: DocumentWithType): string {
    if (!doc || (!doc.chemin_fichier && !doc.url_document)) {
      return this.documentService.getImagePlaceholder();
    }
    const path = doc.url_document || doc.chemin_fichier;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return this.documentService.getDocumentUrl(path);
  }

  hasDocuments(event: ApiEvenement): boolean {
    return event.documents && event.documents.length > 0;
  }

  openImageModal(imageUrl: string, eventTitle: string): void {
    if (!imageUrl || imageUrl === this.documentService.getImagePlaceholder()) return;
    this.selectedImageUrl = imageUrl;
    this.selectedImageTitle = eventTitle || 'Image de l\'événement';
    this.isImageModalVisible = true;
  }
  
  closeImageModal(): void {
    this.isImageModalVisible = false;
    this.selectedImageUrl = '';
    this.selectedImageTitle = '';
  }

  openPdfModal(pdfUrl: string, pdfTitle: string): void {
    if (!pdfUrl) return;
    this.selectedPdfUrl = pdfUrl;
    this.selectedPdfTitle = pdfTitle || 'Document PDF';
    this.isPdfModalVisible = true;
    this.resetPdfState();
    setTimeout(() => this.loadPdf(pdfUrl), 100);
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

  private async loadPdf(url: string): Promise<void> {
    if (!this.isBrowser || typeof pdfjsLib === 'undefined') {
      this.showPdfError('PDF.js non disponible');
      return;
    }
    this.pdfLoading = true;
    this.pdfError = false;
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPdfPage = 1;
      await this.renderPdfPage(1);
      this.pdfLoading = false;
    } catch (error) {
      this.showPdfError('Impossible de charger le document PDF');
    }
  }

  private async renderPdfPage(pageNumber: number): Promise<void> {
    if (!this.pdfDoc || !this.pdfCanvas) return;
    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d');
      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const scale = Math.min(containerWidth / viewport.width, 1.5);
      const scaledViewport = page.getViewport({ scale });
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
    } catch (error) {
      this.showPdfError('Erreur lors de l\'affichage de la page');
    }
  }

  private showPdfError(message: string): void {
    this.pdfLoading = false;
    this.pdfError = true;
    this.pdfErrorMessage = message;
  }

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

  openPdfInNewTab(pdfUrl: string): void {
    if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  }

  openImageInNewTab(imageUrl: string): void {
    if (imageUrl) window.open(imageUrl, '_blank', 'noopener,noreferrer');
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = this.documentService.getImagePlaceholder();
      imgElement.alt = 'Image non disponible';
    }
  }

  onImageLoad(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) imgElement.style.opacity = '1';
  }

  getEventIcon(typeEvenement: TypeEvenement): string {
    if (typeEvenement.icone_type) return typeEvenement.icone_type.replace('fas ', '');
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
    if (avancement === 100) return 'bg-green';
    if (typeEvenement.couleur_affichage) return `bg-custom`;
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

  getEventStatus(event: ApiEvenement): string {
    const now = new Date();
    const dateDebut = new Date(event.date_debut_evenement);
    const dateFin = new Date(event.date_fin_evenement);
    
    // Comparaison par date uniquement (sans les heures)
    now.setHours(0, 0, 0, 0);
    dateDebut.setHours(0, 0, 0, 0);
    dateFin.setHours(0, 0, 0, 0);
    
    if (now < dateDebut) return 'Planifié';
    else if (now >= dateDebut && now <= dateFin) return 'En cours';
    else return 'Terminé';
  }

  getEventProgress(event: ApiEvenement): number {
    const status = this.getEventStatus(event);
    switch (status) {
      case 'Planifié': return 0;
      case 'En cours': return 50;
      case 'Terminé': return 100;
      default: return 0;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Planifié': return '#6b7280';
      case 'En cours': return '#3b82f6';
      case 'Terminé': return '#10b981';
      default: return '#6b7280';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Planifié': return 'status-planifie';
      case 'En cours': return 'status-en-cours';
      case 'Terminé': return 'status-termine';
      default: return 'status-planifie';
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
      case 'Planifié': return 'linear-gradient(135deg, #9ca3af, #6b7280)';
      case 'En cours': return 'linear-gradient(135deg, #3b82f6, #1e40af)';
      case 'Terminé': return 'linear-gradient(135deg, #10b981, #059669)';
      default: return 'linear-gradient(135deg, #9ca3af, #6b7280)';
    }
  }

  onEventClick(event: ApiEvenement): void {
    console.log('Événement cliqué:', event);
  }

  private animateProgressBars(): void {
    if (!this.isBrowser) return;
    setTimeout(() => {
      const progressBars = document.querySelectorAll('.progress-fill');
      progressBars.forEach((bar, index) => {
        setTimeout(() => {
          const element = bar as HTMLElement;
          const width = element.style.width;
          element.style.width = '0%';
          setTimeout(() => element.style.width = width, 100);
        }, index * 200);
      });
    }, 500);
  }

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
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement:', err);
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
  }

  estEvenementPersonnel(event: ApiEvenement): boolean {
    return event.souscription !== null && 
           (event.type_evenement.categorie_type === 'travaux_terrain' || 
            event.type_evenement.categorie_type === 'personnel');
  }

  onFilterChange(): void {
    this.chargerMesEvenements();
  }

  onSearch(): void {
    this.chargerMesEvenements();
  }

  voirDocuments(event: ApiEvenement): void {
    console.log('Voir documents:', event);
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