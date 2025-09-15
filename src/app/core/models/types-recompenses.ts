// Interface pour les types de récompenses
export interface TypeRecompenseResponse {
    id_type_recompense: number;
    libelle_type_recompense: string;
    description_type: string;
    valeur_monetaire: string | null;
    est_monetaire: boolean;
    conditions_attribution: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface TypesRecompensesApiResponse {
    success: boolean;
    status_code: number;
    message: string;
    data: TypeRecompenseResponse[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      from: number;
      to: number;
    };
  }
  