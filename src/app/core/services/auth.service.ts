import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface UserAuth {
  user_id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  user: UserAuth;
}

export interface UserProfile {
  user_id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  currentUser = signal<UserAuth | null>(null);

  constructor() {
    const savedUser = localStorage.getItem('agm_user');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  login(email: string, contrasena: string, requestedRole?: string): Observable<LoginResponse> {
    // const url = `${environment.msAuthUrl}/auth/login`;
    // Código original comentado para saltar la validación real
    // return this.http.post<LoginResponse>(url, { email, contrasena }).pipe(...)

    let role = requestedRole || 'alumno'; 
    let name = 'Usuario de Prueba';
    if (role === 'admin') { name = 'Administrador Global'; }
    if (role === 'docente') { name = 'Docente de Prueba'; }
    if (role === 'alumno') { name = 'Alumno de Prueba'; }

    const mockResponse: LoginResponse = {
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
      refresh_token: 'mock-refresh-token',
      user: {
        user_id: '123',
        nombre_completo: name,
        email: email || `${role}@buap.mx`,
        rol: role,
        activo: true
      }
    };

    return new Observable<LoginResponse>(subscriber => {
      setTimeout(() => {
        localStorage.setItem('agm_token', mockResponse.access_token);
        localStorage.setItem('agm_refresh_token', mockResponse.refresh_token);
        localStorage.setItem('agm_user', JSON.stringify(mockResponse.user));
        this.currentUser.set(mockResponse.user);
        subscriber.next(mockResponse);
        subscriber.complete();
      }, 500);
    });
  }

  logout() {
    // Podría consumir /auth/logout si es necesario, por ahora limpieza local
    localStorage.removeItem('agm_token');
    localStorage.removeItem('agm_refresh_token');
    localStorage.removeItem('agm_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<{ data: UserProfile; message: string }>(`${environment.msAuthUrl}/auth/me`).pipe(
      map(res => res.data)
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('agm_token');
  }

  getToken(): string | null {
    return localStorage.getItem('agm_token');
  }

  // Métodos de recuperación se adaptarían igual con this.http.post
  recoverPassword(email: string): Observable<any> {
    return this.http.post(`${environment.msAuthUrl}/auth/forgot-password`, { email });
  }

  resetPassword(password: string): Observable<any> {
    // This is incomplete as reset_token is needed, but we keep the signature for the component
    return this.http.post(`${environment.msAuthUrl}/auth/reset-password`, { reset_token: 'mock', nueva_contrasena: password });
  }
}
