// src/app/core/services/souscription.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Interfaces pour l'API
export interface ApiSouscription {
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
  prix_total_terrain: number;
  montant_paye: string;
  reste_a_payer: number;
  date_prochain: string | null;
  terrain: {
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
  };
  admin: {
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
    derniere_connexion: string | null;
    est_administrateur: boolean;
    statut_utilisateur: string;
    created_at: string;
    updated_at: string;
  };
  planpaiements: Array<{
    id_plan_paiement: number;
    id_souscription: number;
    numero_mensualite: number;
    montant_versement_prevu: string;
    date_limite_versement: string;
    date_paiement_effectif: string;
    montant_paye: string;
    mode_paiement: string;
    reference_paiement: string | null;
    est_paye: boolean;
    penalite_appliquee: string;
    statut_versement: string;
    commentaire_paiement: string | null;
    date_saisie: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

export interface SouscriptionResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ApiSouscription[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface SouscriptionSingleResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ApiSouscription;
}

export interface SouscriptionFilters {
  page?: number;
  per_page?: number;
  statut?: string;
  date_debut?: string;
  date_fin?: string;
  terrain_id?: number;
  search?: string;
  superficie?: number; // Superficie en m², optionnel
}

export interface SouscriptionStats {
  total_souscriptions: number;
  montant_total_souscrit: number;
  montant_total_paye: number;
  montant_restant: number;
  souscriptions_actives: number;
  souscriptions_terminees: number;
  taux_completion_moyen: number;
}

export interface PlanPaiement {
  id_plan_paiement: number;
  id_souscription: number;
  numero_mensualite: number;
  montant_versement_prevu: string;
  date_limite_versement: string;
  date_paiement_effectif: string | null;
  montant_paye: string;
  mode_paiement: string;
  reference_paiement: string | null;
  est_paye: boolean;
  penalite_appliquee: string;
  statut_versement: string;
  commentaire_paiement: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SouscriptionService {
  private readonly API_URL = 'http://192.168.252.75:8000/api';

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
      // ✅ CORRECTION : Utiliser 'superficie' au lieu de 'page'
      if (filters.superficie) params = params.set('superficie', filters.superficie.toString());
      if (filters.terrain_id) params = params.set('terrain_id', filters.terrain_id.toString());
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<SouscriptionResponse>(`${this.API_URL}/souscriptions`, { params })
      .pipe(
        tap(response => {
          console.log('📋 Souscriptions récupérées:', response);
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
      // ✅ CORRECTION : Utiliser 'superficie' au lieu de 'terrain_id'
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

  // Calcule le pourcentage de completion d'une souscription
  calculateCompletionPercentage(souscription: ApiSouscription): number {
    const totalAmount = this.parseAmount(souscription.montant_total_souscrit);
    const paidAmount = this.parseAmount(souscription.montant_paye);
    
    if (totalAmount === 0) return 0;
    return Math.round((paidAmount / totalAmount) * 100);
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
   * ✅ NOUVELLE MÉTHODE : Détermine le statut d'une souscription selon la logique métier
   * Logique des statuts :
   * - 'termine' : reste_a_payer = 0
   * - 'en_retard' : date_prochain dépassée
   * - 'en_cours' : un paiement a été effectué (montant_paye > 0)
   */
  calculateSouscriptionStatus(souscription: ApiSouscription): string {
    const resteAPayer = souscription.reste_a_payer;
    const dateProchain = souscription.date_prochain;
    const today = new Date();
    
    // Si plus rien à payer → Terminé
    if (resteAPayer === 0) {
      return 'termine';
    }
    
    // Si date de prochain paiement dépassée → En retard
    if (dateProchain) {
      const prochainePaiement = new Date(dateProchain);
      if (prochainePaiement < today) {
        return 'en_retard';
      }
    }
    
    // Si un paiement a été effectué → En cours
    const montantPaye = this.parseAmount(souscription.montant_paye);
    if (montantPaye > 0) {
      return 'en_cours';
    }
    
    // Par défaut, retourne le statut actuel
    return souscription.statut_souscription;
  }

  /**
   * ✅ MÉTHODE UTILITAIRE : Obtient le statut avec couleur pour l'affichage
   */
  getStatusWithColor(souscription: ApiSouscription): {status: string, color: string, label: string} {
    const status = this.calculateSouscriptionStatus(souscription);
    
    switch(status) {
      case 'termine':
        return { status, color: 'success', label: 'Terminé' };
      case 'en_retard':
        return { status, color: 'danger', label: 'En retard' };
      case 'en_cours':
        return { status, color: 'primary', label: 'En cours' };
      case 'suspendu':
        return { status, color: 'warning', label: 'Suspendu' };
      case 'annule':
        return { status, color: 'secondary', label: 'Annulé' };
      default:
        return { status, color: 'info', label: 'En attente' };
    }
  }

  
}