import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private apiClient = inject(ApiClient);
  private baseUrl = API_CONFIG.notificaciones;

  // GET /
  health(): Observable<any> {
    return this.apiClient.get<any>(`${this.baseUrl}/`);
  }
}
