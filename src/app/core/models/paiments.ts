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
  souscription?: ApiSouscriptionInPaiement;
  laravel_through_key?: number; // Pour les paiements groupés
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
  groupe_souscription?: string;
  notes_admin?: string;
  created_at: string;
  updated_at: string;
  utilisateur?: {
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

// ✅ Interface pour un utilisateur avec ses paiements (groupés)
export interface ApiUtilisateurAvecPaiements {
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
  paiements: ApiPaiement[];
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

// ✅ Interface pour la réponse de l'API paiements groupés par utilisateur
export interface PaiementsGroupesResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ApiUtilisateurAvecPaiements[];
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

// ✅ Interface pour les filtres de l'API paiements groupés
export interface PaiementsGroupesFilters {
  page?: number;
  per_page?: number;
  search?: string; // Recherche sur nom, prénom, email, téléphone
  statut_versement?: string;
  mode_paiement?: string;
  date_debut?: string;
  date_fin?: string;
  statut_utilisateur?: string; // actif, inactif
}

// ✅ Interface pour les statistiques d'un utilisateur
export interface StatistiquesUtilisateur {
  id_utilisateur: number;
  nom_complet: string;
  total_paiements: number;
  montant_total_paye: number;
  nombre_mensualites_payees: number;
  paiements_en_retard: number;
  paiements_a_temps: number;
  derniere_date_paiement: string | null;
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
  reference_paiement?: string;
  commentaire_paiement?: string;
}

// ✅ Interface pour la réponse de mise à jour d'un paiement
export interface PaymentUpdateResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    id_plan_paiement: number;
    id_souscription: number;
    numero_mensualite: number;
    montant_paye: string;
    mode_paiement: string;
    date_paiement_effectif: string;
    reference_paiement?: string | null;
    commentaire_paiement?: string | null;
    statut_versement: string;
    created_at: string;
    updated_at: string;
  };
}

// ✅ Interface pour les données de mise à jour d'un paiement
export interface PaymentUpdateData {
  mode_paiement: string;
  montant_paye: number | string;
  date_paiement_effectif: string;
  reference_paiement?: string | null;
  commentaire_paiement?: string | null;
}