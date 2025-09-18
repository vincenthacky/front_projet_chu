export interface User {
  id_utilisateur: number;
  matricule?: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  poste?: string;
  type: string;
  service?: string;
  date_inscription: string;
  derniere_connexion?: string | null;
  est_administrateur: boolean;
  statut_utilisateur: 'actif' | 'suspendu' | 'inactif';
  created_at: string;
  updated_at: string;
  cni?: string | null;
  carte_professionnelle?: string | null;
  fiche_souscription?: string | null;
  photo_profil?: {
    id_document: number;
    id_souscription?: number | null;
    id_type_document: number;
    source_table: string;
    id_source: number;
    nom_fichier: string;
    nom_original: string;
    chemin_fichier: string;
    type_mime?: string | null;
    taille_fichier: number;
    description_document: string;
    version_document: number;
    date_telechargement: string;
    statut_document: string;
    created_at: string;
    updated_at: string;
  } | null;
}

export interface UserProfileResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: User;
}

export interface UsersResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: User[];
}

export interface UserUpdateResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: User;
}

export interface LoginResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LogoutResponse {
  success: boolean;
  status_code: number;
  message: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: {
    email_sent_to: string;
    expires_at: string;
  };
}

export interface ResetPasswordResponse {
  success: boolean;
  status_code: number;
  message: string;
  data?: any;
}