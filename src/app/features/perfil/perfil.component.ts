import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../core/services/auth.service';

interface PeriodoAcademico {
  id: string;
  nombre: string;
  materias: { nrc: string; nombre: string; rol: string }[];
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);

  usuario: UserProfile = {
    user_id: '',
    nombre_completo: 'Cargando...',
    email: 'cargando...',
    rol: 'Cargando...',
    activo: true
  };

  periodosMock: PeriodoAcademico[] = [
    {
      id: 'p-actual',
      nombre: 'Primavera 2026',
      materias: [
        { nrc: '15842', nombre: 'Web Services Architecture', rol: 'Docente Titular' },
        { nrc: '28491', nombre: 'Sistemas Distribuidos', rol: 'Docente Titular' },
        { nrc: '31022', nombre: 'Advanced Databases', rol: 'Docente Titular' },
        { nrc: '22310', nombre: 'Mobile Development', rol: 'Docente Titular' }
      ]
    },
    {
      id: 'p-prev',
      nombre: 'Otoño 2025',
      materias: [
        { nrc: '12411', nombre: 'Sistemas Distribuidos', rol: 'Docente Titular' },
        { nrc: '13552', nombre: 'Seguridad Informática', rol: 'Docente Adjunto' }
      ]
    }
  ];

  selectedPeriodoId = signal<string>(this.periodosMock[0].id);

  get currentPeriodoData() {
    return this.periodosMock.find(p => p.id === this.selectedPeriodoId()) || this.periodosMock[0];
  }

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.usuario = profile;
      },
      error: (err) => {
        console.error('Error al obtener perfil:', err);
        // Fallback en caso de error o desarrollo local sin backend
        const localUser = this.authService.currentUser();
        if (localUser) {
          this.usuario = {
            user_id: localUser.user_id,
            nombre_completo: 'Usuario Local (Offline)',
            email: localUser.email,
            rol: localUser.rol,
            activo: true
          };
        }
      }
    });
  }

  // Modal y Toasts
  showPasswordModal = signal(false);
  showToast = signal(false);
  toastMessage = signal('');

  // Helper para generar iniciales
  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ').filter(p => p.length > 0 && p.toLowerCase() !== 'dr.' && p.toLowerCase() !== 'mtra.');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  requestPasswordChange() {
    // Simulamos la llamada a authService.recoverPassword
    this.showPasswordModal.set(false);
    this.toastMessage.set('Se ha enviado un enlace de recuperación a tu correo institucional.');
    this.showToast.set(true);
    
    setTimeout(() => {
      this.showToast.set(false);
    }, 4000);
  }
}
