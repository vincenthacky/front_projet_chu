import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzGridModule } from 'ng-zorro-antd/grid';

interface Recompense {
  id?: number;
  type: string;
  souscription: string;
  description: string;
  motif: string;
  valeur: string;
  periode_merite: string;
  statut: string;
  date_attribution: string;
  date_attribution_effective?: string;
}

@Component({
  selector: 'app-recompenses',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzTagModule, NzGridModule],
  templateUrl: './recompenses.component.html',
  styleUrls: ['./recompenses.component.css']
})
export class RecompensesComponent implements OnInit {
  recompenses: Recompense[] = [];
  totalRecompenses = 0;
  recompensesAttribuees = 0;
  recompensesEnAttente = 0;
  loading = true;
  
  // États d'animation
  cardStates: { [key: number]: string } = {};
  showStats = false;
  showCards = false;

  ngOnInit(): void {
    this.loadRecompenses();
    
    // Animation séquentielle d'apparition
    setTimeout(() => this.showStats = true, 300);
    setTimeout(() => this.showCards = true, 600);
  }

  loadRecompenses(): void {
    this.loading = true;
    
    // Simuler un appel API - remplacez par votre service réel
    setTimeout(() => {
      // Données d'exemple avec valeurs en FCFA
      this.recompenses = [
        {
          id: 1,
          type: "Bonus Performance",
          souscription: "Assurance Vie Premium",
          description: "Excellente performance de votre portefeuille d'investissement sur le trimestre",
          motif: "Rendement supérieur à 8% sur 3 mois",
          valeur: "1,640,000 FCFA",
          periode_merite: "Q1 2024",
          statut: "Attribuée",
          date_attribution: "2024-03-15",
          date_attribution_effective: "2024-03-20"
        },
        {
          id: 2,
          type: "Fidélité Client",
          souscription: "Multi-Risques Habitation",
          description: "Récompense pour 5 années de fidélité sans sinistre",
          motif: "Aucun sinistre déclaré depuis 5 ans",
          valeur: "328,000 FCFA",
          periode_merite: "2019-2024",
          statut: "En attente",
          date_attribution: "2024-01-10",
          date_attribution_effective: undefined
        },
        {
          id: 3,
          type: "Parrainage",
          souscription: "Assurance Auto",
          description: "Bonus pour avoir parrainé 3 nouveaux clients",
          motif: "Parrainage de nouveaux assurés",
          valeur: "196,800 FCFA",
          periode_merite: "2024",
          statut: "Attribuée",
          date_attribution: "2024-02-28",
          date_attribution_effective: "2024-03-05"
        },
        {
          id: 4,
          type: "Éco-Responsable",
          souscription: "Assurance Véhicule Électrique",
          description: "Récompense pour votre engagement écologique",
          motif: "Souscription véhicule électrique",
          valeur: "131,200 FCFA",
          periode_merite: "2024",
          statut: "En attente",
          date_attribution: "2024-03-01",
          date_attribution_effective: undefined
        }
      ];
      
      this.calculateStats();
      this.initializeCardStates();
      this.loading = false;
    }, 1000);

    // Vrai appel de service :
    // this.recompenseService.getRecompensesByUser().subscribe({
    //   next: (data) => {
    //     this.recompenses = data;
    //     this.calculateStats();
    //     this.initializeCardStates();
    //     this.loading = false;
    //   },
    //   error: (error) => {
    //     console.error('Erreur lors du chargement des récompenses:', error);
    //     this.loading = false;
    //   }
    // });
  }

  calculateStats(): void {
    this.totalRecompenses = this.recompenses.length;
    this.recompensesAttribuees = this.recompenses.filter(r => r.statut === 'Attribuée').length;
    this.recompensesEnAttente = this.recompenses.filter(r => r.statut === 'En attente').length;
  }

  initializeCardStates(): void {
    this.recompenses.forEach(reward => {
      if (reward.id) {
        this.cardStates[reward.id] = 'default';
      }
    });
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  getRewardIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Bonus Performance': 'fa-chart-line',
      'Fidélité Client': 'fa-heart',
      'Parrainage': 'fa-users',
      'Éco-Responsable': 'fa-leaf',
      'Prime Exceptionnelle': 'fa-star',
      'Objectif Atteint': 'fa-target',
      'Innovation': 'fa-lightbulb',
      'Sécurité': 'fa-shield-alt'
    };
    return icons[type] || 'fa-gift';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatValue(value: string): string {
    // Formatage de la valeur pour affichage (ajout d'espaces, symboles, etc.)
    return value;
  }

  // Gestion des événements de hover
  onCardHover(event: Event, rewardId?: number): void {
    if (rewardId && this.cardStates[rewardId]) {
      this.cardStates[rewardId] = 'hovered';
    }
    
    // Effet visuel supplémentaire
    const card = event.target as HTMLElement;
    const cardElement = card.closest('.reward-card') as HTMLElement;
    if (cardElement) {
      cardElement.style.transform = 'translateY(-5px) scale(1.01)';
    }
  }

  onCardLeave(event: Event, rewardId?: number): void {
    if (rewardId && this.cardStates[rewardId]) {
      this.cardStates[rewardId] = 'default';
    }
    
    // Retour à l'état normal
    const card = event.target as HTMLElement;
    const cardElement = card.closest('.reward-card') as HTMLElement;
    if (cardElement) {
      cardElement.style.transform = 'translateY(0) scale(1)';
    }
  }

  // Gestion du click sur une carte
  onCardClick(reward: Recompense): void {
    // Logique pour afficher plus de détails, naviguer, etc.
    console.log('Carte cliquée:', reward);
    
    // Exemple : ouvrir un modal avec plus de détails
    // this.openRewardDetails(reward);
  }

  // Filtrage et tri
  filterByStatus(status: string): void {
    // Logique pour filtrer les récompenses par statut
    console.log('Filtrage par statut:', status);
  }

  sortRewards(criteria: 'date' | 'value' | 'type'): void {
    switch (criteria) {
      case 'date':
        this.recompenses.sort((a, b) => 
          new Date(b.date_attribution).getTime() - new Date(a.date_attribution).getTime()
        );
        break;
      case 'value':
        this.recompenses.sort((a, b) => {
          // Extraction des valeurs numériques pour le tri (enlève FCFA et espaces)
          const valueA = parseFloat(a.valeur.replace(/[^\d,]/g, '').replace(',', '.'));
          const valueB = parseFloat(b.valeur.replace(/[^\d,]/g, '').replace(',', '.'));
          return valueB - valueA;
        });
        break;
      case 'type':
        this.recompenses.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }
  }

  // Responsive: gestion du scroll pour les effets de parallaxe
  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    const scrolled = window.pageYOffset;
    const cards = document.querySelectorAll('.reward-card');
    
    cards.forEach((card, index) => {
      const speed = 0.5 + (index % 3) * 0.1;
      const cardElement = card as HTMLElement;
      cardElement.style.transform = `translateY(${scrolled * speed * 0.02}px)`;
    });
  }

  // Méthodes utilitaires
  getTotalValue(): string {
    const total = this.recompenses.reduce((sum, reward) => {
      // Extraction de la valeur numérique (enlève FCFA et espaces)
      const value = parseFloat(reward.valeur.replace(/[^\d,]/g, '').replace(',', '.'));
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    // Formatage en FCFA
    return new Intl.NumberFormat('fr-FR').format(total) + ' FCFA';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Attribuée': '#4CAF50',
      'En attente': '#ff9800',
      'En cours': '#2196F3',
      'Annulée': '#f44336'
    };
    return colors[status] || '#757575';
  }

  // Animation de rechargement
  refreshRewards(): void {
    this.loading = true;
    this.showCards = false;
    
    setTimeout(() => {
      this.loadRecompenses();
      this.showCards = true;
    }, 300);
  }

  // Conversion EUR vers FCFA (taux approximatif: 1 EUR = 656 FCFA)
  convertEurToFcfa(eurAmount: number): string {
    const fcfaAmount = eurAmount * 656;
    return new Intl.NumberFormat('fr-FR').format(fcfaAmount) + ' FCFA';
  }

  // Formatage des montants en FCFA
  formatFcfaAmount(amount: string): string {
    // Si le montant contient déjà FCFA, le retourner tel quel
    if (amount.includes('FCFA')) {
      return amount;
    }
    
    // Sinon, extraire le nombre et ajouter FCFA
    const numericValue = parseFloat(amount.replace(/[^\d,]/g, '').replace(',', '.'));
    if (!isNaN(numericValue)) {
      return new Intl.NumberFormat('fr-FR').format(numericValue) + ' FCFA';
    }
    
    return amount;
  }
}