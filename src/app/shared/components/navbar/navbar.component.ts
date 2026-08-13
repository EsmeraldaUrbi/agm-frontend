import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { BRANDING } from '../../../core/config/branding.config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NavbarComponent implements OnInit {
  protected readonly BRANDING = BRANDING;
  userName = signal<string>('Usuario');

  userEmail = signal<string>('');
  userRole = signal<string>('');
  userInitials = signal<string>('U');
  
  // Computada para dar un formato elegante al rol
  roleLabel = computed(() => {
    const role = this.userRole().toLowerCase();
    if (role === 'admin' || role === 'administrador') return 'Administrador Global';
    if (role === 'docente') return 'Docente';
    if (role === 'alumno') return 'Alumno';
    return 'Usuario Institucional';
  });

  private layoutService = inject(LayoutService);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.userName.set(user.nombre_completo || 'Usuario');
      this.userEmail.set(user.email || '');
      this.userRole.set(user.rol || '');
      
      // Generar iniciales del nombre
      const nameParts = (user.nombre_completo || 'Usuario').split(' ');
      const initials = nameParts.map((p: string) => p[0]).join('').substring(0, 2).toUpperCase();
      this.userInitials.set(initials || 'U');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/'], { replaceUrl: true });
  }
}
