// src/app/core/services/reclamation.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Interfaces pour l'API
export interface ApiReclamation {
  id_reclamation: number;
  id_souscription: number;
  titre: string;
  description: string;
  type_reclamation: string;
  date_reclamation: string;
  id_statut_reclamation: number;
  priorite: string;
  reponse_admin: string | null;
  date_reponse: string | null;
  date_traitement: string | null;
  date_resolution: string | null;
  satisfaction_client: number | null;
  created_at: string;
  updated_at: string;
  souscription: {
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
  };
  statut: {
    id_statut_reclamation: number;
    libelle_statut_reclamation: string;
    description_statut: string;
    ordre_statut: number;
    couleur_statut: string;
    created_at: string;
    updated_at: string;
  };
}

export interface ReclamationResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ApiReclamation[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface ReclamationSingleResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ApiReclamation;
}

export interface ReclamationFilters {
  page?: number;
  per_page?: number;
  type?: string;
  statut?: number;
  priorite?: string;
  date_debut?: string;
  date_fin?: string;
  search?: string;
}

export interface CreateReclamationData {
  id_souscription: number;
  titre: string;
  description: string;
  type_reclamation: string;
  priorite: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {
  private readonly API_URL = 'http://192.168.252.75:8000/api';

  constructor(private http: HttpClient) { }

  /**
   * Récupère toutes les réclamations de l'utilisateur connecté avec pagination et filtres
   * Le token est automatiquement ajouté par l'AuthInterceptor
   */
  getMesReclamations(filters?: ReclamationFilters): Observable<ReclamationResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.type) params = params.set('type', filters.type);
      if (filters.statut) params = params.set('statut', filters.statut.toString());
      if (filters.priorite) params = params.set('priorite', filters.priorite);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<ReclamationResponse>(`${this.API_URL}/reclamations`, { params })
      .pipe(
        tap(response => {
          console.log('📋 Réclamations récupérées:', response);
        })
      );
  }

  /**
   * Récupère une réclamation spécifique par ID
   */
  getReclamationById(id: number): Observable<ReclamationSingleResponse> {
    return this.http.get<ReclamationSingleResponse>(`${this.API_URL}/reclamations/${id}`)
      .pipe(
        tap(response => {
          console.log('📄 Réclamation récupérée:', response);
        })
      );
  }

  /**
   * Crée une nouvelle réclamation
   */
  createReclamation(reclamationData: CreateReclamationData): Observable<ReclamationSingleResponse> {
    return this.http.post<ReclamationSingleResponse>(`${this.API_URL}/reclamations`, reclamationData)
      .pipe(
        tap(response => {
          console.log('✅ Réclamation créée:', response);
        })
      );
  }

  /**
   * Met à jour une réclamation existante
   */
  updateReclamation(id: number, reclamationData: Partial<CreateReclamationData>): Observable<ReclamationSingleResponse> {
    return this.http.put<ReclamationSingleResponse>(`${this.API_URL}/reclamations/${id}`, reclamationData)
      .pipe(
        tap(response => {
          console.log('✏️ Réclamation mise à jour:', response);
        })
      );
  }

  /**
   * Supprime une réclamation
   */
  deleteReclamation(id: number): Observable<{success: boolean; message: string}> {
    return this.http.delete<{success: boolean; message: string}>(`${this.API_URL}/reclamations/${id}`)
      .pipe(
        tap(response => {
          console.log('🗑️ Réclamation supprimée:', response);
        })
      );
  }

  /**
   * Recherche dans les réclamations
   */
  rechercherReclamations(query: string, filters?: ReclamationFilters): Observable<ReclamationResponse> {
    let params = new HttpParams().set('search', query);
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.type) params = params.set('type', filters.type);
      if (filters.statut) params = params.set('statut', filters.statut.toString());
      if (filters.priorite) params = params.set('priorite', filters.priorite);
    }

    return this.http.get<ReclamationResponse>(`${this.API_URL}/reclamations`, { params })
      .pipe(
        tap(response => {
          console.log('🔍 Résultats de recherche réclamations:', response);
        })
      );
  }

  /**
   * Utilitaires pour le formatage des données
   */
  
  // Obtient la classe CSS pour la priorité
  getPriorityClass(priorite: string): string {
    switch(priorite.toLowerCase()) {
      case 'haute':
        return 'badge-danger';
      case 'moyenne':
        return 'badge-warning';
      case 'basse':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }

  // Obtient le libellé français de la priorité
  getPriorityLabel(priorite: string): string {
    switch(priorite.toLowerCase()) {
      case 'haute':
        return 'Haute';
      case 'moyenne':
        return 'Moyenne';
      case 'basse':
        return 'Basse';
      default:
        return priorite;
    }
  }

  // Obtient la classe CSS pour le type de réclamation
  getTypeClass(type: string): string {
    switch(type) {
      case 'information_erronee':
        return 'badge-warning';
      case 'probleme_paiement':
        return 'badge-danger';
      case 'demande_information':
        return 'badge-info';
      case 'probleme_technique':
        return 'badge-secondary';
      default:
        return 'badge-primary';
    }
  }

  // Obtient le libellé français du type de réclamation
  getTypeLabel(type: string): string {
    switch(type) {
      case 'information_erronee':
        return 'Information erronée';
      case 'probleme_paiement':
        return 'Problème de paiement';
      case 'demande_information':
        return 'Demande d\'information';
      case 'probleme_technique':
        return 'Problème technique';
      default:
        return type;
    }
  }

  // Détermine si une réclamation est récente (moins de 7 jours)
  isRecent(dateReclamation: string): boolean {
    const today = new Date();
    const reclamationDate = new Date(dateReclamation);
    const diffDays = Math.ceil((today.getTime() - reclamationDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  // Calcule le nombre de jours depuis la réclamation
  getDaysSince(dateReclamation: string): number {
    const today = new Date();
    const reclamationDate = new Date(dateReclamation);
    return Math.ceil((today.getTime() - reclamationDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Obtient le statut avec style pour l'affichage
  getStatusWithStyle(reclamation: ApiReclamation): {label: string, color: string, bgColor: string} {
    const statut = reclamation.statut;
    
    // Utilise la couleur définie dans le statut si disponible
    let color = statut.couleur_statut || '#6c757d';
    
    return {
      label: statut.libelle_statut_reclamation,
      color: color,
      bgColor: `${color}20` // Ajoute de la transparence pour le background
    };
  }
}