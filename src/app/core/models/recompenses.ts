
// Interfaces
export interface TypeRecompense {
    id_type_recompense: number;
    libelle_type_recompense: string;
    description_type?: string;
    valeur_monetaire: string;
    est_monetaire: boolean;
    conditions_attribution: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Utilisateur {
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
    derniere_connexion: string;
    est_administrateur: boolean;
    statut_utilisateur: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Souscription {
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
    utilisateur: Utilisateur;
  }
  
  export interface Recompense {
    id_recompense: number;
    id_souscription: number;
    id_type_recompense: number;
    description: string;
    motif_recompense: string;
    periode_merite: string;
    statut_recompense: 'due' | 'attribuee' | 'annulee';
    date_attribution: string;
    date_attribution_effective: string | null;
    commentaire_admin: string;
    created_at: string;
    updated_at: string;
    souscription: Souscription;
    type_recompense?: TypeRecompense;
  }
  
  export interface ApiPagination {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  }
  
  export interface RecompensesApiResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: Recompense[];
    pagination: ApiPagination;
  }
  
  export interface RecompensesFilter {
    statut?: string;
    type_recompense?: number;
    utilisateur?: number;
    periode?: string;
    date_debut?: string;
    date_fin?: string;
  }
  