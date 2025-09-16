// src/app/core/services/reclamations.service.ts
import { environment } from '@/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ReclamationFilters, ReclamationResponse, CreateReclamationData, ReclamationSingleResponse, AdminResponseData } from '../models/reclamations';

@Injectable({
  providedIn: 'root'
})
export class ReclamationService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // CORRECTION: Utiliser l'endpoint spécifique pour les réclamations de l'utilisateur connecté
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

    // CORRECTION: Utiliser l'endpoint spécifique utilisateur
    return this.http.get<ReclamationResponse>(`${this.API_URL}/reclamations/utilisateur`, { params })
      .pipe(
        tap(response => {
          console.log('Mes réclamations récupérées:', response);
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

  /**
   * Méthodes pour l'administration
   */
  
  // Récupérer toutes les réclamations (vue admin)
  getAllReclamations(filters?: ReclamationFilters): Observable<ReclamationResponse> {
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

    // Pour l'admin, utiliser l'endpoint général
    return this.http.get<ReclamationResponse>(`${this.API_URL}/reclamations`, { params })
      .pipe(
        tap(response => {
          console.log('Toutes les réclamations récupérées (admin):', response);
        })
      );
  }

  // Répondre à une réclamation (admin)
  respondToReclamation(idReclamation: number, responseData: AdminResponseData): Observable<ReclamationSingleResponse> {
    console.log('Réponse admin pour réclamation', idReclamation, ':', responseData);
    
    return this.http.put<ReclamationSingleResponse>(`${this.API_URL}/reclamations/${idReclamation}`, responseData)
      .pipe(
        tap(response => {
          console.log('Réponse admin envoyée:', response);
        })
      );
  }

  // Obtenir les couleurs de priorité
  getPriorityColor(priorite: string): string {
    switch(priorite.toLowerCase()) {
      case 'basse':
        return 'green';
      case 'normale':
        return 'blue';
      case 'haute':
        return 'orange';
      case 'urgente':
        return 'red';
      default:
        return 'default';
    }
  }

  // Obtenir les couleurs de type
  getTypeColor(type: string): string {
    switch(type) {
      case 'anomalie_paiement':
        return 'red';
      case 'information_erronee':
        return 'orange';
      case 'document_manquant':
        return 'yellow';
      case 'avancement_projet':
        return 'blue';
      case 'autre':
        return 'default';
      default:
        return 'default';
    }
  }

  // Formater une date
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Non définie';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}