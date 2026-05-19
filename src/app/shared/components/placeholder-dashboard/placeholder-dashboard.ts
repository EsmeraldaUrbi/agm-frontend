import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AgmCardComponent } from '../ui/card';
import { AgmButtonComponent } from '../ui/button';

@Component({
  selector: 'app-placeholder-dashboard',
  standalone: true,
  imports: [CommonModule, AgmCardComponent, AgmButtonComponent],
  template: `
    <div class="max-w-4xl mx-auto py-12 px-4">
      <agm-card 
        [title]="'Módulo en Desarrollo'" 
        [subtitle]="'Sección en construcción por el equipo de desarrollo'"
        [accent]="true"
        [accentPosition]="'top'"
        [hoverable]="false"
        customClass="shadow-lg border-primary/10 bg-white"
        bodyClass="flex flex-col items-center text-center p-12"
      >
        <!-- Animated Icon Container -->
        <div class="w-24 h-24 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary-container mb-8 relative animate-pulse-slow">
          <span class="material-symbols-outlined text-5xl">construction</span>
          <div class="absolute inset-0 rounded-full border-4 border-primary-container/20 animate-ping"></div>
        </div>

        <h2 class="text-2xl font-black text-primary-container mb-4">
          Portal de {{ roleLabel }}
        </h2>
        
        <p class="text-on-surface-variant max-w-lg mb-8 leading-relaxed">
          Esta vista está reservada para el **Portal de {{ roleLabel }}** y se encuentra actualmente en desarrollo activo por tus compañeros de equipo (**Integrantes 2 y 3**). 
          La infraestructura de navegación y el control de accesos protegidos ya están completamente operativos.
        </p>

        <!-- Information Bento Box -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl text-left mb-10">
          <div class="p-4 rounded-xl bg-surface-container border border-outline-variant/10 flex items-start gap-3">
            <span class="material-symbols-outlined text-primary text-xl">shield_person</span>
            <div>
              <h4 class="text-xs font-bold text-primary uppercase tracking-wider">Tu Rol Activo</h4>
              <p class="text-sm font-semibold text-on-surface">{{ roleLabel }} (Sesión Mock)</p>
            </div>
          </div>
          <div class="p-4 rounded-xl bg-surface-container border border-outline-variant/10 flex items-start gap-3">
            <span class="material-symbols-outlined text-primary text-xl">link</span>
            <div>
              <h4 class="text-xs font-bold text-primary uppercase tracking-wider">Ruta Protegida</h4>
              <p class="text-sm font-semibold text-on-surface">{{ currentUrl }}</p>
            </div>
          </div>
        </div>

        <div class="flex gap-4">
          <agm-button (agmClick)="goBack()" variant="outline">
            <span iconLeft class="material-symbols-outlined text-lg">arrow_back</span>
            Volver
          </agm-button>
          <agm-button (agmClick)="logout()">
            Cerrar Sesión
            <span iconRight class="material-symbols-outlined text-lg">logout</span>
          </agm-button>
        </div>
      </agm-card>
    </div>
  `,
  styles: [`
    @keyframes pulseSlow {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .animate-pulse-slow {
      animation: pulseSlow 3s infinite ease-in-out;
    }
  `]
})
export class PlaceholderDashboardComponent implements OnInit {
  roleLabel = '';
  currentUrl = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUrl = this.router.url;
    const user = this.authService.currentUser();
    const role = user?.rol?.toLowerCase() || 'usuario';
    
    if (role === 'docente') {
      this.roleLabel = 'Docentes';
    } else if (role === 'alumno') {
      this.roleLabel = 'Alumnos';
    } else {
      this.roleLabel = 'Administradores';
    }
  }

  goBack() {
    window.history.back();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
