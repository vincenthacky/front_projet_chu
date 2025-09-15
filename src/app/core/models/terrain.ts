export interface Terrain {
    id_terrain?: number;
    libelle: string;
    localisation: string;
    superficie: string | number;
    prix_unitaire: string | number;
    description: string;
    statut_terrain: 'disponible' | 'vendu' | 'reserve';
    coordonnees_gps: string;
    date_creation: string;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface TerrainResponse {
    success: boolean;
    message: string;
    data: Terrain[];
  }
  
  export interface TerrainSingleResponse {
    success: boolean;
    message: string;
    data: Terrain;
  }