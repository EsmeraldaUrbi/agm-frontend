import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SidebarComponent implements OnInit {
  menuItems = signal<NavItem[]>([]);
  userRole = signal<string>('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Escuchar el estado de autenticación reactivamente
    const user = this.authService.currentUser();
    const role = user?.role || 'admin'; // Fallback a admin para testing si es necesario
    this.userRole.set(role);
    this.generateMenu(role);
  }

  generateMenu(role: string) {
    const adminItems: NavItem[] = [
      { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
      { label: 'Directorios', route: '/admin/usuarios', icon: 'supervisor_account' },
      { label: 'Periodos', route: '/admin/periodos', icon: 'calendar_month' },
      { label: 'Mi Perfil', route: '/profile', icon: 'person' }
    ];

    const docenteItems: NavItem[] = [
      { label: 'Dashboard', route: '/docente/dashboard', icon: 'dashboard' }
    ];

    const alumnoItems: NavItem[] = [
      { label: 'Dashboard', route: '/alumno/dashboard', icon: 'dashboard' }
    ];

    if (role === 'admin') {
      this.menuItems.set(adminItems);
    } else if (role === 'docente') {
      this.menuItems.set(docenteItems);
    } else if (role === 'alumno') {
      this.menuItems.set(alumnoItems);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
