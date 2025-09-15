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