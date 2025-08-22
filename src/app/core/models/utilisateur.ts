export interface Utilisateur {
  id_utilisateur: number;
  matricule: string;
  matricule_chu?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  service: string;
  mot_de_passe?: string;
  date_inscription: Date;
  derniere_connexion?: Date;
  est_administrateur: boolean;
  statut_utilisateur: string;
  token_reset?: string;
  token_expiration?: Date;
  created_at: Date;
  updated_at: Date;
  type?: string;
}