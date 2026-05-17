import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sesion-expirada',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sesion-expirada.html',
  styles: [`
    :host {
      display: block;
    }
    @keyframes rotate-clock {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.95); opacity: 0.5; }
      50% { transform: scale(1.05); opacity: 0.8; }
      100% { transform: scale(0.95); opacity: 0.5; }
    }
    .animate-spin-slow {
      animation: rotate-clock 8s linear infinite;
    }
    .animate-ring {
      animation: pulse-ring 3s ease-in-out infinite;
    }
  `]
})
export class SesionExpiradaComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Asegurarse de limpiar la sesión al entrar a esta página
    this.authService.logout();
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
