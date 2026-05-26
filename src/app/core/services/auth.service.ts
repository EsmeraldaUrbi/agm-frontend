import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { API_CONFIG } from '../config/api.config';
import { ApiClient } from './apiClient';
import { tap, map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { normalizeUser, unwrapApiResponse } from '../helpers/apiResponse.helpers';

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
  expires_in: number;
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
  private apiClient = inject(ApiClient);
  private router = inject(Router);
  
  currentUser = signal<UserAuth | null>(null);

  constructor() {
    const session = this.getSession();
    if (session && session.user) {
      this.currentUser.set(session.user);
    }
  }

  // POST /auth/login
  login(email: string, contrasena: string, requestedRole?: string): Observable<LoginResponse> {
    const url = `${API_CONFIG.auth}/auth/login`;
    return this.apiClient.post<{ success: boolean; data: LoginResponse; message: string }>(url, { email, contrasena }).pipe(
      map(res => {
        const unwrapped = unwrapApiResponse<LoginResponse>(res);
        return {
          ...unwrapped,
          user: normalizeUser(unwrapped.user)
        };
      }),
      tap((response: LoginResponse) => {
        this.saveSession(response);
      })
    );
  }

  // GET /auth/me
  getMe(): Observable<UserProfile> {
    const url = `${API_CONFIG.auth}/auth/me`;
    return this.apiClient.get<any>(url).pipe(
      map(res => normalizeUser(unwrapApiResponse(res))),
      tap(profile => {
        const session = this.getSession();
        if (session) {
          session.user = profile;
          localStorage.setItem('agm_user', JSON.stringify(profile));
          this.currentUser.set(profile);
        }
      })
    );
  }

  // POST /auth/refresh
  refreshToken(refreshToken: string): Observable<any> {
    const url = `${API_CONFIG.auth}/auth/refresh`;
    return this.apiClient.post<any>(url, { refresh_token: refreshToken }).pipe(
      tap(res => {
        const data = unwrapApiResponse<any>(res);
        if (data && data.access_token) {
          localStorage.setItem('agm_token', data.access_token);
        }
      })
    );
  }

  // POST /auth/logout
  logout(): Observable<any> {
    const url = `${API_CONFIG.auth}/auth/logout`;
    return this.apiClient.post<any>(url, {}).pipe(
      catchError(() => of(null)), // Si falla por token inválido, igual salimos
      tap(() => {
        this.clearSession();
        this.router.navigate(['/login']);
      })
    );
  }

  // POST /auth/forgot-password
  forgotPassword(email: string): Observable<any> {
    const url = `${API_CONFIG.auth}/auth/forgot-password`;
    return this.apiClient.post<any>(url, { email });
  }

  // POST /auth/reset-password (Firma flexible de 1 o 2 parámetros para compatibilidad con UI y backend)
  resetPassword(resetTokenOrPassword: string, nuevaContrasena?: string): Observable<any> {
    const url = `${API_CONFIG.auth}/auth/reset-password`;
    let token = '';
    let password = '';
    
    if (nuevaContrasena === undefined) {
      password = resetTokenOrPassword;
      // Extraer token dinámicamente de la URL de forma segura
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get('token') || urlParams.get('reset_token') || '';
    } else {
      token = resetTokenOrPassword;
      password = nuevaContrasena;
    }

    return this.apiClient.post<any>(url, {
      reset_token: token,
      nueva_contrasena: password
    });
  }

  // === MÉTODOS DE COMPATIBILIDAD CON VISTAS EXISTENTES ===
  getProfile(): Observable<UserProfile> {
    return this.getMe();
  }

  recoverPassword(email: string): Observable<any> {
    return this.forgotPassword(email);
  }


  // Manejo de almacenamiento local
  saveSession(data: LoginResponse) {
    localStorage.setItem('agm_token', data.access_token);
    localStorage.setItem('agm_refresh_token', data.refresh_token);
    localStorage.setItem('agm_user', JSON.stringify(data.user));
    // Guardar también datos individuales por compatibilidad solicitada
    localStorage.setItem('current_user_id', data.user.user_id);
    localStorage.setItem('current_user_email', data.user.email);
    localStorage.setItem('current_user_role', data.user.rol);
    localStorage.setItem('current_user_name', data.user.nombre_completo);
    this.currentUser.set(data.user);
  }

  getSession() {
    const access_token = localStorage.getItem('agm_token');
    const refresh_token = localStorage.getItem('agm_refresh_token');
    const savedUser = localStorage.getItem('agm_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    
    if (access_token && refresh_token && user) {
      return { access_token, refresh_token, user };
    }
    return null;
  }

  clearSession() {
    localStorage.removeItem('agm_token');
    localStorage.removeItem('agm_refresh_token');
    localStorage.removeItem('agm_user');
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('current_user_email');
    localStorage.removeItem('current_user_role');
    localStorage.removeItem('current_user_name');
    this.currentUser.set(null);
  }

  getCurrentUser(): UserAuth | null {
    return this.currentUser();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('agm_token');
  }

  getToken(): string | null {
    return localStorage.getItem('agm_token');
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.rol.toLowerCase() === role.toLowerCase();
  }
}
