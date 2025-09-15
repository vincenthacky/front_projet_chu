// Interfaces pour les utilisateurs avec souscriptions
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
    date_saisie: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface SouscriptionWithPlans {
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
    groupe_souscription: string | null;
    notes_admin: string | null;
    created_at: string;
    updated_at: string;
    planpaiements: PlanPaiement[];
  }
  
  export interface UtilisateurWithSouscriptions {
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
    souscriptions: SouscriptionWithPlans[];
  }
  
  export interface UtilisateursSouscriptionsApiResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: UtilisateurWithSouscriptions[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      from: number;
      to: number;
    };
  }