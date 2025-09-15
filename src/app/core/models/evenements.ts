// Interfaces pour l'API Événements
export interface TypeEvenement {
    id_type_evenement: number;
    libelle_type_evenement: string;
    description_type: string;
    categorie_type: string;
    couleur_affichage: string;
    icone_type: string;
    ordre_affichage: number;
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
  
  export interface Terrain {
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
    terrain: Terrain;
  }
  
  export interface BadgeStatut {
    libelle: string;
    couleur: string;
  }
  
  export interface ApiEvenement {
    id_evenement: number;
    titre: string;
    description: string;
    date_debut_evenement: string;
    date_fin_evenement: string;
    date_prevue_fin: string | null;
    lieu: string;
    coordonnees_gps: string | null;
    statut_evenement: string;
    niveau_avancement_pourcentage: number;
    etape_actuelle: string | null;
    cout_estime: number | null;
    cout_reel: number | null;
    entreprise_responsable: string | null;
    responsable_chantier: string | null;
    priorite: string;
    nombre_vues: number;
    type_evenement: TypeEvenement;
    souscription: Souscription;
    documents: any[];
    duree_estimee_jours: number;
    jours_depuis_debut: number;
    est_en_cours: boolean;
    est_termine: boolean;
    est_en_retard: boolean;
    progression_temps: number;
    badge_statut: BadgeStatut;
    couleur_avancement: string;
    date_formatee: string;
  }
  
  export interface MoisEvenements {
    libelle: string;
    evenements: ApiEvenement[];
  }
  
  export interface EvenementOrganise {
    type_info: TypeEvenement;
    mois: MoisEvenements[];
  }
  
  export interface StatistiquesEvenements {
    total_evenements: number;
    par_statut: {
      planifie: number;
      en_cours: number;
      termine: number;
      annule: number;
      reporte: number;
      suspendu: number;
    };
    par_type: { [key: string]: number };
    avancement_moyen: number;
    cout_total_estime: number;
    cout_total_reel: number;
  }
  
  export interface EvenementsResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
      evenements_organises: EvenementOrganise[];
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
      };
      statistiques: StatistiquesEvenements;
    };
  }
  
  export interface EvenementFilters {
    page?: number;
    per_page?: number;
    statut?: string;
    type_evenement?: number;
    priorite?: string;
    date_debut?: string;
    date_fin?: string;
    search?: string;
    souscription_id?: number;
  }
  
  // Interface pour les données de création d'événement
  export interface CreateEventRequest {
    id_type_evenement: number;
    id_souscription: number;
    titre: string;
    description: string;
    date_debut_evenement: string;
    date_fin_evenement: string;
    lieu: string;
    est_public: boolean; // Strictement boolean
    type_evenement_libre?: string;
  }
  
  // Interface pour la réponse de création
  export interface CreateEventResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: {
      evenement: ApiEvenement;
    };
  }