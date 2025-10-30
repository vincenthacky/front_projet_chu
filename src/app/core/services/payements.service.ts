import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

import { PaymentData, PaymentCreationResponse, PaiementsFilters, PaiementsResponse, ApiPaiement } from '../models/paiments';
import { environment } from '@/environment';

@Injectable({
  providedIn: 'root'
})
export class PayementsService {
  //private apiUrl = 'http://192.168.252.75:8000/api/paiements'; 
  private apiUrl = `${environment.apiUrl}/paiements`;

  constructor(private http: HttpClient) {}

  /**
   * Créer un nouveau paiement (corrigé pour inclure les champs optionnels)
   */
  createPaiement(paymentData: PaymentData): Observable<PaymentCreationResponse> {
    const payload: any = {
      id_souscription: paymentData.id_souscription,
      mode_paiement: paymentData.mode_paiement,
      montant_paye: paymentData.montant_paye.toString(), // Convertir en string si l'API attend une string
      date_paiement_effectif: paymentData.date_paiement_effectif
    };

    // Ajout des champs optionnels s'ils sont fournis
    if (paymentData.reference_paiement && paymentData.reference_paiement.trim() !== '') {
      payload.reference_paiement = paymentData.reference_paiement;
    }
    if (paymentData.commentaire_paiement && paymentData.commentaire_paiement.trim() !== '') {
      payload.commentaire_paiement = paymentData.commentaire_paiement;
    }

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
   * Récupérer les paiements d'un utilisateur spécifique via l'endpoint dédié
   */
  getPaiementsForUser(filters?: PaiementsFilters): Observable<PaiementsResponse> {
    const url = `${environment.apiUrl}/paiements/utilisateur`;
    
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

    console.log('📤 Appel API getPaiementsForUser avec filtres:', filters);
    console.log('🔗 URL complète:', `${url}?${params.toString()}`);

    return this.http.get<PaiementsResponse>(url, { params });
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
      case 'paiement_partiel': return '#3b82f6'; // Bleu 
      default: return '#6b7280'; // Gris
    }
  }

  // Obtenir le label du statut de paiement
  getPaymentStatusLabel(status: string): string {
    switch(status?.toLowerCase()) {
      case 'paye_a_temps': return 'Payé à temps';
      case 'paye_en_retard': return 'Payé en retard';
      case 'paiement_partiel': return 'paiement_partiel';
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
      case 'mobile_money': return 'Paiement mobile';
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