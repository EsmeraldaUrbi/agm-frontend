import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgmButtonComponent, AgmCardComponent } from '../../shared/components/ui';
import { BRANDING } from '../../core/config/branding.config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, AgmButtonComponent, AgmCardComponent],
  templateUrl: './landing.html',
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
}

