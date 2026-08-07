import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { BRANDING } from '../../../core/config/branding.config';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  section?: string;  // separador de sección opcional
}


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SidebarComponent implements OnInit {
  protected readonly BRANDING = BRANDING;

  // --- CONFIGURACIÓN DE LOGOS ---
  // Puedes cambiar estos valores por BRANDING.logoSecondary y BRANDING.isLogoSecondaryImage si lo deseas
  protected readonly logo = BRANDING.logoSecondary;
  protected readonly isLogoImage = BRANDING.isLogoSecondaryImage;

  menuItems = signal<NavItem[]>([]);
  userRole = signal<string>('');

  layoutService = inject(LayoutService);

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  closeSidebar() {
    this.layoutService.closeSidebar();
  }

  ngOnInit() {
    // Escuchar el estado de autenticación reactivamente
    const user = this.authService.currentUser();
    const role = user?.rol?.toLowerCase();

    if (!role) {
      this.userRole.set('');
      this.menuItems.set([]);
      return;
    }

    this.userRole.set(role);
    this.generateMenu(role);
  }

  generateMenu(role: string) {
    const adminItems: NavItem[] = [
      // ── Principal ──────────────────────────────────────────
      { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard', section: 'Principal' },
      { label: 'Directorio Docentes', route: '/admin/usuarios', icon: 'supervisor_account' },
      { label: 'Directorio Materias', route: '/admin/materias', icon: 'menu_book' },
      { label: 'Periodos', route: '/admin/periodos', icon: 'calendar_month' },
      // ── Gestión de Datos ───────────────────────────────────
      { label: 'Importar Materias', route: '/admin/importar-materias', icon: 'upload_file', section: 'Gestión de Datos' },
      { label: 'Importar Docentes', route: '/admin/importar-docentes', icon: 'group_add' },
      { label: 'Planes de Estudio', route: '/admin/planes-estudio', icon: 'auto_stories' },
      // ── Cuenta ─────────────────────────────────────────────
      { label: 'Mi Perfil', route: '/profile', icon: 'person', section: 'Cuenta' },
    ];

    const docenteItems: NavItem[] = [
      // ── Principal ──────────────────────────────────────────
      { label: 'Dashboard', route: '/docente/dashboard', icon: 'dashboard', section: 'Principal' },
      { label: 'Mis Cursos', route: '/docente/mis-cursos', icon: 'school' },
      // ── Asistencias ────────────────────────────────────────
      { label: 'Pase de Lista (QR)', route: '/docente/pase-lista', icon: 'qr_code_scanner', section: 'Asistencias' },
      { label: 'Historial', route: '/docente/historial-asistencias', icon: 'calendar_month' },
      
      // ── Reportes ───────────────────────────────────────────
      { label: 'Reportes y estadísticas', route: '/docente/reportes', icon: 'analytics', section: 'Reportes' },

      // ── Cuenta ─────────────────────────────────────────────
      { label: 'Mi Perfil', route: '/profile', icon: 'person', section: 'Cuenta' },
    ];

    const alumnoItems: NavItem[] = [
      { label: 'Dashboard', route: '/alumno/dashboard', icon: 'dashboard', section: 'Principal' },
      { label: 'Mis Materias', route: '/alumno/materias', icon: 'menu_book' },
      { label: 'Generar QR', route: '/alumno/qr', icon: 'qr_code_scanner', section: 'Asistencia' },
      { label: 'Mi Perfil', route: '/profile', icon: 'person', section: 'Cuenta' }
    ];

    if (role === 'admin') {
      this.menuItems.set(adminItems);
    } else if (role === 'docente') {
      this.menuItems.set(docenteItems);
    } else if (role === 'alumno') {
      this.menuItems.set(alumnoItems);
    } else {
      this.menuItems.set([]);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
