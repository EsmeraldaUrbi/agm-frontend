import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AgmButtonComponent, AgmCardComponent } from '../../shared/components/ui';
import { BRANDING } from '../../core/config/branding.config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, AgmButtonComponent, AgmCardComponent],
  templateUrl: './landing.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LandingComponent {
  protected readonly BRANDING = BRANDING;

  // --- CONFIGURACIÓN DE LOGOS ---
  // Puedes cambiar estos valores por BRANDING.logo o BRANDING.logoSecondary si deseas intercambiarlos
  
  // Logo para la barra de navegación superior (Light background)
  protected readonly navLogo = BRANDING.logo;
  protected readonly isNavLogoImage = BRANDING.isLogoImage;

  // Logo para la sección del banner inferior (Dark background)
  protected readonly calloutLogo = BRANDING.logoWhite;
  protected readonly isCalloutLogoImage = BRANDING.isLogoWhiteImage;

  showAuthFlowModal = signal<boolean>(false);

  constructor(private router: Router) {}

  openAuthFlow() {
    this.showAuthFlowModal.set(true);
  }

  closeAuthFlow() {
    this.showAuthFlowModal.set(false);
  }

  navigateToLogin() {
    this.closeAuthFlow();
    this.router.navigate(['/login']);
  }

  navigateToRecover() {
    this.closeAuthFlow();
    this.router.navigate(['/forgot-password'], { queryParams: { step: '2' } });
  }
}
