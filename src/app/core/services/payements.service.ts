// ===== INTERFACES POUR L'API PAIEMENTS =====

// Interface pour un paiement depuis l'API
export interface ApiPaiement {
  id_plan_paiement: number;
  id_souscription: number;
  numero_mensualite: number;
  montant_versement_prevu: string;
  date_limite_versement: string;
  date_paiement_effectif: string;
  montant_paye: string;
  mode_paiement: string;
  reference_paiement?: string | null;
  est_paye: boolean;
  penalite_appliquee: string;
  statut_versement: string;
  commentaire_paiement?: string | null;
  date_saisie?: string | null;
  created_at: string;
  updated_at: string;
  souscription: ApiSouscriptionInPaiement;
}

// Interface pour la souscription incluse dans chaque paiement
export interface ApiSouscriptionInPaiement {
  id_souscription: number;
  id_utilisateur: number;
  id_terrain: number;
  id_admin: number;
  origine: string;
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
  utilisateur: {
    id_utilisateur: number;
    matricule: string | null;
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
}

// Interface pour la réponse complète de l'API paiements
export interface PaiementsResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ApiPaiement[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
  statistiques: {
    total_mensualites: number;
    total_paye_a_temps: number;
    total_en_retard: number;
    total_en_attente: number;
  };
}

// Interface pour les filtres de l'API paiements
export interface PaiementsFilters {
  page?: number;
  per_page?: number;
  id_souscription?: number;
  statut_versement?: string;
  mode_paiement?: string;
  date_debut?: string;
  date_fin?: string;
  search?: string;
}


export interface PaymentCreationResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    id_plan_paiement: number;
    id_souscription: number;
    montant_paye: string;
    mode_paiement: string;
    date_paiement_effectif: string;
    statut_versement: string;
    created_at: string;
    updated_at: string;
  };
}

export interface PaymentData {
  id_souscription: number;
  mode_paiement: string;
  montant_paye: number;
  date_paiement_effectif: string;
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from 'src/environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PayementsService {
  private apiUrl = 'http://192.168.252.75:8000/api/paiements'; // ✅ Updated to new endpoint

  constructor(private http: HttpClient) {}

  /**
   * Créer un nouveau paiement
   */
  createPaiement(paymentData: PaymentData): Observable<PaymentCreationResponse> {
    const payload = {
      id_souscription: paymentData.id_souscription,
      mode_paiement: paymentData.mode_paiement,
      montant_paye: paymentData.montant_paye.toString(), // Convertir en string si l'API attend une string
      date_paiement_effectif: paymentData.date_paiement_effectif
    };

    console.log('📤 Envoi paiement à l\'API:', payload);
    console.log('🔗 URL:', this.apiUrl);

    return this.http.post<PaymentCreationResponse>(this.apiUrl, payload);
  }

  /**
   * Récupérer tous les paiements
   */
  getMesPaiements(filters?: PaiementsFilters): Observable<PaiementsResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.id_souscription) params = params.set('id_souscription', filters.id_souscription.toString());
      if (filters.statut_versement) params = params.set('statut_versement', filters.statut_versement);
      if (filters.mode_paiement) params = params.set('mode_paiement', filters.mode_paiement);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.search) params = params.set('search', filters.search);
    }

    console.log('📤 Appel API getPaiements avec filtres:', filters);
    console.log('🔗 URL complète:', `${this.apiUrl}?${params.toString()}`);

    return this.http.get<PaiementsResponse>(this.apiUrl, { params });
  }

  /**
   * Récupérer les paiements d'une souscription spécifique
   */
  getPaiementsBySubscription(idSouscription: number, filters?: Omit<PaiementsFilters, 'id_souscription'>): Observable<PaiementsResponse> {
    const subscriptionFilters: PaiementsFilters = {
      ...filters,
      id_souscription: idSouscription
    };

    console.log('📤 Appel API getPaiementsBySubscription pour souscription:', idSouscription);
    
    return this.getMesPaiements(subscriptionFilters);
  }

  /**
   * Utilitaires pour traitement des données
   */
  
  // Parser un montant string vers number
  parseAmount(amount: string | number): number {
    if (typeof amount === 'number') return amount;
    if (!amount) return 0;
    
    const cleanAmount = amount.toString().replace(/[^\d.-]/g, '');
    return parseFloat(cleanAmount) || 0;
  }

  // Formater un montant en devise
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  // Formater une date
  formatDate(dateString: string): string {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return 'Date non disponible';
    }
  }

  // Obtenir la couleur du statut de paiement
  getPaymentStatusColor(status: string): string {
    switch(status?.toLowerCase()) {
      case 'paye_a_temps': return '#10b981'; // Vert
      case 'paye_en_retard': return '#f59e0b'; // Orange
      case 'en_attente': return '#3b82f6'; // Bleu
      case 'annule': return '#ef4444'; // Rouge
      case 'refuse': return '#ef4444'; // Rouge
      default: return '#6b7280'; // Gris
    }
  }

  // Obtenir le label du statut de paiement
  getPaymentStatusLabel(status: string): string {
    switch(status?.toLowerCase()) {
      case 'paye_a_temps': return 'Payé à temps';
      case 'paye_en_retard': return 'Payé en retard';
      case 'en_attente': return 'En attente';
      case 'annule': return 'Annulé';
      case 'refuse': return 'Refusé';
      default: return status || 'Inconnu';
    }
  }

  // Obtenir le label du mode de paiement
  getPaymentModeLabel(mode: string): string {
    switch(mode?.toLowerCase()) {
      case 'cheque': return 'Chèque';
      case 'especes': return 'Espèces';
      case 'virement': return 'Virement bancaire';
      case 'carte': return 'Carte bancaire';
      case 'mobile': return 'Paiement mobile';
      case 'mandat': return 'Mandat';
      default: return mode || 'Non spécifié';
    }
  }

  // Calculer les statistiques des paiements
  calculatePaymentStats(paiements: ApiPaiement[]): {
    totalPaye: number;
    totalPrevu: number;
    nombrePaiements: number;
    montantMoyen: number;
    penalitesTotales: number;
  } {
    const totalPaye = paiements.reduce((sum: number, p: ApiPaiement) => sum + this.parseAmount(p.montant_paye), 0);
    const totalPrevu = paiements.reduce((sum: number, p: ApiPaiement) => sum + this.parseAmount(p.montant_versement_prevu), 0);
    const penalitesTotales = paiements.reduce((sum: number, p: ApiPaiement) => sum + this.parseAmount(p.penalite_appliquee), 0);
    
    return {
      totalPaye,
      totalPrevu,
      nombrePaiements: paiements.length,
      montantMoyen: paiements.length > 0 ? totalPaye / paiements.length : 0,
      penalitesTotales
    };
  }
  
}