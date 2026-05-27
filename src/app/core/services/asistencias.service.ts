import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { normalizeAsistencia, unwrapApiResponse, unwrapArrayResponse } from '../helpers/apiResponse.helpers';

export interface SesionAsistencia {
  id_sesion: number;
  id_materia: string | number;
  id_docente: string | number;
  estado_sesion: string;
  fecha_hora_inicio: string;
  fecha_hora_limite_presente: string;
  fecha_hora_fin: string;
  fecha_hora_cierre?: string | null;
}

export interface GenerarQrResponse {
  token: string;
  tiempo_vida_segundos: number;
  expiracion: string;
}

export interface RegistroAsistencia {
  mensaje: string;
  estado: 'PRESENTE' | 'RETARDO' | 'AUSENTE';
  id_asistencia: number;
  id_sesion?: number;
  id_materia?: string | number;
  id_alumno?: string | number;
  matricula?: string;
  fecha_hora_registro?: string;
  metodo_registro?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AsistenciasService {
  private apiClient = inject(ApiClient);
  private baseUrl = API_CONFIG.asistencias;

  // POST /sesiones/iniciar
  iniciarSesionAsistencia(idMateria: string | number): Observable<SesionAsistencia> {
    const stringId = String(idMateria);
    return this.apiClient.post<any>(`${this.baseUrl}/sesiones/iniciar`, {
      id_materia: stringId
    }).pipe(
      map(res => unwrapApiResponse<SesionAsistencia>(res))
    );
  }

  // DELETE /sesiones/:id_sesion/cerrar
  cerrarSesionAsistencia(idSesion: string | number): Observable<any> {
    return this.apiClient.delete<any>(`${this.baseUrl}/sesiones/${idSesion}/cerrar`);
  }

  // POST /asistencias/registrar (ó /asistencias/escanear)
  escanearAsistencia(payload: any): Observable<RegistroAsistencia> {
    // Normalizar el token cifrado que pueda venir en variantes
    const token = payload.token_cifrado || 
                  payload.qr_token_cifrado || 
                  payload.token || 
                  payload.qr || 
                  payload.codigo_qr;
                  
    return this.apiClient.post<any>(`${this.baseUrl}/asistencias/registrar`, {
      token_cifrado: token
    }).pipe(
      map(res => unwrapApiResponse<RegistroAsistencia>(res))
    );
  }

  // GET /asistencias/:id_materia/hoy
  getAsistenciasHoy(idMateria: string | number): Observable<any[]> {
    return this.apiClient.get<any>(`${this.baseUrl}/asistencias/${idMateria}/hoy`).pipe(
      map(res => unwrapArrayResponse<any>(res).map(normalizeAsistencia))
    );
  }

  // GET /asistencias/:id_materia/historial
  getHistorialAsistencias(idMateria: string | number): Observable<any[]> {
    // Si es un id de materia, intentamos consultar el historial por materia
    // Por si el backend requiere id_sesion, damos soporte a ambos
    return this.apiClient.get<any>(`${this.baseUrl}/asistencias/${idMateria}/historial`).pipe(
      map(res => unwrapArrayResponse<any>(res).map(normalizeAsistencia))
    );
  }

  // === MÉTODOS DE COMPATIBILIDAD CON VISTAS EXISTENTES ===
  iniciarSesion(idMateria: string | number): Observable<SesionAsistencia> {
    return this.iniciarSesionAsistencia(idMateria);
  }

  cerrarSesion(idSesion: number): Observable<any> {
    return this.cerrarSesionAsistencia(idSesion);
  }

  generarQr(idSesion: number): Observable<GenerarQrResponse> {
    return this.apiClient.post<any>(`${this.baseUrl}/qr/generar`, {
      id_sesion: idSesion
    }).pipe(
      map(res => unwrapApiResponse<GenerarQrResponse>(res))
    );
  }

  registrarAsistencia(tokenQr: string): Observable<RegistroAsistencia> {
    return this.escanearAsistencia({ token_cifrado: tokenQr });
  }

  obtenerAsistenciasHoy(idMateria: number): Observable<any[]> {
    return this.getAsistenciasHoy(idMateria);
  }

  obtenerHistorial(idMateria: number): Observable<any[]> {
    return this.getHistorialAsistencias(idMateria);
  }
}
