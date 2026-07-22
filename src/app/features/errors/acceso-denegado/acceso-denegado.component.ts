import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './acceso-denegado.component.html',
  styles: [`
    :host {
      display: block;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.95); opacity: 0.5; }
      50% { transform: scale(1.05); opacity: 0.8; }
      100% { transform: scale(0.95); opacity: 0.5; }
    }
    .animate-float {
      animation: float 4s ease-in-out infinite;
    }
    .animate-ring {
      animation: pulse-ring 3s ease-in-out infinite;
    }
  `]
})
export class AccesoDenegadoComponent {
  constructor(private authService: AuthService, private router: Router) {}

  goBack(): void {
    // Redirigir según el rol del usuario si está autenticado, sino al login/landing
    const user = this.authService.currentUser();
    if (user) {
      const rolStr = user.rol.toLowerCase();
      const basePath = (rolStr === 'administrador' || rolStr === 'admin') ? 'admin' : rolStr;
      this.router.navigate([`/${basePath}/dashboard`]);
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
