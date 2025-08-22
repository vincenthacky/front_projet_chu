import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

interface Evenement {
  titre: string;
  description: string;
  date_debut: string;
  date_fin: string;
  lieu: string;
  etape: string;
  avancement: number;
  type: string;
  photos?: string[];
}

@Component({
  selector: 'app-evenements',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTagModule, NzProgressModule, NzGridModule],
  templateUrl: './evenements.component.html',
  styleUrls: ['./evenements.component.css']
})
export class EvenementsComponent implements OnInit {
  isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  evenementsSouscription: Evenement[] = [
    {
      titre: 'Début des travaux',
      description: 'Les travaux de viabilisation de votre terrain ont commencé. L\'équipe technique procède aux raccordements et à l\'aménagement des voies d\'accès selon le planning établi.',
      date_debut: '2025-06-01',
      date_fin: '2025-07-15',
      lieu: 'Parcelle A-045',
      etape: 'Viabilisation',
      avancement: 40,
      type: 'Travaux',
      photos: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=100&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=150&h=100&fit=crop'
      ]
    },
    {
      titre: 'Attribution officielle',
      description: 'Félicitations ! Votre terrain a été officiellement attribué lors de la cérémonie d\'attribution. Vous êtes maintenant propriétaire de la parcelle A-045 dans le projet Cité des Agents.',
      date_debut: '2025-07-20',
      date_fin: '2025-07-20',
      lieu: 'CHU Angré',
      etape: 'Attribution',
      avancement: 100,
      type: 'Cérémonie',
      photos: [
        'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=150&h=100&fit=crop',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=100&fit=crop'
      ]
    }
  ];

  evenementsGlobaux: Evenement[] = [
    {
      titre: 'Inauguration officielle',
      description: 'Le projet Cité des Agents a été officiellement lancé en présence des autorités locales et des futurs propriétaires. Cette cérémonie marque le début d\'une nouvelle ère pour l\'habitat des agents de santé.',
      date_debut: '2025-05-01',
      date_fin: '2025-05-01',
      lieu: 'CHU Angré',
      etape: 'Inauguration',
      avancement: 100,
      type: 'Annonce',
      photos: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=150&h=100&fit=crop',
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=150&h=100&fit=crop',
        'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=150&h=100&fit=crop'
      ]
    }
  ];

  ngOnInit(): void {
    this.animateProgressBars();
  }

  // Obtenir l'icône selon le type d'événement
  getEventIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Travaux': 'fa-hard-hat',
      'Cérémonie': 'fa-certificate',
      'Annonce': 'fa-flag',
      'Attribution': 'fa-certificate',
      'Inauguration': 'fa-flag'
    };
    return icons[type] || 'fa-calendar';
  }

  // Obtenir la couleur selon le type et l'avancement
  getEventColor(type: string, avancement: number): string {
    if (avancement === 100) {
      return 'bg-green';
    }
    
    const colors: { [key: string]: string } = {
      'Travaux': 'bg-blue',
      'Cérémonie': 'bg-green',
      'Annonce': 'bg-purple',
      'Attribution': 'bg-green',
      'Inauguration': 'bg-purple'
    };
    return colors[type] || 'bg-blue';
  }

  // Obtenir le statut selon l'avancement
  getEventStatus(avancement: number): string {
    if (avancement === 100) {
      return 'Terminé';
    } else if (avancement > 0) {
      return 'En cours';
    } else {
      return 'À venir';
    }
  }

  // Obtenir le label de progression
  getProgressLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'Travaux': 'Avancement des travaux',
      'Cérémonie': 'Processus d\'attribution',
      'Annonce': 'Projet global',
      'Attribution': 'Processus d\'attribution',
      'Inauguration': 'Projet global'
    };
    return labels[type] || 'Progression';
  }

  // Obtenir le dégradé de couleur pour la barre de progression
  getProgressGradient(avancement: number): string {
    if (avancement === 100) {
      return 'linear-gradient(135deg, #10b981, #059669)';
    } else if (avancement >= 50) {
      return 'linear-gradient(135deg, #3b82f6, #1e40af)';
    } else {
      return 'linear-gradient(135deg, #f59e0b, #d97706)';
    }
  }

  // Gestionnaires d'événements
  onEventClick(event: Evenement): void {
    console.log('Événement cliqué:', event);
    // Logique pour afficher plus de détails
  }

  viewDetails(event: Evenement): void {
    console.log('Voir détails:', event);
    // Naviguer vers une page de détails ou ouvrir un modal
  }

  // Méthode viewPhotos supprimée car le bouton n'existe plus

  downloadDocument(event: Evenement): void {
    console.log('Télécharger document:', event);
    // Logique pour télécharger l'acte ou document
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

  isEventCompleted(event: Evenement): boolean {
    return event.avancement === 100;
  }

  isEventInProgress(event: Evenement): boolean {
    return event.avancement > 0 && event.avancement < 100;
  }

  getEventDuration(event: Evenement): number {
    const start = new Date(event.date_debut);
    const end = new Date(event.date_fin);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Filtrage et tri
  filterEventsByStatus(status: 'completed' | 'in-progress' | 'upcoming'): Evenement[] {
    return this.evenementsSouscription.filter(event => {
      switch (status) {
        case 'completed':
          return event.avancement === 100;
        case 'in-progress':
          return event.avancement > 0 && event.avancement < 100;
        case 'upcoming':
          return event.avancement === 0;
        default:
          return true;
      }
    });
  }

  sortEventsByDate(): void {
    this.evenementsSouscription.sort((a, b) => 
      new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
    );
    this.evenementsGlobaux.sort((a, b) => 
      new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
    );
  }
}