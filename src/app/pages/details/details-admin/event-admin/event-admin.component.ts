import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { ApiEvenement, EvenementOrganise, EvenementsService, TypeEvenement } from 'src/app/core/services/evenements.service';

@Component({
  selector: 'app-event-admin',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTagModule, NzProgressModule, NzGridModule, NzPaginationModule, NzButtonModule],
  templateUrl: './event-admin.component.html',
  styleUrl: './event-admin.component.css'
})
export class EventAdminComponent {
  isBrowser: boolean;

  evenementsOrganises: EvenementOrganise[] = [];
  evenementsSouscription: ApiEvenement[] = [];
  evenementsGlobaux: ApiEvenement[] = [];
  statistiques: any = null;
  loading: boolean = false;
  
  // Propriétés de pagination
  currentPage: number = 1;
  pageSize: number = 3;
  
  // Préfixe pour les images
  private readonly IMAGE_BASE_URL = 'http://192.168.252.75:8000/storage/documents/';
  
  // Méthode pour afficher les informations de pagination
  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.evenementsSouscription.length);
    return `${start}-${end} sur ${this.evenementsSouscription.length}`;
  }
  
  // Filtres
  selectedStatut: string = '';
  searchQuery: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private evenementsService: EvenementsService,
    private router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.chargerMesEvenements();
  }

  // Navigation vers le formulaire de création d'événement
  navigateToCreateEvent(): void {
    this.router.navigate(['/dashboard/admin/details/new-event-admin']);
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

  // Obtenir l'icône selon le type d'événement
  getEventIcon(typeEvenement: TypeEvenement): string {
    // Utiliser l'icône de l'API ou fallback selon le libellé
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
    
    // Utiliser la couleur de l'API ou fallback
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

  // NOUVELLE LOGIQUE DE STATUT BASÉE SUR LA DATE
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

  // NOUVEAU CALCUL DU POURCENTAGE BASÉ SUR LE STATUT
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
        return event.niveau_avancement_pourcentage;
    }
  }

  // NOUVELLE MÉTHODE POUR LES COULEURS DE STATUT
  getStatusColor(status: string): string {
    switch (status) {
      case 'À venir':
        return '#6b7280'; // Gris
      case 'En cours':
        return '#3b82f6'; // Bleu
      case 'Terminé':
        return '#10b981'; // Vert
      default:
        return '#6b7280';
    }
  }

  // NOUVELLE MÉTHODE POUR LES CLASSES CSS DE STATUT
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

  // Obtenir le dégradé de couleur pour la barre de progression
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

  // Gestionnaires d'événements
  onEventClick(event: ApiEvenement): void {
    console.log('Événement cliqué:', event);
    // Logique pour afficher plus de détails
  }

  openPhotoModal(photo: string): void {
    console.log('Ouvrir photo:', photo);
    // Ouvrir la photo en grand dans un modal
  }

  // MÉTHODE MODIFIÉE POUR OBTENIR LES PHOTOS AVEC LE BON PRÉFIXE
  getEventPhotos(event: ApiEvenement): string[] {
    if (!event.documents || event.documents.length === 0) {
      return [];
    }
    
    // Filtrer pour ne garder que les documents de type image
    return event.documents
      .filter(doc => doc.type_document === 'photo' || 
                     doc.mime_type?.startsWith('image/') ||
                     doc.extension?.match(/\.(jpg|jpeg|png|gif|webp)$/i))
      .map(doc => {
        let imagePath = doc.url_document || doc.chemin_fichier;
        // Ajouter le préfixe si pas déjà présent
        if (imagePath && !imagePath.startsWith('http')) {
          return this.IMAGE_BASE_URL + imagePath;
        }
        return imagePath;
      })
      .filter(url => url); // Enlever les URLs vides
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
    
    // Trier les événements par date
    const sortedEvents = events.sort((a, b) => 
      new Date(a.date_debut_evenement).getTime() - new Date(b.date_debut_evenement).getTime()
    );
    
    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    
    const firstDate = new Date(firstEvent.date_debut_evenement);
    const lastDate = new Date(lastEvent.date_debut_evenement);
    
    // Si c'est le même mois et année
    if (firstDate.getMonth() === lastDate.getMonth() && firstDate.getFullYear() === lastDate.getFullYear()) {
      return this.formatMonthYear(firstDate);
    }
    
    // Si c'est la même année mais mois différents
    if (firstDate.getFullYear() === lastDate.getFullYear()) {
      return `${this.formatMonthYear(firstDate)} - ${this.formatMonthYear(lastDate)}`;
    }
    
    // Années différentes
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
          // Réinitialiser la page à 1 après un rechargement
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
    // Réinitialiser les tableaux
    this.evenementsSouscription = [];
    this.evenementsGlobaux = [];
    
    // Parcourir tous les événements organisés
    this.evenementsOrganises.forEach(typeGroup => {
      typeGroup.mois.forEach(mois => {
        mois.evenements.forEach(apiEvent => {
          // Séparer selon le type ou d'autres critères
          if (this.estEvenementPersonnel(apiEvent)) {
            this.evenementsSouscription.push(apiEvent);
          } else {
            this.evenementsGlobaux.push(apiEvent);
          }
        });
      });
    });
    
    // Trier par date
    this.sortEventsByDate();
  }

  estEvenementPersonnel(event: ApiEvenement): boolean {
    // Logique pour déterminer si c'est un événement personnel
    // Basé sur le type d'événement ou d'autres critères
    return event.souscription !== null && 
           (event.type_evenement.categorie_type === 'travaux_terrain' || 
            event.type_evenement.categorie_type === 'personnel');
  }

  // Filtrage et tri
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
    // Afficher les documents liés à l'événement
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
    if (percentage < 25) return '#dc3545'; // Rouge
    if (percentage < 50) return '#fd7e14'; // Orange
    if (percentage < 75) return '#ffc107'; // Jaune
    return '#28a745'; // Vert
  }
}