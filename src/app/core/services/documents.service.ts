// src/app/core/services/documents.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Interfaces pour l'API Documents
export interface ApiDocument {
  id_document: number;
  id_souscription: number;
  id_type_document: number;
  source_table: string;
  id_source: number;
  nom_fichier: string;
  nom_original: string;
  chemin_fichier: string;
  type_mime: string | null;
  taille_fichier: number;
  description_document: string;
  version_document: number;
  date_telechargement: string;
  statut_document: string;
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
  type_document: {
    id_type_document: number;
    libelle_type_document: string;
    description_type: string | null;
    extension_autorisee: string;
    taille_max_mo: number;
    est_obligatoire: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface DocumentResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ApiDocument[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface DocumentSingleResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ApiDocument;
}

export interface DocumentFilters {
  page?: number;
  per_page?: number;
  source_table?: string;
  type_document?: number;
  souscription_id?: number;
  statut?: string;
  date_debut?: string;
  date_fin?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly API_URL = 'http://192.168.252.75:8000/api';

  constructor(private http: HttpClient) { }

  /**
   * CORRECTION: Récupère TOUS les documents (pas seulement de l'utilisateur)
   */
  getAllDocuments(filters?: DocumentFilters): Observable<DocumentResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.source_table) params = params.set('source_table', filters.source_table);
      if (filters.type_document) params = params.set('type_document', filters.type_document.toString());
      if (filters.souscription_id) params = params.set('souscription_id', filters.souscription_id.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.search) params = params.set('search', filters.search);
    }

    // CORRECTION: Utiliser l'endpoint /documents pour récupérer TOUS les documents
    return this.http.get<DocumentResponse>(`${this.API_URL}/documents`, { params })
      .pipe(
        tap(response => {
          console.log('🔍 Tous les documents récupérés:', response);
          console.log('📊 Nombre total de documents:', response.data?.length || 0);
        })
      );
  }

  /**
   * MÉTHODE EXISTANTE: Récupère les documents de l'utilisateur connecté
   */
  getMesDocuments(filters?: DocumentFilters): Observable<DocumentResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.source_table) params = params.set('source_table', filters.source_table);
      if (filters.type_document) params = params.set('type_document', filters.type_document.toString());
      if (filters.souscription_id) params = params.set('souscription_id', filters.souscription_id.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<DocumentResponse>(`${this.API_URL}/documents/utilisateur`, { params })
      .pipe(
        tap(response => {
          console.log('📁 Mes documents récupérés:', response);
        })
      );
  }

  getDocumentById(id: number): Observable<DocumentSingleResponse> {
    return this.http.get<DocumentSingleResponse>(`${this.API_URL}/documents/${id}`)
      .pipe(
        tap(response => {
          console.log('Document récupéré:', response);
        })
      );
  }

  telechargerDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/documents/${documentId}/download`, {
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('Document téléchargé pour l\'ID:', documentId);
      })
    );
  }

  visualiserDocument(documentId: number): Observable<string> {
    return new Observable<string>(observer => {
      this.telechargerDocument(documentId).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          observer.next(url);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  getDocumentsBySource(sourceTable: string, filters?: DocumentFilters): Observable<DocumentResponse> {
    const sourceFilters = { ...filters, source_table: sourceTable };
    return this.getAllDocuments(sourceFilters);
  }

  getDocumentsBySouscription(souscriptionId: number, filters?: DocumentFilters): Observable<DocumentResponse> {
    const souscriptionFilters = { ...filters, souscription_id: souscriptionId };
    return this.getAllDocuments(souscriptionFilters);
  }

  rechercherDocuments(query: string, filters?: DocumentFilters): Observable<DocumentResponse> {
    const searchFilters = { ...filters, search: query };
    return this.getAllDocuments(searchFilters);
  }

  // Utilitaires existants
  formatTailleFichier(taille: number): string {
    if (taille < 1024) {
      return `${taille} B`;
    } else if (taille < 1024 * 1024) {
      return `${Math.round(taille / 1024)} KB`;
    } else {
      return `${Math.round(taille / (1024 * 1024) * 100) / 100} MB`;
    }
  }

  getFileIcon(nomFichier: string): string {
    const extension = nomFichier.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'xls':
      case 'xlsx':
        return 'file-excel';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'file-image';
      case 'zip':
      case 'rar':
        return 'file-zip';
      default:
        return 'file';
    }
  }

  getStatutClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'actif':
        return 'badge-success';
      case 'archive':
        return 'badge-secondary';
      case 'supprime':
        return 'badge-danger';
      default:
        return 'badge-primary';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'actif':
        return 'Actif';
      case 'archive':
        return 'Archivé';
      case 'supprime':
        return 'Supprimé';
      default:
        return statut;
    }
  }

  isRecent(dateTelechargement: string): boolean {
    const today = new Date();
    const docDate = new Date(dateTelechargement);
    const diffDays = Math.ceil((today.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  getDocumentUrl(cheminFichier: string): string {
    // Enlever le préfixe 'documents/' du chemin si présent
    const cleanPath = cheminFichier.startsWith('documents/') 
      ? cheminFichier 
      : `documents/${cheminFichier}`;
    
    // Construire l'URL complète avec /storage/
    return `${this.API_URL.replace('/api', '')}/storage/${cleanPath}`;
  }
}