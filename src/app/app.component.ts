import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { BRANDING } from './core/config/branding.config';
import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  protected readonly title = signal(BRANDING.shortName);
  private titleService = inject(Title);
  private authService = inject(AuthService);
  private router = inject(Router);
  protected loadingService = inject(LoadingService);

  ngOnInit() {
    this.titleService.setTitle(`${BRANDING.shortName} - ${BRANDING.fullName}`);
    this.setupHistoryCacheCheck();
  }

  private setupHistoryCacheCheck() {
    window.addEventListener('pageshow', (event) => {
      // Si la página se recupera de la caché del historial (botón atrás/adelante)
      if (event.persisted) {
        // Verificar si la sesión ya no es válida localmente
        if (!this.authService.isAuthenticated()) {
          const currentUrl = this.router.url;
          if (currentUrl !== '/' && !currentUrl.startsWith('/login') && !currentUrl.startsWith('/forgot-password') && !currentUrl.startsWith('/reset-password')) {
            // Forzar una recarga limpia para que el AuthGuard intercepte y mande a login
            window.location.reload();
          }
        }
      }
    });
  }
}

