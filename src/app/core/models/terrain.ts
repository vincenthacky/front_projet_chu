// src/app/core/models/terrain.interface.ts
export interface Terrain {
  id_terrain: number;
  libelle: string;
  localisation: string;
  superficie: string; // Format string dans l'API (ex: "250.00")
  prix_unitaire: string; // Format monétaire string (ex: "4121600.00")
  description?: string;
  statut_terrain: 'disponible' | 'reserve' | 'vendu' | 'indisponible';
  coordonnees_gps: string; // Format "latitude,longitude"
  date_creation: string; // ISO string
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

// Interface pour la réponse API des terrains
export interface TerrainResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Terrain[];
  pagination?: Pagination;
}

export interface TerrainSingleResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Terrain;
}

// Interface pour les filtres de terrain
export interface TerrainFilters {
  page?: number;
  per_page?: number;
  statut?: string;
  superficie_min?: number;
  superficie_max?: number;
  prix_min?: number;
  prix_max?: number;
  localisation?: string;
  search?: string;
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