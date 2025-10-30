import { environment } from '@/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DocumentFilters, DocumentResponse, DocumentSingleResponse } from '../models/documents';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly API_URL = environment.apiUrl;
  private readonly STORAGE_URL = environment.storageUrl;

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

    return this.http.get<DocumentResponse>(`${this.API_URL}/documents`, { params })
      .pipe(
        tap(response => {
          console.log('Tous les documents récupérés:', response);
          console.log('Nombre total de documents:', response.data?.length || 0);
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
          console.log('Mes documents récupérés:', response);
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

  // MÉTHODE CORRIGÉE PRINCIPALE : Génération de l'URL des documents
  getDocumentUrl(cheminFichier: string): string {
    if (!cheminFichier) {
      console.warn('🔴 Chemin fichier vide ou null');
      return this.getImagePlaceholder();
    }

    // Nettoyer le chemin en supprimant les slashes en début/fin
    let cleanPath = cheminFichier.replace(/^\/+|\/+$/g, '');
    
    // S'assurer que le chemin commence par 'documents/' si ce n'est pas déjà le cas
    if (!cleanPath.startsWith('documents/')) {
      cleanPath = `documents/${cleanPath}`;
    }
    
    // Utiliser directement storageUrl au lieu de dériver de apiUrl
    const fullUrl = `${this.STORAGE_URL}/${cleanPath}`;
    
    console.log('🔍 URL générée pour document:', {
      cheminOriginal: cheminFichier,
      cheminNettoye: cleanPath,
      urlComplete: fullUrl,
      storageUrl: this.STORAGE_URL
    });
    
    return fullUrl;
  }

  /**
   * Ajouter un document pour un utilisateur et une souscription
   */
  ajouterDocumentSouscripteur(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/dossier-souscripteur`, formData)
      .pipe(
        tap(response => {
          console.log('Document souscripteur ajouté:', response);
        })
      );
  }

  /**
   * NOUVELLES MÉTHODES UTILITAIRES POUR LES MÉDIAS
   */

  /**
   * Vérifie si un fichier est une image basé sur son extension
   */
  isImage(nomFichier: string): boolean {
    if (!nomFichier) return false;
    
    const extension = nomFichier.split('.').pop()?.toLowerCase() || '';
    const isImg = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico'].includes(extension);
    
    console.log(`📸 Test image - Fichier: ${nomFichier} | Extension: ${extension} | Est image: ${isImg}`);
    
    return isImg;
  }

  /**
   * Vérifie si un fichier est une vidéo basé sur son extension
   */
  isVideo(nomFichier: string): boolean {
    if (!nomFichier) return false;
    
    const extension = nomFichier.split('.').pop()?.toLowerCase() || '';
    const isVid = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'].includes(extension);
    
    console.log(`🎥 Test vidéo - Fichier: ${nomFichier} | Extension: ${extension} | Est vidéo: ${isVid}`);
    
    return isVid;
  }

  /**
   * Vérifie si un fichier est un audio
   */
  isAudio(nomFichier: string): boolean {
    if (!nomFichier) return false;
    
    const extension = nomFichier.split('.').pop()?.toLowerCase() || '';
    return ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(extension);
  }

  /**
   * Vérifie si un document est un média (image, vidéo, audio)
   */
  isMediaFile(document: any): boolean {
    if (!document || !document.nom_original) return false;
    
    // Vérification par extension
    const isMediaByExtension = this.isImage(document.nom_original) || 
                              this.isVideo(document.nom_original) || 
                              this.isAudio(document.nom_original);
    
    // Vérification par type MIME si disponible
    const isMediaByMime = document.type_mime && (
      document.type_mime.startsWith('image/') ||
      document.type_mime.startsWith('video/') ||
      document.type_mime.startsWith('audio/')
    );
    
    return isMediaByExtension || isMediaByMime;
  }

  /**
   * Génère une URL de placeholder pour les images en erreur
   */
  getImagePlaceholder(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2ExYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
  }

  /**
   * Filtre les documents pour ne récupérer que les images
   */
  filterImages(documents: any[]): any[] {
    if (!documents || !Array.isArray(documents)) return [];
    
    return documents.filter(doc => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isImageByExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension);
      const isImageByMime = doc.type_mime?.startsWith('image/') || false;
      
      return isImageByExtension || isImageByMime;
    });
  }

  /**
   * Filtre les documents pour ne récupérer que les vidéos
   */
  filterVideos(documents: any[]): any[] {
    if (!documents || !Array.isArray(documents)) return [];
    
    return documents.filter(doc => {
      const extension = doc.nom_original?.split('.').pop()?.toLowerCase() || '';
      const isVideoByExtension = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'].includes(extension);
      const isVideoByMime = doc.type_mime?.startsWith('video/') || false;
      
      return isVideoByExtension || isVideoByMime;
    });
  }

  /**
   * Teste si une URL d'image est accessible
   */
  testImageUrl(url: string): Promise<boolean> {
    console.log('🧪 Test de l\'URL:', url);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log('✅ URL accessible:', url);
        resolve(true);
      };
      img.onerror = () => {
        console.log('❌ URL inaccessible:', url);
        resolve(false);
      };
      img.src = url;
      
      // Timeout après 5 secondes
      setTimeout(() => {
        console.log('⏱️ Timeout pour URL:', url);
        resolve(false);
      }, 5000);
    });
  }

  // Utilitaires existants améliorés
  formatTailleFichier(taille: number): string {
    if (!taille || taille === 0) return '0 B';
    
    if (taille < 1024) {
      return `${taille} B`;
    } else if (taille < 1024 * 1024) {
      return `${(taille / 1024).toFixed(1)} KB`;
    } else if (taille < 1024 * 1024 * 1024) {
      return `${(taille / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(taille / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  }

  getFileIcon(nomFichier: string): string {
    if (!nomFichier) return 'file';
    
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
      case 'ppt':
      case 'pptx':
        return 'file-powerpoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
      case 'bmp':
        return 'file-image';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'webm':
      case 'mkv':
        return 'file-video';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'aac':
      case 'flac':
        return 'file-audio';
      case 'zip':
      case 'rar':
      case '7z':
        return 'file-zip';
      case 'txt':
        return 'file-text';
      case 'csv':
        return 'file-csv';
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
      case 'en_cours':
        return 'badge-warning';
      case 'valide':
        return 'badge-success';
      case 'rejete':
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
      case 'en_cours':
        return 'En cours';
      case 'valide':
        return 'Validé';
      case 'rejete':
        return 'Rejeté';
      default:
        return statut;
    }
  }

  isRecent(dateTelechargement: string): boolean {
    if (!dateTelechargement) return false;
    
    const today = new Date();
    const docDate = new Date(dateTelechargement);
    const diffDays = Math.ceil((today.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  /**
   * Debug une URL de document
   */
  debugDocumentUrl(document: any): void {
    console.group(`🔍 Debug Document: ${document.nom_original}`);
    console.log('Document complet:', document);
    console.log('Chemin original:', document.chemin_fichier);
    console.log('URL générée:', this.getDocumentUrl(document.chemin_fichier));
    console.log('Type détecté:', {
      isImage: this.isImage(document.nom_original),
      isVideo: this.isVideo(document.nom_original),
      isAudio: this.isAudio(document.nom_original)
    });
    console.log('Type MIME:', document.type_mime);
    console.groupEnd();
  }
}