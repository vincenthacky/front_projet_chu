import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Imports Ng-Zorro
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { ApiSouscription, SouscriptionFilters, SouscriptionService, SouscriptionResponse } from 'src/app/core/services/souscription.service';

// Interface pour les utilisateurs groupés
interface GroupedUser {
  id_utilisateur: number;
  fullName: string;
  email: string;
  initials: string;
  souscriptions: ApiSouscription[];
  totalAmount: number;
  totalInDelay: number;
}

@Component({
  selector: 'app-admin-souscription',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCollapseModule,
    NzAvatarModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule
  ],
  templateUrl: './admin-souscription.component.html',
  styleUrls: ['./admin-souscription.component.scss']
})
export class AdminSouscriptionComponent implements OnInit, OnDestroy {
  
  // Propriétés pour les données
  souscriptions: ApiSouscription[] = [];
  groupedUsers: GroupedUser[] = [];
  totalSouscriptions = 0;
  isLoading = false;
  error: string | null = null;

  // Propriétés pour la pagination
  currentPage = 1;
  perPage = 10;
  totalPages = 0;

  // Propriétés pour les filtres
  filters: SouscriptionFilters = {
    page: 1,
    per_page: 100 // Augmenté pour récupérer plus de données
  };

  // Variables pour les filtres du template
  searchTerm = '';
  statusFilter = '';
  surfaceFilter: number | '' = '';
  dateDebut: string = '';
  dateFin: string = '';

  // Propriété pour utiliser Math dans le template
  Math = Math;

  // Pour le debounce de recherche
  private searchTimeout: any;

  constructor(private souscriptionService: SouscriptionService) { }

  ngOnInit(): void {
    this.loadSouscriptions();
    
    // Test avec des données mockées après 2 secondes (optionnel maintenant)
    setTimeout(() => {
      this.testWithMockData();
    }, 2000);
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  /**
   * MÉTHODE CORRIGÉE POUR LE CHARGEMENT DES DONNÉES
   */
  loadSouscriptions(filters?: SouscriptionFilters): void {
    console.log('🔄 DÉBUT DU CHARGEMENT - Vérification des filtres API');
    this.isLoading = true;
    this.error = null;

    // DÉBOGAGE: Ajouter des paramètres pour forcer l'obtention de toutes les souscriptions
    const searchFilters = { 
      ...this.filters, 
      ...filters,
      // Essayez d'ajouter ces paramètres pour avoir toutes les souscriptions
      all_users: true,           // Si votre API supporte ce paramètre
      admin_view: true,          // Pour la vue admin
      per_page: 100             // Augmenter la limite pour être sûr d'avoir toutes les données
    };

    console.log('📤 Filtres envoyés à l\'API:', searchFilters);

    this.souscriptionService.getAllSouscriptions(searchFilters).subscribe({
      next: (response: SouscriptionResponse) => {
        console.log('📡 Réponse complète de l\'API:', response);
        
        if (response.success) {
          this.souscriptions = response.data;
          
          // DÉBOGAGE APPROFONDI
          console.log('🔍 ANALYSE DES DONNÉES REÇUES:');
          console.log('- Nombre total de souscriptions:', this.souscriptions.length);
          
          const userIds = this.souscriptions.map(s => s.id_utilisateur);
          const uniqueUserIds = [...new Set(userIds)];
          console.log('- IDs utilisateurs dans les données:', userIds);
          console.log('- IDs utilisateurs uniques:', uniqueUserIds);
          console.log('- Nombre d\'utilisateurs uniques:', uniqueUserIds.length);
          
          if (uniqueUserIds.length === 1) {
            console.warn('⚠️ ATTENTION: L\'API ne retourne que les souscriptions d\'un seul utilisateur!');
            console.warn('C\'est normal si cet utilisateur a toutes les souscriptions dans la BDD');
          }
          
          this.totalSouscriptions = response.pagination.total;
          this.currentPage = response.pagination.current_page;
          this.totalPages = response.pagination.last_page;
          
          this.groupSouscriptionsByUser();
          
        } else {
          console.error('❌ Erreur API:', response.message);
          this.error = response.message || 'Erreur lors du chargement des souscriptions';
        }
      },
      error: (error) => {
        console.error('🚨 Erreur lors du chargement:', error);
        this.error = 'Impossible de charger les souscriptions. Veuillez réessayer.';
        this.souscriptions = [];
        this.groupedUsers = [];
      },
      complete: () => {
        this.isLoading = false;
        console.log('✅ Chargement terminé. Utilisateurs finaux:', this.groupedUsers.length);
      }
    });
  }

  /**
   * SOLUTION DE TEST: Créer une méthode de test avec des données mockées
   */
  testWithMockData(): void {
    console.log('🧪 TEST AVEC DONNÉES SIMULÉES');
    
    if (this.souscriptions.length === 0) {
      console.log('Aucune souscription existante, impossible de créer des données de test');
      return;
    }
        
    const userIds = this.souscriptions.map(s => s.id_utilisateur);
    const uniqueUserIds = [...new Set(userIds)];
    console.log('- Nouveaux IDs utilisateurs uniques:', uniqueUserIds);
    
    // Regrouper avec les nouvelles données
    this.groupSouscriptionsByUser();
  }

  /**
   * MÉTHODE DE DÉBOGAGE AVANCÉ DE L'API
   */
  debugAPICall(): void {
    console.log('🔧 DÉBOGAGE AVANCÉ DE L\'API');
    
    // Test avec différents paramètres
    const testParams = [
      {},                                    // Sans paramètres
      { per_page: 100 },                    // Avec plus de résultats
      { all_users: true },                  // Si votre API supporte ce paramètre
      { admin_view: true, per_page: 100 },  // Vue admin avec plus de résultats
    ];
    
    testParams.forEach((params, index) => {
      console.log(`🧪 Test ${index + 1} avec paramètres:`, params);
      
      this.souscriptionService.getAllSouscriptions(params).subscribe({
        next: (response) => {
          const userIds = response.data.map((s: any) => s.id_utilisateur);
          const uniqueUserIds = [...new Set(userIds)];
          console.log(`✅ Test ${index + 1} - Utilisateurs uniques trouvés:`, uniqueUserIds);
          console.log(`📊 Test ${index + 1} - Nombre de souscriptions:`, response.data.length);
        },
        error: (error) => {
          console.error(`❌ Test ${index + 1} - Erreur:`, error);
        }
      });
    });
  }

  /**
   * MÉTHODE CORRIGÉE POUR GROUPER LES UTILISATEURS - AVEC PROPRIÉTÉ UTILISATEUR
   */
  private groupSouscriptionsByUser(): void {
    console.log('🔥 DÉBUT DU GROUPEMENT - Diagnostic complet');
    console.log('📊 Nombre de souscriptions reçues:', this.souscriptions.length);
    
    // Étape 1: Analyser toutes les souscriptions
    console.log('📋 ANALYSE DES SOUSCRIPTIONS:');
    this.souscriptions.forEach((souscription, index) => {
      console.log(`Souscription ${index + 1}:`, {
        id_souscription: souscription.id_souscription,
        id_utilisateur: souscription.id_utilisateur,
        id_admin: souscription.id_admin,
        utilisateur: souscription.utilisateur ? {
          nom: souscription.utilisateur.nom,
          prenom: souscription.utilisateur.prenom,
          email: souscription.utilisateur.email
        } : 'AUCUN UTILISATEUR',
        admin: souscription.admin ? {
          nom: souscription.admin.nom,
          prenom: souscription.admin.prenom,
          email: souscription.admin.email
        } : 'AUCUN ADMIN',
        montant: souscription.montant_total_souscrit
      });
    });

    // Étape 2: Identifier les utilisateurs uniques
    const idsUtilisateurs = this.souscriptions.map(s => s.id_utilisateur);
    const idsUniques = [...new Set(idsUtilisateurs)];
    console.log('🔍 IDs utilisateurs dans les souscriptions:', idsUtilisateurs);
    console.log('✨ IDs utilisateurs uniques:', idsUniques);
    console.log('📈 Nombre d\'utilisateurs uniques détectés:', idsUniques.length);

    if (idsUniques.length < 2) {
      console.warn('⚠️ ATTENTION: Moins de 2 utilisateurs uniques détectés!');
      console.warn('Vérifiez que vos données contiennent bien des id_utilisateur différents');
    }

    // Étape 3: Créer le groupement avec diagnostic
    const userMap = new Map<number, GroupedUser>();

    this.souscriptions.forEach((souscription, index) => {
      const userId = souscription.id_utilisateur;
      
      console.log(`\n🔄 Traitement souscription ${index + 1} pour utilisateur ID: ${userId}`);
      
      if (!userMap.has(userId)) {
        console.log(`➕ Création d'un NOUVEAU groupe pour l'utilisateur ${userId}`);
        
        // Créer les informations utilisateur en priorisant les données de l'utilisateur
        let fullName = 'Utilisateur Inconnu';
        let email = 'email@inconnu.com';
        let initials = 'UI';
        
        // Priorité 1: Utiliser les données de l'utilisateur si disponibles
        if (souscription.utilisateur) {
          fullName = `${souscription.utilisateur.prenom || ''} ${souscription.utilisateur.nom || ''}`.trim();
          email = souscription.utilisateur.email || 'email@inconnu.com';
          const prenomInit = souscription.utilisateur.prenom?.charAt(0) || '';
          const nomInit = souscription.utilisateur.nom?.charAt(0) || '';
          initials = (prenomInit + nomInit).toUpperCase() || 'UI';
        }
        // Priorité 2: Utiliser les données de l'admin si l'utilisateur n'est pas disponible
        else if (souscription.admin) {
          fullName = `${souscription.admin.prenom || ''} ${souscription.admin.nom || ''}`.trim();
          email = souscription.admin.email || 'email@inconnu.com';
          const prenomInit = souscription.admin.prenom?.charAt(0) || '';
          const nomInit = souscription.admin.nom?.charAt(0) || '';
          initials = (prenomInit + nomInit).toUpperCase() || 'UI';
        }
        
        const newUser: GroupedUser = {
          id_utilisateur: userId,
          fullName: fullName,
          email: email,
          initials: initials,
          souscriptions: [],
          totalAmount: 0,
          totalInDelay: 0
        };
        
        userMap.set(userId, newUser);
        console.log(`✅ Utilisateur créé:`, {
          id: newUser.id_utilisateur,
          nom: newUser.fullName,
          email: newUser.email,
          initiales: newUser.initials
        });
      } else {
        console.log(`📝 Ajout à un groupe EXISTANT pour l'utilisateur ${userId}`);
      }

      // Ajouter la souscription au groupe
      const user = userMap.get(userId)!;
      user.souscriptions.push(souscription);
      user.totalAmount += this.souscriptionService.parseAmount(souscription.montant_total_souscrit);
      
      // Compter les retards
      if (this.isDatePassed(souscription.date_prochain)) {
        user.totalInDelay++;
      }
      
      console.log(`📊 Utilisateur ${userId} a maintenant ${user.souscriptions.length} souscription(s), total: ${user.totalAmount}`);
    });

    // Étape 4: Convertir en tableau et vérifier le résultat
    this.groupedUsers = Array.from(userMap.values());
    
    console.log('\n🎯 RÉSULTAT FINAL DU GROUPEMENT:');
    console.log('👥 Nombre d\'utilisateurs groupés:', this.groupedUsers.length);
    
    this.groupedUsers.forEach((user, index) => {
      console.log(`Utilisateur ${index + 1}:`, {
        id_utilisateur: user.id_utilisateur,
        fullName: user.fullName,
        email: user.email,
        initials: user.initials,
        nombreSouscriptions: user.souscriptions.length,
        montantTotal: user.totalAmount,
        enRetard: user.totalInDelay
      });
    });

    // Étape 5: Vérification finale
    if (this.groupedUsers.length === 0) {
      console.error('🚨 ERREUR CRITIQUE: Aucun utilisateur groupé !');
      console.error('Vérifiez que this.souscriptions contient des données valides');
    } else if (this.groupedUsers.length === 1) {
      console.log('ℹ️ INFO: Un seul utilisateur groupé détecté');
      console.log('Ceci est normal si toutes les souscriptions appartiennent au même utilisateur');
    } else {
      console.log('✅ SUCCÈS: Plusieurs utilisateurs groupés correctement');
    }

    console.log('🔥 FIN DU GROUPEMENT\n');
  }

  /**
   * Pagination - Changer de page
   */
  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadSouscriptions();
  }

  /**
   * Changement de taille de page
   */
  onPageSizeChange(size: number): void {
    this.perPage = size;
    this.filters.per_page = size;
    this.filters.page = 1;
    this.loadSouscriptions();
  }

  /**
   * Filtrage par statut
   */
  filterByStatus(statut: string): void {
    this.filters.statut = statut === '' ? undefined : statut;
    this.filters.page = 1;
    this.loadSouscriptions();
    console.log('Filtre statut appliqué:', statut);
  }

  /**
   * Filtrage par période
   */
  filterByPeriod(dateDebut?: string, dateFin?: string): void {
    this.filters.date_debut = dateDebut;
    this.filters.date_fin = dateFin;
    this.filters.page = 1;
    this.loadSouscriptions();
  }

  /**
   * Filtrage par superficie
   */
  filterBySuperficie(superficie?: number): void {
    this.filters.superficie = superficie;
    this.filters.page = 1;
    this.loadSouscriptions();
    console.log('Filtre superficie appliqué:', superficie);
  }

  /**
   * Recherche globale
   */
  onSearch(searchTerm: string): void {
    this.filters.search = searchTerm;
    this.filters.page = 1;
    this.loadSouscriptions();
    console.log('Recherche appliquée:', searchTerm);
  }

  /**
   * Rafraîchir les données
   */
  refresh(): void {
    this.loadSouscriptions();
    console.log('Actualisation des données...');
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filters = {
      page: 1,
      per_page: 100
    };
    this.searchTerm = '';
    this.statusFilter = '';
    this.surfaceFilter = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.loadSouscriptions();
  }

  /**
   * Formater le montant
   */
  formatCurrency(amount: string | number): string {
    return this.souscriptionService.formatCurrency(amount);
  }

  /**
   * Calculer le pourcentage de completion
   */
  getCompletionPercentage(souscription: ApiSouscription): number {
    return this.souscriptionService.calculateCompletionPercentage(souscription);
  }

  /**
   * Obtenir le statut avec couleur
   */
  getStatusDisplay(souscription: ApiSouscription): {status: string, color: string, label: string} {
    const calculatedStatus = this.souscriptionService.calculateSouscriptionStatus(souscription);
    const apiStatus = souscription.statut_souscription;
    
    const finalStatus = calculatedStatus || apiStatus;
    
    switch(finalStatus.toLowerCase()) {
      case 'termine':
      case 'terminé':
        return { status: finalStatus, color: 'green', label: 'Terminé' };
      case 'en_retard':
        return { status: finalStatus, color: 'red', label: 'En retard' };
      case 'en_cours':
        return { status: finalStatus, color: 'blue', label: 'En cours' };
      case 'suspendu':
        return { status: finalStatus, color: 'orange', label: 'Suspendu' };
      case 'annule':
      case 'annulé':
        return { status: finalStatus, color: 'default', label: 'Annulé' };
      case 'en_attente':
        return { status: finalStatus, color: 'cyan', label: 'En attente' };
      default:
        return { status: finalStatus, color: 'default', label: finalStatus };
    }
  }

  /**
   * Voir les détails d'une souscription
   */
  viewDetails(souscriptionId: number): void {
    this.souscriptionService.getSouscriptionById(souscriptionId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Détails souscription:', response.data);
        }
      },
      error: (error) => {
        console.error('Erreur chargement détails:', error);
      }
    });
  }

  /**
   * Exporter les données
   */
  exportData(format: 'pdf' | 'excel'): void {
    this.souscriptionService.exporterSouscriptions(format, this.filters).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `souscriptions.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur export:', error);
      }
    });
  }

  /**
   * Calculer le montant total de toutes les souscriptions
   */
  calculateTotalAmount(): number {
    return this.souscriptions.reduce((total, souscription) => {
      return total + this.souscriptionService.parseAmount(souscription.montant_total_souscrit);
    }, 0);
  }

  /**
   * Calculer le montant total payé
   */
  calculateTotalPaid(): number {
    return this.souscriptions.reduce((total, souscription) => {
      const montantPaye = this.souscriptionService.parseAmount(souscription.montant_paye);
      return total + montantPaye;
    }, 0);
  }

  /**
   * Calculer le montant total restant
   */
  calculateTotalRemaining(): number {
    return this.souscriptions.reduce((total, souscription) => {
      const resteAPayer = souscription.reste_a_payer || 0;
      return total + resteAPayer;
    }, 0);
  }

  /**
   * CORRIGÉ: Obtenir le nom complet de l'utilisateur - AVEC PRIORITÉ UTILISATEUR
   */
  getUserFullName(souscription: ApiSouscription): string {
    // Priorité 1: Utiliser les données de l'utilisateur
    if (souscription.utilisateur) {
      return `${souscription.utilisateur.prenom} ${souscription.utilisateur.nom}`;
    }
    // Priorité 2: Utiliser les données de l'admin
    if (souscription.admin) {
      return `${souscription.admin.prenom} ${souscription.admin.nom}`;
    }
    return `Utilisateur ${souscription.id_utilisateur}`;
  }

  /**
   * CORRIGÉ: Obtenir les initiales de l'utilisateur - AVEC PRIORITÉ UTILISATEUR
   */
  getUserInitials(souscription: ApiSouscription): string {
    // Priorité 1: Utiliser les données de l'utilisateur
    if (souscription.utilisateur) {
      const prenom = souscription.utilisateur.prenom?.charAt(0) || '';
      const nom = souscription.utilisateur.nom?.charAt(0) || '';
      return (prenom + nom).toUpperCase();
    }
    // Priorité 2: Utiliser les données de l'admin
    if (souscription.admin) {
      const prenom = souscription.admin.prenom?.charAt(0) || '';
      const nom = souscription.admin.nom?.charAt(0) || '';
      return (prenom + nom).toUpperCase();
    }
    return `U${souscription.id_utilisateur.toString().slice(-1)}`;
  }

  /**
   * Formater une date
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Non définie';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Vérifier si une date est passée
   */
  isDatePassed(dateString: string | null): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Vérifier si une date est urgente
   */
  isDateUrgent(dateString: string | null): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }

  /**
   * TrackBy function pour optimiser les performances
   */
  trackByFn(index: number, item: GroupedUser): number {
    return item.id_utilisateur;
  }

  /**
   * Modifier une souscription
   */
  editSouscription(souscription: ApiSouscription): void {
    console.log('Modifier souscription:', souscription);
  }

  /**
   * Voir le plan de paiement
   */
  viewPaymentPlan(souscriptionId: number): void {
    console.log('Plan de paiement pour:', souscriptionId);
  }

  /**
   * Ajouter une nouvelle souscription
   */
  AddNewSouscription(): void {
    console.log('Nouvelle souscription');
  }

  /**
   * Gestionnaire de changement de terme de recherche avec debounce
   */
  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.onSearch(this.searchTerm);
    }, 500);
  }

  /**
   * Gestionnaire de changement de filtre de statut
   */
  onStatusFilterChange(): void {
    this.filterByStatus(this.statusFilter);
  }

  /**
   * Gestionnaire de changement de filtre de surface
   */
  onSurfaceFilterChange(): void {
    const surface = this.surfaceFilter === '' ? undefined : Number(this.surfaceFilter);
    this.filterBySuperficie(surface);
  }
}