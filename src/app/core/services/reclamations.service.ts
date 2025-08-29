// src/app/core/services/reclamations.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
  id_statut_reclamation: number; // OBLIGATOIRE
  priorite?: string; // Facultatif
  document?: File; // Facultatif - pour upload
}

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {
  private readonly API_URL = 'http://192.168.252.75:8000/api';

  constructor(private http: HttpClient) { }

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

    return this.http.get<ReclamationResponse>(`${this.API_URL}/reclamations/utilisateur`, { params })
      .pipe(
        tap(response => {
          console.log('Réclamations récupérées:', response);
        })
      );
  }

  /**
   * Crée une nouvelle réclamation avec support d'upload de fichier
   */
  createReclamation(reclamationData: CreateReclamationData): Observable<ReclamationSingleResponse> {
    // Utiliser FormData si un document est présent
    if (reclamationData.document) {
      const formData = new FormData();
      formData.append('id_souscription', reclamationData.id_souscription.toString());
      formData.append('titre', reclamationData.titre);
      formData.append('description', reclamationData.description);
      formData.append('type_reclamation', reclamationData.type_reclamation);
      formData.append('id_statut_reclamation', reclamationData.id_statut_reclamation.toString());
      if (reclamationData.priorite) {
        formData.append('priorite', reclamationData.priorite);
      }
      formData.append('document', reclamationData.document);
      
      // Plusieurs tentatives pour le nom original
      formData.append('nom_original', reclamationData.document.name);
      formData.append('nom_original_document', reclamationData.document.name);
      formData.append('original_name', reclamationData.document.name);
      formData.append('file_original_name', reclamationData.document.name);

      console.log('FormData envoyé:', {
        nom_fichier: reclamationData.document.name,
        nom_original: reclamationData.document.name,
        taille: reclamationData.document.size
      });

      return this.http.post<ReclamationSingleResponse>(`${this.API_URL}/reclamations`, formData)
        .pipe(
          tap(response => {
            console.log('Réclamation avec document créée:', response);
          })
        );
    } else {
      // Envoi JSON classique sans fichier
      const jsonData = {
        id_souscription: reclamationData.id_souscription,
        titre: reclamationData.titre,
        description: reclamationData.description,
        type_reclamation: reclamationData.type_reclamation,
        id_statut_reclamation: reclamationData.id_statut_reclamation,
        ...(reclamationData.priorite && { priorite: reclamationData.priorite })
      };

      return this.http.post<ReclamationSingleResponse>(`${this.API_URL}/reclamations`, jsonData)
        .pipe(
          tap(response => {
            console.log('Réclamation créée:', response);
          })
        );
    }
  }

  getTypeLabel(type: string): string {
    switch(type) {
      case 'anomalie_paiement':
        return 'Anomalie de paiement';
      case 'information_erronee':
        return 'Information erronée';
      case 'document_manquant':
        return 'Document manquant';
      case 'avancement_projet':
        return 'Avancement projet';
      case 'autre':
        return 'Autre';
      default:
        return type;
    }
  }

  // Obtient le libellé français de la priorité
  getPriorityLabel(priorite: string): string {
    switch(priorite.toLowerCase()) {
      case 'basse':
        return 'Basse';
      case 'normale':
        return 'Normale';
      case 'haute':
        return 'Haute';
      case 'urgente':
        return 'Urgente';
      default:
        return priorite;
    }
  }
}