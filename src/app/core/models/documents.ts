// Interfaces pour l'API Documents
export interface ApiDocument {
    id_document: number;
    id_souscription: number;
    id_type_document: number;
    source_table: string;
    id_source: number;
    nom_fichier: string;
    nom_original: string;
    chemin_fichier: string;
    type_mime: string | null;
    taille_fichier: number;
    description_document: string;
    version_document: number;
    date_telechargement: string;
    statut_document: string;
    created_at: string;
    updated_at: string;
    souscription: {
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
    };
    type_document: {
      id_type_document: number;
      libelle_type_document: string;
      description_type: string | null;
      extension_autorisee: string;
      taille_max_mo: number;
      est_obligatoire: boolean;
      created_at: string;
      updated_at: string;
    };
  }
  
  export interface DocumentResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: ApiDocument[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      from: number;
      to: number;
    };
  }
  
  export interface DocumentSingleResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: ApiDocument;
  }
  
  export interface DocumentFilters {
    page?: number;
    per_page?: number;
    source_table?: string;
    type_document?: number;
    souscription_id?: number;
    statut?: string;
    date_debut?: string;
    date_fin?: string;
    search?: string;
  }