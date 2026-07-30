import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BRANDING } from '../../../core/config/branding.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styles: [`
    .login-gradient {
        background: linear-gradient(135deg, #003B5C 0%, #00253B 100%);
    }
  `]
})
export class LoginComponent {
  protected readonly BRANDING = BRANDING;

  // --- CONFIGURACIÓN DE LOGOS ---
  // Puedes cambiar estos valores por BRANDING.logoSecondary y BRANDING.isLogoSecondaryImage si lo deseas
  protected readonly logo = BRANDING.logoWhite; 
  protected readonly isLogoImage = BRANDING.isLogoWhiteImage;

  protected readonly footerLogo = BRANDING.logo;
  protected readonly isFooterLogoImage = BRANDING.isLogoImage;

  // Signals para el formulario
  email = '';
  password = '';
  selectedRole = signal<'admin' | 'docente' | 'alumno'>('admin');

  showError = signal(false);
  showPassword = signal(false);

  errorMessage = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  selectRole(role: 'admin' | 'docente' | 'alumno') {
    this.selectedRole.set(role);
    this.showError.set(false);
    this.errorMessage.set(null);
  }

  onLogin() {
    // Validación mínima antes de enviar credenciales al backend
    if (this.email && this.password) {
      this.authService.login(this.email, this.password, this.selectedRole()).subscribe({
        next: (res) => {
          const actualRole = res.user.rol.toLowerCase();
          const selected = this.selectedRole().toLowerCase();

          // Verificar si el rol seleccionado en la UI coincide con el rol real del usuario
          const isRoleMatch = 
            (selected === 'admin' && (actualRole === 'administrador' || actualRole === 'admin')) ||
            (selected === 'docente' && actualRole === 'docente') ||
            (selected === 'alumno' && actualRole === 'alumno');

          if (!isRoleMatch) {
            // El usuario existe pero no tiene el rol seleccionado. Lo expulsamos.
            this.authService.clearSession();
            this.showError.set(true);
            this.errorMessage.set(`No tienes permisos para acceder como ${selected}.`);
            return;
          }

          if (actualRole === 'administrador' || actualRole === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (actualRole === 'docente') {
            this.router.navigate(['/docente/dashboard']);
          } else if (actualRole === 'alumno') {
            this.router.navigate(['/alumno/dashboard']);
          } else {
            this.router.navigate(['/perfil']);
          }
        },
        error: (err) => {
          console.error('Error en login:', err);
          this.showError.set(true);
          
          if (err.status === 0) {
            this.errorMessage.set('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
          } else if (err.status === 401 || err.status === 403 || err.status === 404) {
            this.errorMessage.set('Correo o contraseña incorrectos.');
          } else if (err.status === 504 || err.status === 408 || err.name === 'TimeoutError') {
            this.errorMessage.set('El servidor tardó demasiado en responder.');
          } else if (err.status >= 500) {
            this.errorMessage.set('Ocurrió un error interno del servidor.');
          } else {
            this.errorMessage.set('Credenciales incorrectas o usuario no encontrado.');
          }
        }
      });
    } else {
      this.showError.set(true);
      this.errorMessage.set('Por favor completa todos los campos.');
    }
  }
}
