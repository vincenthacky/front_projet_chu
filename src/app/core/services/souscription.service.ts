// src/app/core/services/souscription.service.ts
import { environment } from '@/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SouscriptionFilters, SouscriptionResponse, SouscriptionSingleResponse, SouscriptionStats, ApiSouscription, TerrainResponse, Terrain } from '../models/souscription';
import { PlanPaiement } from '../models/utilisateur';

@Injectable({
  providedIn: 'root'
})
export class SouscriptionService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Récupère toutes les souscriptions avec pagination et filtres
   * Le token est automatiquement ajouté par l'AuthInterceptor
   */
  getAllSouscriptions(filters?: SouscriptionFilters): Observable<SouscriptionResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.superficie) params = params.set('superficie', filters.superficie.toString());
      if (filters.terrain_id) params = params.set('terrain_id', filters.terrain_id.toString());
      if (filters.search) params = params.set('search', filters.search);
      // Nouveaux paramètres pour la vue admin
      if (filters.all_users) params = params.set('all_users', 'true');
      if (filters.admin_view) params = params.set('admin_view', 'true');
    }

    return this.http.get<SouscriptionResponse>(`${this.API_URL}/souscriptions`, { params })
      .pipe(
        tap(response => {
          console.log('📋 Souscriptions récupérées:', response);
        })
      );
  }

  /**
   * Récupère toutes les demandes de souscriptions avec pagination et filtres
   */
  getAllDemandeSouscriptions(filters?: SouscriptionFilters): Observable<SouscriptionResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.superficie) params = params.set('superficie', filters.superficie.toString());
      if (filters.terrain_id) params = params.set('terrain_id', filters.terrain_id.toString());
      if (filters.search) params = params.set('search', filters.search);
      // Nouveaux paramètres pour la vue admin
      if (filters.all_users) params = params.set('all_users', 'true');
      if (filters.admin_view) params = params.set('admin_view', 'true');
    }

    return this.http.get<SouscriptionResponse>(`${this.API_URL}/souscriptions/demandes`, { params })
      .pipe(
        tap(response => {
          console.log('📋 demandes de Souscriptions récupérées:', response);
        })
      );
  }

  /**
   * Récupère les souscriptions de l'utilisateur connecté
   * Utilise le nouvel endpoint /souscriptions/utilisateur
   */
  getMesSouscriptions(filters?: SouscriptionFilters): Observable<SouscriptionResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.superficie) params = params.set('superficie', filters.superficie.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<SouscriptionResponse>(`${this.API_URL}/souscriptions/utilisateur`, { params })
      .pipe(
        tap(response => {
          console.log('👤 Mes souscriptions récupérées:', response);
        })
      );
  }

  /**
   * Récupère une souscription spécifique par ID
   */
  getSouscriptionById(id: number): Observable<SouscriptionSingleResponse> {
    return this.http.get<SouscriptionSingleResponse>(`${this.API_URL}/souscriptions/${id}`)
      .pipe(
        tap(response => {
          console.log('📄 Souscription récupérée:', response);
        })
      );
  }

  /**
   * Récupère les statistiques des souscriptions de l'utilisateur connecté
   */
  getMesStatistiques(): Observable<SouscriptionStats> {
    return this.http.get<{
      success: boolean;
      status_code: number;
      message: string;
      data: SouscriptionStats;
    }>(`${this.API_URL}/mes-souscriptions/statistiques`)
      .pipe(
        map(response => response.data),
        tap(stats => {
          console.log('📊 Statistiques de mes souscriptions:', stats);
        })
      );
  }

  /**
   * Récupère les plans de paiement d'une souscription
   */
  getPlansPaiement(souscriptionId: number): Observable<PlanPaiement[]> {
    return this.http.get<{
      success: boolean;
      status_code: number;
      message: string;
      data: PlanPaiement[];
    }>(`${this.API_URL}/souscriptions/${souscriptionId}/plans-paiement`)
      .pipe(
        map(response => response.data),
        tap(plans => {
          console.log('💳 Plans de paiement récupérés:', plans);
        })
      );
  }

  /**
   * Récupère les prochaines échéances de l'utilisateur connecté
   */
  getMesProchainesEcheances(limit: number = 5): Observable<PlanPaiement[]> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get<{
      success: boolean;
      status_code: number;
      message: string;
      data: PlanPaiement[];
    }>(`${this.API_URL}/mes-souscriptions/prochaines-echeances`, { params })
      .pipe(
        map(response => response.data),
        tap(echeances => {
          console.log('⏰ Prochaines échéances:', echeances);
        })
      );
  }

  /**
   * Crée une nouvelle souscription
   */
  createSouscription(souscriptionData: Partial<ApiSouscription>): Observable<SouscriptionSingleResponse> {
    return this.http.post<SouscriptionSingleResponse>(`${this.API_URL}/souscriptions`, souscriptionData)
      .pipe(
        tap(response => {
          console.log('✅ Souscription créée:', response);
        })
      );
  }

  /**
   * Met à jour une souscription existante
   */
  updateSouscription(id: number, souscriptionData: Partial<ApiSouscription>): Observable<SouscriptionSingleResponse> {
    return this.http.put<SouscriptionSingleResponse>(`${this.API_URL}/souscriptions/${id}`, souscriptionData)
      .pipe(
        tap(response => {
          console.log('✏️ Souscription mise à jour:', response);
        })
      );
  }

  /**
   * Supprime une souscription
   */
  deleteSouscription(id: number): Observable<{success: boolean; message: string}> {
    return this.http.delete<{success: boolean; message: string}>(`${this.API_URL}/souscriptions/${id}`)
      .pipe(
        tap(response => {
          console.log('🗑️ Souscription supprimée:', response);
        })
      );
  }

  /**
   * Effectue un paiement pour un plan de paiement
   */
  effectuerPaiement(planPaiementId: number, paiementData: {
    montant_paye: number;
    mode_paiement: string;
    reference_paiement?: string;
    commentaire_paiement?: string;
  }): Observable<{success: boolean; message: string; data: PlanPaiement}> {
    return this.http.post<{success: boolean; message: string; data: PlanPaiement}>(
      `${this.API_URL}/plans-paiement/${planPaiementId}/paiement`, 
      paiementData
    ).pipe(
      tap(response => {
        console.log('💰 Paiement effectué:', response);
      })
    );
  }

  /**
   * Télécharge un reçu de paiement
   */
  telechargerRecu(planPaiementId: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}/plans-paiement/${planPaiementId}/recu`, {
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('📄 Reçu téléchargé pour le plan:', planPaiementId);
      })
    );
  }

  /**
   * Recherche dans les souscriptions
   */
  rechercherSouscriptions(query: string, filters?: SouscriptionFilters): Observable<SouscriptionResponse> {
    let params = new HttpParams().set('search', query);
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.terrain_id) params = params.set('terrain_id', filters.terrain_id.toString());
    }

    return this.http.get<SouscriptionResponse>(`${this.API_URL}/souscriptions/recherche`, { params })
      .pipe(
        tap(response => {
          console.log('🔍 Résultats de recherche:', response);
        })
      );
  }

  /**
   * Exporte les souscriptions en PDF ou Excel
   */
  exporterSouscriptions(format: 'pdf' | 'excel', filters?: SouscriptionFilters): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
    }

    return this.http.get(`${this.API_URL}/souscriptions/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      tap(() => {
        console.log('📊 Export de souscriptions généré en format:', format);
      })
    );
  }

  /**
   * Utilitaires pour le formatage des données
   */
  
  // Convertit un montant string en number
  parseAmount(amount: string): number {
    return parseFloat(amount) || 0;
  }

  // Formate un montant en CFA
  formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? this.parseAmount(amount) : amount;
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(numAmount);
  }

  // ✅ CORRECTION : Calcule le pourcentage de completion d'une souscription
  calculateCompletionPercentage(souscription: ApiSouscription): number {
    // CORRECTION : Utiliser montant_total_souscrit au lieu de prix_total_terrain
    const totalAmount = parseFloat(souscription.montant_total_souscrit?.toString() || '0');
    const paidAmount = this.parseAmount(souscription.montant_paye || '0');
    
    if (totalAmount === 0) return 0;
    return (paidAmount / totalAmount) * 100;
  }

  // Détermine le statut d'urgence d'une échéance
  getEcheanceUrgency(dateLimite: string): 'urgent' | 'proche' | 'normal' {
    const today = new Date();
    const limite = new Date(dateLimite);
    const diffDays = Math.ceil((limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'urgent'; // En retard
    if (diffDays <= 7) return 'proche'; // Dans les 7 jours
    return 'normal';
  }

  /**
   * ✅ CORRECTION : Détermine le statut d'une souscription selon la logique métier
   */
  calculateSouscriptionStatus(souscription: ApiSouscription): string {
    // Protection contre les valeurs manquantes
    if (!souscription) {
      return 'en_attente';
    }

    // ✅ CORRECTION : Calculer le reste à payer basé sur montant_total_souscrit
    const montantTotal = parseFloat(souscription.montant_total_souscrit?.toString() || '0');
    const montantPaye = this.parseAmount(souscription.montant_paye || '0');
    const resteAPayer = Math.max(0, montantTotal - montantPaye);
    
    const dateProchain = souscription.date_prochain;
    const today = new Date();
    
    // Si plus rien à payer → Terminé
    if (resteAPayer === 0) {
      return 'termine';
    }
    
    // Si date de prochain paiement dépassée → En retard
    if (dateProchain) {
      try {
        const prochainePaiement = new Date(dateProchain);
        if (prochainePaiement < today) {
          return 'en_retard';
        }
      } catch (error) {
        console.warn('Date invalide pour date_prochain:', dateProchain);
      }
    }
    
    // Si un paiement a été effectué → En cours
    if (montantPaye > 0) {
      return 'en_cours';
    }
    
    // Par défaut, retourne le statut actuel ou 'en_attente'
    return souscription.statut_souscription || 'en_attente';
  }

  /**
   * Obtient le statut avec couleur pour l'affichage
   */
  getStatusWithColor(souscription: ApiSouscription): {status: string, color: string, label: string} {
    const status = souscription.statut_souscription || this.calculateSouscriptionStatus(souscription);
    
    switch(status) {
      case 'active': return { status, color: 'blue', label: 'Active' }; 
      case 'suspendu': return { status, color: 'orange', label: 'Suspendu' }; 
      case 'supendu': return { status, color: 'orange', label: 'Suspendu' }; 
      case 'terminer': return { status, color: 'green', label: 'Terminé' }; 
      case 'termine': return { status, color: 'green', label: 'Terminé' };
      case 'resilier': return { status, color: 'gray', label: 'Résilié' }; 
      case 'en_attente': return { status, color: 'cyan', label: 'En attente' }; 
      case 'rejete': return { status, color: 'red', label: 'Rejeté' }; 
      case 'en_cours':
        return { status, color: 'primary', label: 'En cours' };
      case 'en_retard':
        return { status, color: 'danger', label: 'En retard' };
      case 'annule':
        return { status, color: 'secondary', label: 'Annulé' };
      default:
        return { status, color: 'info', label: 'Active' };
    }
  }

  // Ajouter cette méthode à SouscriptionService
  getTerrains(): Observable<Terrain[]> {
    return this.http.get<TerrainResponse>(`${this.API_URL}/terrains`).pipe(
      map(response => response.data),
      tap(terrains => console.log('🌍 Terrains récupérés:', terrains))
    );
  }

  /**
   * Créer une demande de souscription
   */
  createDemandeSouscription(demandeData: {
    id_terrain: number;
    nombre_terrains: number;
  }): Observable<{success: boolean; message: string; data?: any}> {
    return this.http.post<{success: boolean; message: string; data?: any}>(
      `${this.API_URL}/souscriptions/demandes`, 
      demandeData
    ).pipe(
      tap(response => {
        console.log('📝 Demande de souscription créée:', response);
      })
    );
  }

  /**
   * Récupère les demandes de souscription de l'utilisateur connecté
   */
  getMesDemandesSouscriptions(filters?: SouscriptionFilters): Observable<SouscriptionResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.superficie) params = params.set('superficie', filters.superficie.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<SouscriptionResponse>(`${this.API_URL}/souscriptions/demandes/utilisateur`, { params })
      .pipe(
        tap(response => {
          console.log('👤 Mes demandes de souscription récupérées:', response);
        })
      );
  }
}