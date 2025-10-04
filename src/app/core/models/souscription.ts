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
  statut_dynamique: string;
  notes_admin: string;
  created_at: string;
  updated_at: string;
  prix_total_terrain: number;
  montant_paye: string;
  reste_a_payer: number;
  date_prochain: string | null;
  utilisateur: {
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
  superficie?: number; 
  all_users?: boolean; 
  admin_view?: boolean; 
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


export interface Terrain {
  statut: any;
  id_terrain: number;
  libelle: string;
  localisation: string;
  superficie: string;
  prix_unitaire: string;
  montant_mensuel: string;
  description: string;
  statut_terrain: string;
  coordonnees_gps: string;
  date_creation: string;
  created_at: string;
  updated_at: string;
}

export interface TerrainResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Terrain[];
}