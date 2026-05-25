import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface IniciarSesionRequest {
  id_materia: number;
}

export interface SesionAsistencia {
  id_sesion: number;
  id_materia: number;
  id_docente: number;
  estado_sesion: string;
  fecha_hora_inicio: string;
  fecha_hora_limite_presente: string;
  fecha_hora_fin: string;
  fecha_hora_cierre?: string | null;
}

export interface GenerarQrRequest {
  id_sesion: number;
}

export interface GenerarQrResponse {
  token: string;
  tiempo_vida_segundos: number;
  expiracion: string;
}

export interface RegistrarAsistenciaRequest {
  token_cifrado: string;
}

export interface RegistroAsistencia {
  mensaje: string;
  estado: 'PRESENTE' | 'RETARDO' | 'AUSENTE';
  id_asistencia: number;
  // Campos de compatibilidad opcionales para la vista frontend
  id_sesion?: number;
  id_materia?: number;
  id_alumno?: number;
  matricula?: string;
  fecha_hora_registro?: string;
  metodo_registro?: string;
  estado_asistencia?: 'PRESENTE' | 'RETARDO' | 'AUSENTE';
}

@Injectable({
  providedIn: 'root'
})
export class AsistenciasService {
  private http = inject(HttpClient);
  private baseUrl = environment.msAsistenciasUrl;

  iniciarSesion(idMateria: number): Observable<SesionAsistencia> {
    return this.http.post<SesionAsistencia>(`${this.baseUrl}/sesiones/iniciar`, {
      id_materia: idMateria
    });
  }

  cerrarSesion(idSesion: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/sesiones/${idSesion}/cerrar`);
  }

  generarQr(idSesion: number): Observable<GenerarQrResponse> {
    return this.http.post<GenerarQrResponse>(`${this.baseUrl}/qr/generar`, {
      id_sesion: idSesion
    });
  }

  registrarAsistencia(tokenQr: string): Observable<RegistroAsistencia> {
    return this.http.post<RegistroAsistencia>(`${this.baseUrl}/asistencias/registrar`, {
      token_cifrado: tokenQr
    });
  }

  obtenerAsistenciasHoy(idMateria: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/asistencias/${idMateria}/hoy`);
  }

  obtenerHistorial(idMateria: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/asistencias/${idMateria}/historial`);
  }
}
