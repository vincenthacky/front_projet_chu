import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Souscription } from '../models/souscription';

@Injectable({
  providedIn: 'root'
})
export class SouscriptionService {
  private apiUrl = 'http://192.168.252.75:8000/api/souscriptions';

  constructor(private http: HttpClient) { }

  // Fetch subscriptions for the authenticated user
  getUserSubscriptions(userId: number): Observable<{ success: boolean, status_code: number, message: string, data: Souscription[], pagination: any }> {
    return this.http.get<{ success: boolean, status_code: number, message: string, data: Souscription[], pagination: any }>(`${this.apiUrl}/user/${userId}`);
  }

  getAllSouscriptions(): Observable<{ success: boolean, status_code: number, message: string, data: Souscription[], pagination: any }> {
    return this.http.get<{ success: boolean, status_code: number, message: string, data: Souscription[], pagination: any }>(this.apiUrl);
  }

  getSouscriptionById(id: number): Observable<{ success: boolean, status_code: number, message: string, data: Souscription }> {
    return this.http.get<{ success: boolean, status_code: number, message: string, data: Souscription }>(`${this.apiUrl}/${id}`);
  }

  createSouscription(souscription: Souscription): Observable<{ success: boolean, status_code: number, message: string, data: Souscription }> {
    return this.http.post<{ success: boolean, status_code: number, message: string, data: Souscription }>(this.apiUrl, souscription);
  }

  updateSouscription(id: number, souscription: Souscription): Observable<{ success: boolean, status_code: number, message: string, data: Souscription }> {
    return this.http.put<{ success: boolean, status_code: number, message: string, data: Souscription }>(`${this.apiUrl}/${id}`, souscription);
  }

  deleteSouscription(id: number): Observable<{ success: boolean, status_code: number, message: string }> {
    return this.http.delete<{ success: boolean, status_code: number, message: string }>(`${this.apiUrl}/${id}`);
  }
}