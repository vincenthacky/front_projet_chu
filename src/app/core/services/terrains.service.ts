import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TerrainResponse, Terrain } from '../models/souscription';
import { TerrainSingleResponse } from '../models/terrain';
import { environment } from '@/environment';

@Injectable({
  providedIn: 'root'
})
export class TerrainsService {

  private apiUrl = `${environment.apiUrl}/terrains`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les terrains
   */
  getAllTerrains(): Observable<TerrainResponse> {
    return this.http.get<TerrainResponse>(this.apiUrl);
  }

  /**
   * Récupérer un terrain par ID
   */
  getTerrainById(id: number): Observable<TerrainSingleResponse> {
    return this.http.get<TerrainSingleResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer un nouveau terrain
   */
  createTerrain(terrain: Terrain): Observable<TerrainSingleResponse> {
    return this.http.post<TerrainSingleResponse>(this.apiUrl, terrain);
  }

  /**
   * Mettre à jour un terrain
   */
  updateTerrain(id: number, terrain: Terrain): Observable<TerrainSingleResponse> {
    return this.http.put<TerrainSingleResponse>(`${this.apiUrl}/${id}`, terrain);
  }

  /**
   * Supprimer un terrain
   */
  deleteTerrain(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Utilitaires de formatage
   */
  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(numPrice);
  }

  formatSuperficie(superficie: string | number): string {
    const numSuperficie = typeof superficie === 'string' ? parseFloat(superficie) : superficie;
    return `${numSuperficie.toLocaleString('fr-FR')} m²`;
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'disponible': return '#52c41a';
      case 'vendu': return '#ff4d4f';
      case 'reserve': return '#fa8c16';
      default: return '#d9d9d9';
    }
  }

  getStatusLabel(status: string): string {
    switch(status) {
      case 'disponible': return 'Disponible';
      case 'vendu': return 'Vendu';
      case 'reserve': return 'Réservé';
      default: return 'Inconnu';
    }
  }
}