// Interfaces pour l'API
export interface ApiReclamation {
    id_reclamation: number;
    id_souscription: number;
    titre: string;
    description: string;
    type_reclamation: string;
    date_reclamation: string;
    id_statut_reclamation: number;
    priorite: string;
    reponse_admin: string | null;
    date_reponse: string | null;
    date_traitement: string | null;
    date_resolution: string | null;
    satisfaction_client: number | null;
    created_at: string;
    updated_at: string;
    souscription: {
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
    };
    statut: {
      id_statut_reclamation: number;
      libelle_statut_reclamation: string;
      description_statut: string;
      ordre_statut: number;
      couleur_statut: string;
      created_at: string;
      updated_at: string;
    };
  }
  
  export interface ReclamationResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: ApiReclamation[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      from: number;
      to: number;
    };
  }
  
  export interface ReclamationSingleResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: ApiReclamation;
  }
  
  export interface ReclamationFilters {
    page?: number;
    per_page?: number;
    type?: string;
    statut?: number;
    priorite?: string;
    date_debut?: string;
    date_fin?: string;
    search?: string;
  }
  
  export interface CreateReclamationData {
    id_souscription: number;
    titre: string;
    description: string;
    type_reclamation: string;
    id_statut_reclamation: number; // OBLIGATOIRE
    priorite?: string; // Facultatif
    document?: File; // Facultatif - pour upload
  }
  
  // Interface pour la réponse admin
  export interface AdminResponseData {
    id_statut_reclamation: number; // 3=en attente, 4=résolue, 6=rejetée
    reponse_admin: string;
    date_reponse?: string;
    date_traitement?: string;
    date_resolution?: string;
    satisfaction_client?: number;
  }