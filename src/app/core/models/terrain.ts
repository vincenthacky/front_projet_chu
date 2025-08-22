export interface Terrain {
  id_terrain: number;
  libelle: string;
  localisation: string;
  superficie: string;
  prix_unitaire: string;
  description?: string;
  statut_terrain: string;
  coordonnees_gps: string;
  date_creation: Date;
  created_at: Date;
  updated_at: Date;
}