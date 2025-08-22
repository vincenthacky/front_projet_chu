// src/app/core/models/souscription.ts
// Interface pour l'affichage dans le composant (version simplifiée)
export interface Subscription {
  id: string;
  terrain: string;
  surface: string;
  prixTotal: number;
  montantPaye: number;
  resteAPayer: number;
  dateDebut: string;
  prochainPaiement: string;
  statut: 'en-cours' | 'en-retard' | 'termine';
  progression: number;
  payments: Payment[];
}

export interface Payment {
  date: string;
  amount: number;
}

// Interfaces pour l'API - Structure exacte du backend
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
  terrain: ApiTerrain;
  admin: ApiAdmin;
  planpaiements: ApiPlanPaiement[];
}

export interface ApiTerrain {
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

export interface ApiAdmin {
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
}

export interface ApiPlanPaiement {
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
}

// Réponses de l'API
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

// Filtres pour les requêtes
export interface SouscriptionFilters {
  page?: number;
  per_page?: number;
  statut?: string;
  date_debut?: string;
  date_fin?: string;
  terrain_id?: number;
  search?: string;
}

// Statistiques
export interface SouscriptionStats {
  total_souscriptions: number;
  montant_total_souscrit: number;
  montant_total_paye: number;
  montant_restant: number;
  souscriptions_actives: number;
  souscriptions_terminees: number;
  taux_completion_moyen: number;
}

// Plan de paiement simplifié
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

// Types pour les énumérations
export type StatutSouscription = 'active' | 'completed' | 'suspended' | 'cancelled';
export type StatutVersement = 'en_attente' | 'paye_a_temps' | 'paye_en_retard' | 'non_paye';
export type ModePaiement = 'especes' | 'cheque' | 'virement' | 'mobile_money';

// Interface pour les données de création/modification
export interface CreateSouscriptionData {
  id_terrain: number;
  nombre_terrains: number;
  montant_mensuel: number;
  nombre_mensualites: number;
  date_debut_paiement: string;
  groupe_souscription?: string;
  notes_admin?: string;
}

export interface UpdateSouscriptionData {
  montant_mensuel?: number;
  nombre_mensualites?: number;
  date_debut_paiement?: string;
  statut_souscription?: StatutSouscription;
  groupe_souscription?: string;
  notes_admin?: string;
}

// Interface pour les données de paiement
export interface PaiementData {
  montant_paye: number;
  mode_paiement: ModePaiement;
  reference_paiement?: string;
  commentaire_paiement?: string;
}

// Interface pour les réponses d'erreur
export interface ApiErrorResponse {
  success: false;
  status_code: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Interface pour les réponses de succès génériques
export interface ApiSuccessResponse<T = any> {
  success: true;
  status_code: number;
  message: string;
  data: T;
}

// Types helper pour la conversion de données
export interface DataMapper {
  apiToSubscription(apiData: ApiSouscription): Subscription;
  subscriptionToApi(subscription: Subscription): Partial<ApiSouscription>;
}

// Interface pour les options de pagination
export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  pageSizeOptions?: string[];
}

// Interface pour les options d'export
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  filters?: SouscriptionFilters;
  filename?: string;
}

// Interface pour les notifications
export interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}