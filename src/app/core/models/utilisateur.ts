// src/app/core/models/utilisateur.interface.ts
export interface Utilisateur {
  id_utilisateur: number;
  matricule?: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  poste?: string;
  type: string; // 'superAdmin', 'admin', 'user', etc.
  service?: string;
  date_inscription: string; // ISO string
  derniere_connexion?: string | null; // ISO string
  est_administrateur: boolean;
  statut_utilisateur: 'actif' | 'suspendu' | 'inactif';
  created_at: string; // ISO string
  updated_at: string; // ISO string
  
  // Champs optionnels pour la gestion des mots de passe
  token_reset?: string;
  token_expiration?: string;
}

// Interface pour la réponse API des utilisateurs
export interface UtilisateurResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Utilisateur[];
  pagination?: Pagination;
}

export interface UtilisateurSingleResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Utilisateur;
}

// Interface pour les filtres d'utilisateur
export interface UtilisateurFilters {
  page?: number;
  per_page?: number;
  type?: string;
  service?: string;
  statut?: string;
  est_administrateur?: boolean;
  search?: string;
}

// Interface pour la création/mise à jour d'utilisateur
export interface CreateUtilisateurRequest {
  matricule?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  poste?: string;
  type: string;
  service?: string;
  mot_de_passe: string;
  mot_de_passe_confirmation: string;
  est_administrateur?: boolean;
  statut_utilisateur?: string;
}

export interface UpdateUtilisateurRequest {
  matricule?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  poste?: string;
  type?: string;
  service?: string;
  mot_de_passe?: string;
  mot_de_passe_confirmation?: string;
  est_administrateur?: boolean;
  statut_utilisateur?: string;
}

// Interface de pagination (réutilisable)
export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}