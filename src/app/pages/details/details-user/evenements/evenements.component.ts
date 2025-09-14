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
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { ApiEvenement, EvenementOrganise, EvenementsService, TypeEvenement } from 'src/app/core/services/evenements.service';
import { DocumentService, ApiDocument } from 'src/app/core/services/documents.service';

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
    NzIconModule
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
  
  // Propriétés de pagination
  currentPage: number = 1;
  pageSize: number = 3;
  
  // Modal pour agrandir une image
  isImageModalVisible: boolean = false;
  selectedImageUrl: string = '';
  selectedImageTitle: string = '';
  
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

  // NOUVELLE MÉTHODE: Gestion dynamique du statut basé sur les dates
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

  // NOUVELLES MÉTHODES POUR AFFICHAGE DIRECT DES MÉDIAS
  
  // Récupère les images d'un événement
  getEventImages(event: ApiEvenement): any[] {
    if (!event.documents || event.documents.length === 0) {
      return [];
    }
    
    return event.documents.filter((doc: any) => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
    });
  }
  
  // Récupère les vidéos d'un événement
  getEventVideos(event: ApiEvenement): any[] {
    if (!event.documents || event.documents.length === 0) {
      return [];
    }
    
    return event.documents.filter((doc: any) => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension);
    });
  }
  
  // Génère l'URL d'un document
  getDocumentUrl(doc: any): string {
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
  
  // Gestion d'erreur d'image avec typage strict
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement && imgElement.src) {
      imgElement.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2ExYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
      console.warn('Erreur de chargement d\'image, placeholder utilisé');
    }
  }
  
  // Gestion d'erreur vidéo
  onVideoError(event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    if (videoElement) {
      console.warn('Erreur de chargement vidéo:', videoElement.src);
      // Optionnel: masquer la vidéo en erreur
      videoElement.style.display = 'none';
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

  // MODIFIÉE: Utiliser le nouveau système de statut
  getEventStatus(avancement: number, event?: ApiEvenement): string {
    if (event) {
      return this.getEventStatusDynamic(event).status;
    }
    
    // Fallback vers l'ancien système
    if (avancement === 100) {
      return 'Terminé';
    } else if (avancement > 0) {
      return 'En cours';
    } else {
      return 'À venir';
    }
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

  // MODIFIÉE: Utiliser le nouveau système pour le dégradé
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

  // Gestionnaires d'événements
  onEventClick(event: ApiEvenement): void {
    console.log('Événement cliqué:', event);
    // Logique pour afficher plus de détails
  }

  openPhotoModal(photo: string): void {
    console.log('Ouvrir photo:', photo);
    // Ouvrir la photo en grand dans un modal
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
    console.log('Voir documents de l\'événement:', event);
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
}