import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Imports Ng-Zorro
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';

// Services
import { PayementsService, ApiPaiement, PaiementsResponse, PaiementsFilters } from 'src/app/core/services/payements.service';

// Interface pour grouper les paiements par utilisateur
interface GroupedPaymentsByUser {
  utilisateur: string;
  idUtilisateur: number;
  email: string;
  telephone: string;
  paiements: ApiPaiement[];
  souscriptions: Set<number>; // Liste des souscriptions de cet utilisateur
  totalPaye: number;
  totalPrevu: number;
  totalPenalites: number;
  nombrePaiements: number;
  nombreSouscriptions: number;
}

@Component({
  selector: 'app-new-payment-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCollapseModule,
    NzAvatarModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzCardModule,
    NzStatisticModule,
    NzIconModule,
    NzSpinModule
  ],
  templateUrl: './new-payment-admin.component.html',
  styleUrl: './new-payment-admin.component.css'
})
export class NewPaymentAdminComponent implements OnInit {
  
  // Données
  paiements: ApiPaiement[] = [];
  groupedPaymentsByUser: GroupedPaymentsByUser[] = [];
  loading = false;
  error: string | null = null;

  // Statistiques globales (depuis l'API)
  totalMensualites = 0;
  payeATemps = 0;
  enRetard = 0;
  enAttente = 0;
  montantTotalPaye = 0;
  totalPenalites = 0;

  constructor(private payementsService: PayementsService) {}

  ngOnInit(): void {
    this.loadAllPayments();
  }

  /**
   * Charger tous les paiements
   */
  loadAllPayments(): void {
    console.log('🔄 Chargement de tous les paiements...');
    this.loading = true;
    this.error = null;
  
    const filters: PaiementsFilters = {
      per_page: 1000 // Récupérer tous les paiements
    };
  
    this.payementsService.getMesPaiements(filters).subscribe({
      next: (response: PaiementsResponse) => {
        console.log('📥 Réponse API paiements:', response);
        
        if (response.success) {
          this.paiements = response.data;
          this.updateStatsFromAPI(response.statistiques);
          this.groupPaymentsByUser();
          console.log('✅ Paiements chargés:', this.paiements.length);
          console.log('📊 Statistiques API:', response.statistiques);
        } else {
          this.error = response.message || 'Erreur lors du chargement des paiements';
          console.error('❌ Erreur API:', response.message);
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement:', error);
        this.error = 'Impossible de charger les paiements. Veuillez réessayer.';
        this.paiements = [];
        this.groupedPaymentsByUser = [];
      },
      complete: () => {
        this.loading = false;
        console.log('✅ Chargement terminé');
      }
    });
  }

  /**
   * Mettre à jour les statistiques depuis les données de l'API
   */
  private updateStatsFromAPI(statistiques: any): void {
    this.totalMensualites = statistiques.total_mensualites;
    this.payeATemps = statistiques.total_paye_a_temps;
    this.enRetard = statistiques.total_en_retard;
    this.enAttente = statistiques.total_en_attente;

    // Calculer montants depuis les données
    this.montantTotalPaye = this.paiements.reduce((sum, p) => 
      sum + this.payementsService.parseAmount(p.montant_paye), 0);
    
    this.totalPenalites = this.paiements.reduce((sum, p) => 
      sum + this.payementsService.parseAmount(p.penalite_appliquee), 0);

    console.log('📊 Statistiques mises à jour depuis l\'API:', {
      totalMensualites: this.totalMensualites,
      payeATemps: this.payeATemps,
      enRetard: this.enRetard,
      enAttente: this.enAttente,
      montantTotalPaye: this.montantTotalPaye,
      totalPenalites: this.totalPenalites
    });
  }

  /**
   * Grouper les paiements par utilisateur
   */
  private groupPaymentsByUser(): void {
    console.log('🔄 Groupement des paiements par utilisateur...');
    
    const groups = new Map<number, GroupedPaymentsByUser>();

    this.paiements.forEach(paiement => {
      const idUtilisateur = paiement.souscription.id_utilisateur;
      
      if (!groups.has(idUtilisateur)) {
        // Créer un nouveau groupe pour cet utilisateur avec les vraies données
        const utilisateur = paiement.souscription.utilisateur;
        const newGroup: GroupedPaymentsByUser = {
          utilisateur: utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : `Utilisateur ${idUtilisateur}`,
          idUtilisateur: idUtilisateur,
          email: utilisateur?.email || 'Email non disponible',
          telephone: utilisateur?.telephone || 'Téléphone non disponible',
          paiements: [],
          souscriptions: new Set<number>(),
          totalPaye: 0,
          totalPrevu: 0,
          totalPenalites: 0,
          nombrePaiements: 0,
          nombreSouscriptions: 0
        };
        groups.set(idUtilisateur, newGroup);
      }

      const group = groups.get(idUtilisateur)!;
      group.paiements.push(paiement);
      group.souscriptions.add(paiement.id_souscription);
      group.totalPaye += this.payementsService.parseAmount(paiement.montant_paye);
      group.totalPrevu += this.payementsService.parseAmount(paiement.montant_versement_prevu);
      group.totalPenalites += this.payementsService.parseAmount(paiement.penalite_appliquee);
      group.nombrePaiements = group.paiements.length;
      group.nombreSouscriptions = group.souscriptions.size;
    });

    this.groupedPaymentsByUser = Array.from(groups.values());
    console.log('✅ Paiements groupés par utilisateur:', this.groupedPaymentsByUser.length, 'utilisateurs');
  }

  /**
   * Méthodes utilitaires pour le template
   */
  
  // Getters pour les statistiques
  getTotalMensualites(): number {
    return this.totalMensualites;
  }

  getPayeATemps(): number {
    return this.payeATemps;
  }

  getEnRetard(): number {
    return this.enRetard;
  }

  getEnAttente(): number {
    return this.enAttente;
  }

  getMontantTotalPaye(): string {
    return this.payementsService.formatCurrency(this.montantTotalPaye);
  }

  getTotalPenalites(): string {
    return this.payementsService.formatCurrency(this.totalPenalites);
  }

  // Formatage des montants
  formatCurrency(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? 
      this.payementsService.parseAmount(amount) : amount;
    return this.payementsService.formatCurrency(numAmount);
  }

  // Formatage des dates
  formatDate(dateString: string): string {
    return this.payementsService.formatDate(dateString);
  }

  // Couleur du statut
  getStatusColor(status: string): string {
    return this.payementsService.getPaymentStatusColor(status);
  }

  // Label du statut
  getStatusLabel(status: string): string {
    return this.payementsService.getPaymentStatusLabel(status);
  }

  // Label du mode de paiement
  getPaymentModeLabel(mode: string): string {
    return this.payementsService.getPaymentModeLabel(mode);
  }

  // Obtenir le nom du terrain à partir de l'id_terrain  
  getTerrainName(paiement: ApiPaiement): string {
    return `Terrain ${paiement.souscription.id_terrain}`;
  }

  // Obtenir le nom complet de l'utilisateur
  getUserFullName(paiement: ApiPaiement): string {
    const utilisateur = paiement.souscription.utilisateur;
    if (utilisateur) {
      return `${utilisateur.prenom} ${utilisateur.nom}`;
    }
    return `Utilisateur ${paiement.souscription.id_utilisateur}`;
  }

  // Obtenir l'email de l'utilisateur
  getUserEmail(paiement: ApiPaiement): string {
    return paiement.souscription.utilisateur?.email || 'Email non disponible';
  }

  // Obtenir les initiales pour l'avatar depuis les vraies données
  getUserInitials(group: GroupedPaymentsByUser): string {
    const names = group.utilisateur.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return group.utilisateur.substring(0, 2).toUpperCase();
  }

  // Formater les montants en version courte (avec unités)
  formatCurrencyShort(amount: string | number): string {
    const numAmount = typeof amount === 'string' ? 
      this.payementsService.parseAmount(amount) : amount;
    
    if (numAmount >= 1000000) {
      return `${(numAmount / 1000000).toFixed(0)} M FCFA`;
    } else if (numAmount >= 1000) {
      return `${(numAmount / 1000).toFixed(0)} K FCFA`;
    }
    return `${numAmount.toLocaleString('fr-FR')} FCFA`;
  }

  // TrackBy pour optimiser les performances
  trackByUser(index: number, item: GroupedPaymentsByUser): number {
    return item.idUtilisateur;
  }

  trackByPayment(index: number, item: ApiPaiement): number {
    return item.id_plan_paiement;
  }

  // Actions
  refresh(): void {
    console.log('🔄 Actualisation des paiements...');
    this.loadAllPayments();
  }

  viewPaymentDetails(paiement: ApiPaiement): void {
    console.log('👁️ Voir détails paiement:', paiement);
    // Implémenter la navigation vers les détails
  }

  editPayment(paiement: ApiPaiement): void {
    console.log('✏️ Modifier paiement:', paiement);
    // Implémenter la modification
  }

  // Méthodes utilitaires pour le template
  parseFloat(value: string): number {
    return parseFloat(value);
  }

  hasPenalty(penaliteAmount: string): boolean {
    return parseFloat(penaliteAmount) > 0;
  }
}