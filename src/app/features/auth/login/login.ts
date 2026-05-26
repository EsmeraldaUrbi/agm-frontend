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
  templateUrl: './login.html',
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
  protected readonly logo = BRANDING.logoSecondary; 
  protected readonly isLogoImage = BRANDING.isLogoSecondaryImage;

  protected readonly footerLogo = BRANDING.logoSecondary;
  protected readonly isFooterLogoImage = BRANDING.isLogoSecondaryImage;

  // Signals para el formulario
  email = '';
  password = '';
  selectedRole = signal<'admin' | 'docente' | 'alumno'>('admin');

  showError = signal(false);
  showPassword = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  selectRole(role: 'admin' | 'docente' | 'alumno') {
    this.selectedRole.set(role);
    this.showError.set(false);
  }

  onLogin() {
    // Simulamos una validación simple
    if (this.email && this.password) {
      this.authService.login(this.email, this.password, this.selectedRole()).subscribe({
        next: (res) => {
          const role = res.user.rol.toLowerCase();
          if (role === 'administrador' || role === 'admin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'docente') {
            this.router.navigate(['/docente/dashboard']);
          } else if (role === 'alumno') {
            this.router.navigate(['/alumno/dashboard']);
          } else {
            this.router.navigate(['/perfil']);
          }
        },
        error: (err) => {
          console.error('Error en login:', err);
          this.showError.set(true);
        }
      });
    } else {
      this.showError.set(true);
    }
  }
}
