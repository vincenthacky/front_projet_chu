// src/app/core/services/evenements.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Interfaces pour l'API Événements
export interface TypeEvenement {
  id_type_evenement: number;
  libelle_type_evenement: string;
  description_type: string;
  categorie_type: string;
  couleur_affichage: string;
  icone_type: string;
  ordre_affichage: number;
  created_at: string;
  updated_at: string;
}

export interface Utilisateur {
  id_utilisateur: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  type: string;
  service: string;
  date_inscription: string;
  derniere_connexion: string;
  est_administrateur: boolean;
  statut_utilisateur: string;
  created_at: string;
  updated_at: string;
}

export interface Terrain {
  id_terrain: number;
  libelle: string;
  localisation: string;
  superficie: string;
  prix_unitaire: string;
  description: string;
  statut_terrain: string;
  coordonnees_gps: string;
  date_creation: string;
  created_at: string;
  updated_at: string;
}

export interface Souscription {
  id_souscription: number;
  id_utilisateur: number;
  id_terrain: number;
  id_admin: number;
  date_souscription: string;
  nombre_terrains: number;
  montant_mensuel: string;
  nombre_mensualites: number;
  montant_total_souscrit: string;
  date_debut_paiement: string;
  date_fin_prevue: string;
  statut_souscription: string;
  groupe_souscription: string;
  notes_admin: string;
  created_at: string;
  updated_at: string;
  utilisateur: Utilisateur;
  terrain: Terrain;
}

export interface BadgeStatut {
  libelle: string;
  couleur: string;
}

export interface ApiEvenement {
  id_evenement: number;
  titre: string;
  description: string;
  date_debut_evenement: string;
  date_fin_evenement: string;
  date_prevue_fin: string | null;
  lieu: string;
  coordonnees_gps: string | null;
  statut_evenement: string;
  niveau_avancement_pourcentage: number;
  etape_actuelle: string | null;
  cout_estime: number | null;
  cout_reel: number | null;
  entreprise_responsable: string | null;
  responsable_chantier: string | null;
  priorite: string;
  nombre_vues: number;
  type_evenement: TypeEvenement;
  souscription: Souscription;
  documents: any[];
  duree_estimee_jours: number;
  jours_depuis_debut: number;
  est_en_cours: boolean;
  est_termine: boolean;
  est_en_retard: boolean;
  progression_temps: number;
  badge_statut: BadgeStatut;
  couleur_avancement: string;
  date_formatee: string;
}

export interface MoisEvenements {
  libelle: string;
  evenements: ApiEvenement[];
}

export interface EvenementOrganise {
  type_info: TypeEvenement;
  mois: MoisEvenements[];
}

export interface StatistiquesEvenements {
  total_evenements: number;
  par_statut: {
    planifie: number;
    en_cours: number;
    termine: number;
    annule: number;
    reporte: number;
    suspendu: number;
  };
  par_type: { [key: string]: number };
  avancement_moyen: number;
  cout_total_estime: number;
  cout_total_reel: number;
}

export interface EvenementsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    evenements_organises: EvenementOrganise[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number;
      to: number;
    };
    statistiques: StatistiquesEvenements;
  };
}

export interface EvenementFilters {
  page?: number;
  per_page?: number;
  statut?: string;
  type_evenement?: number;
  priorite?: string;
  date_debut?: string;
  date_fin?: string;
  search?: string;
  souscription_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EvenementsService {
  private readonly API_URL = 'http://192.168.252.75:8000/api';

  constructor(private http: HttpClient) { }

  /**
   * Récupère tous les événements de l'utilisateur connecté avec pagination et filtres
   */
  getMesEvenements(filters?: EvenementFilters): Observable<EvenementsResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.type_evenement) params = params.set('type_evenement', filters.type_evenement.toString());
      if (filters.priorite) params = params.set('priorite', filters.priorite);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.souscription_id) params = params.set('souscription_id', filters.souscription_id.toString());
    }

    return this.http.get<EvenementsResponse>(`${this.API_URL}/evenements`, { params })
      .pipe(
        tap(response => {
          console.log('Événements récupérés:', response);
        })
      );
  }

  /**
   * Récupère les événements par statut
   */
  getEvenementsByStatut(statut: string, filters?: EvenementFilters): Observable<EvenementsResponse> {
    const statutFilters = { ...filters, statut };
    return this.getMesEvenements(statutFilters);
  }

  /**
   * Récupère les événements par type
   */
  getEvenementsByType(typeEvenement: number, filters?: EvenementFilters): Observable<EvenementsResponse> {
    const typeFilters = { ...filters, type_evenement: typeEvenement };
    return this.getMesEvenements(typeFilters);
  }

  /**
   * Récupère les événements d'une souscription spécifique
   */
  getEvenementsBySouscription(souscriptionId: number, filters?: EvenementFilters): Observable<EvenementsResponse> {
    const souscriptionFilters = { ...filters, souscription_id: souscriptionId };
    return this.getMesEvenements(souscriptionFilters);
  }

  /**
   * Recherche dans les événements
   */
  rechercherEvenements(query: string, filters?: EvenementFilters): Observable<EvenementsResponse> {
    const searchFilters = { ...filters, search: query };
    return this.getMesEvenements(searchFilters);
  }

  /**
   * Utilitaires pour le formatage des données
   */

  // Obtient la classe CSS pour le statut de l'événement
  getStatutClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'planifie':
        return 'badge-info';
      case 'en_cours':
        return 'badge-primary';
      case 'termine':
        return 'badge-success';
      case 'annule':
        return 'badge-danger';
      case 'reporte':
        return 'badge-warning';
      case 'suspendu':
        return 'badge-secondary';
      default:
        return 'badge-light';
    }
  }

  // Obtient le libellé français du statut
  getStatutLabel(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'planifie':
        return 'Planifié';
      case 'en_cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      case 'annule':
        return 'Annulé';
      case 'reporte':
        return 'Reporté';
      case 'suspendu':
        return 'Suspendu';
      default:
        return statut;
    }
  }

  // Obtient la classe CSS pour la priorité
  getPrioriteClass(priorite: string): string {
    switch (priorite.toLowerCase()) {
      case 'haute':
        return 'priority-high';
      case 'normale':
        return 'priority-normal';
      case 'basse':
        return 'priority-low';
      case 'urgente':
        return 'priority-urgent';
      default:
        return 'priority-normal';
    }
  }

  // Obtient le libellé français de la priorité
  getPrioriteLabel(priorite: string): string {
    switch (priorite.toLowerCase()) {
      case 'haute':
        return 'Haute';
      case 'normale':
        return 'Normale';
      case 'basse':
        return 'Basse';
      case 'urgente':
        return 'Urgente';
      default:
        return priorite;
    }
  }

  // Calcule le nombre de jours restants
  getJoursRestants(dateFin: string): number {
    const today = new Date();
    const finDate = new Date(dateFin);
    const diffTime = finDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Détermine si un événement est récent (moins de 7 jours)
  isRecent(dateDebut: string): boolean {
    const today = new Date();
    const eventDate = new Date(dateDebut);
    const diffDays = Math.ceil((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.abs(diffDays) <= 7;
  }

  // Formate un montant en devise
  formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Obtient tous les événements sous forme de liste plate (utilitaire)
  getAllEvenementsFlat(evenementsOrganises: EvenementOrganise[]): ApiEvenement[] {
    const allEvents: ApiEvenement[] = [];
    
    evenementsOrganises.forEach(typeGroup => {
      typeGroup.mois.forEach(mois => {
        allEvents.push(...mois.evenements);
      });
    });
    
    return allEvents;
  }

  // Groupe les événements par mois (utilitaire)
  groupEventsByMonth(events: ApiEvenement[]): { [key: string]: ApiEvenement[] } {
    return events.reduce((groups, event) => {
      const date = new Date(event.date_debut_evenement);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      
      groups[monthKey].push(event);
      return groups;
    }, {} as { [key: string]: ApiEvenement[] });
  }
}