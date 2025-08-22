export interface Souscription {
    idSouscription: number;
    idUtilisateur: number;
    souscripteur: string;
    idTerrain: number;
    terrainPrincipal: string;
    idAdmin: number;
    adminGestionnaire: string;
    dateSouscription: Date;
    nombreTerrains: number;
    montantMensuel: number;
    nombreMensualites: number;
    montantTotalSouscrit: number;
    dateDebutPaiement: Date;
    dateFinPrevue: Date;
    statutSouscription: string;
    groupeSouscription: string;
    notesAdmin?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  