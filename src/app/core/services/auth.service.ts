import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado de autenticación usando Signals
  currentUser = signal<any | null>(null);

  constructor() {
    // Intentar recuperar sesión del localStorage al iniciar
    const savedUser = localStorage.getItem('agm_session');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  // Mock Login: Acepta cualquier cosa por ahora
  login(email: string, password: string, role: string) {
    const mockUser = {
      email,
      role,
      name: 'Usuario de Prueba',
      token: 'mock-jwt-token-12345'
    };

    localStorage.setItem('agm_session', JSON.stringify(mockUser));
    this.currentUser.set(mockUser);
    return true;
  }

  logout() {
    localStorage.removeItem('agm_session');
    this.currentUser.set(null);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  // Mock recuperar contraseña (ms-auth / Pág. 4)
  recoverPassword(email: string) {
    console.log(`Solicitando recuperación de contraseña para: ${email}`);
    // Simular éxito para pruebas del Front
    return true;
  }

  // Mock restablecer contraseña (ms-auth / Pág. 5)
  resetPassword(password: string) {
    console.log(`Restableciendo contraseña a nueva contraseña`);
    // Simular éxito para pruebas del Front
    return true;
  }
}
