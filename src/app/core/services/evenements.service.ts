// src/app/core/services/evenements.service.ts
import { environment } from '@/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CreateEventRequest, CreateEventResponse, EvenementFilters, EvenementsResponse, EvenementOrganise, ApiEvenement } from '../models/evenements';


@Injectable({
  providedIn: 'root'
})
export class EvenementsService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Crée un nouvel événement avec documents optionnels
   */
  creerEvenement(eventData: CreateEventRequest, documents?: File[]): Observable<CreateEventResponse> {
    // Si des documents sont fournis, utiliser FormData
    if (documents && documents.length > 0) {
      const formData = new FormData();
      
      // Ajouter les données de l'événement
      formData.append('id_type_evenement', eventData.id_type_evenement.toString());
      formData.append('id_souscription', eventData.id_souscription.toString());
      formData.append('titre', eventData.titre);
      formData.append('description', eventData.description);
      formData.append('date_debut_evenement', eventData.date_debut_evenement);
      formData.append('date_fin_evenement', eventData.date_fin_evenement);
      formData.append('lieu', eventData.lieu);
      
      // Laravel accepte ces valeurs comme booléens
      if (eventData.est_public) {
        formData.append('est_public', '1');
      } else {
        formData.append('est_public', '0');
      }
      
      // Ajouter le type libre si fourni
      if (eventData.type_evenement_libre) {
        formData.append('type_evenement_libre', eventData.type_evenement_libre);
      }
      
      // Ajouter les documents
      documents.forEach(file => {
        formData.append('documents[]', file, file.name);
      });
      
      // Ajouter l'en-tête pour indiquer qu'on envoie du multipart
      return this.http.post<CreateEventResponse>(`${this.API_URL}/evenements`, formData)
        .pipe(
          tap(response => {
            console.log('Événement créé avec documents:', response);
          })
        );
    } else {
      // Sans documents, envoyer du JSON simple avec headers appropriés
      const payload = {
        ...eventData,
        est_public: eventData.est_public === true ? true : false // Force le type booléen
      };
      
      return this.http.post<CreateEventResponse>(`${this.API_URL}/evenements`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .pipe(
          tap(response => {
            console.log('Événement créé sans documents:', response);
          })
        );
    }
  }

  /**
   * Récupère tous les événements de l'utilisateur connecté avec pagination et filtres
   */
  getMesEvenements(filters?: EvenementFilters): Observable<EvenementsResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.per_page) params = params.set('per_page', filters.per_page.toString());
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.type_evenement) params = params.set('type_evenement', filters.type_evenement.toString());
      if (filters.priorite) params = params.set('priorite', filters.priorite);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.souscription_id) params = params.set('souscription_id', filters.souscription_id.toString());
    }

    return this.http.get<EvenementsResponse>(`${this.API_URL}/evenements`, { params })
      .pipe(
        tap(response => {
          console.log('Événements récupérés:', response);
        })
      );
  }

  /**
   * Récupère les événements par statut
   */
  getEvenementsByStatut(statut: string, filters?: EvenementFilters): Observable<EvenementsResponse> {
    const statutFilters = { ...filters, statut };
    return this.getMesEvenements(statutFilters);
  }

  /**
   * Récupère les événements par type
   */
  getEvenementsByType(typeEvenement: number, filters?: EvenementFilters): Observable<EvenementsResponse> {
    const typeFilters = { ...filters, type_evenement: typeEvenement };
    return this.getMesEvenements(typeFilters);
  }

  /**
   * Récupère les événements d'une souscription spécifique
   */
  getEvenementsBySouscription(souscriptionId: number, filters?: EvenementFilters): Observable<EvenementsResponse> {
    const souscriptionFilters = { ...filters, souscription_id: souscriptionId };
    return this.getMesEvenements(souscriptionFilters);
  }

  /**
   * Recherche dans les événements
   */
  rechercherEvenements(query: string, filters?: EvenementFilters): Observable<EvenementsResponse> {
    const searchFilters = { ...filters, search: query };
    return this.getMesEvenements(searchFilters);
  }

  /**
   * Utilitaires pour le formatage des données
   */

  // Obtient la classe CSS pour le statut de l'événement
  getStatutClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'planifie':
        return 'badge-info';
      case 'en_cours':
        return 'badge-primary';
      case 'termine':
        return 'badge-success';
      case 'annule':
        return 'badge-danger';
      case 'reporte':
        return 'badge-warning';
      case 'suspendu':
        return 'badge-secondary';
      default:
        return 'badge-light';
    }
  }

  // Obtient le libellé français du statut
  getStatutLabel(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'planifie':
        return 'Planifié';
      case 'en_cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      case 'annule':
        return 'Annulé';
      case 'reporte':
        return 'Reporté';
      case 'suspendu':
        return 'Suspendu';
      default:
        return statut;
    }
  }

  // Obtient la classe CSS pour la priorité
  getPrioriteClass(priorite: string): string {
    switch (priorite.toLowerCase()) {
      case 'haute':
        return 'priority-high';
      case 'normale':
        return 'priority-normal';
      case 'basse':
        return 'priority-low';
      case 'urgente':
        return 'priority-urgent';
      default:
        return 'priority-normal';
    }
  }

  // Obtient le libellé français de la priorité
  getPrioriteLabel(priorite: string): string {
    switch (priorite.toLowerCase()) {
      case 'haute':
        return 'Haute';
      case 'normale':
        return 'Normale';
      case 'basse':
        return 'Basse';
      case 'urgente':
        return 'Urgente';
      default:
        return priorite;
    }
  }

  // Calcule le nombre de jours restants
  getJoursRestants(dateFin: string): number {
    const today = new Date();
    const finDate = new Date(dateFin);
    const diffTime = finDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Détermine si un événement est récent (moins de 7 jours)
  isRecent(dateDebut: string): boolean {
    const today = new Date();
    const eventDate = new Date(dateDebut);
    const diffDays = Math.ceil((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.abs(diffDays) <= 7;
  }

  // Formate un montant en devise
  formatCurrency(amount: number | null): string {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Obtient tous les événements sous forme de liste plate (utilitaire)
  getAllEvenementsFlat(evenementsOrganises: EvenementOrganise[]): ApiEvenement[] {
    const allEvents: ApiEvenement[] = [];
    
    evenementsOrganises.forEach(typeGroup => {
      typeGroup.mois.forEach(mois => {
        allEvents.push(...mois.evenements);
      });
    });
    
    return allEvents;
  }

  // Groupe les événements par mois (utilitaire)
  groupEventsByMonth(events: ApiEvenement[]): { [key: string]: ApiEvenement[] } {
    return events.reduce((groups, event) => {
      const date = new Date(event.date_debut_evenement);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      
      groups[monthKey].push(event);
      return groups;
    }, {} as { [key: string]: ApiEvenement[] });
  }
}