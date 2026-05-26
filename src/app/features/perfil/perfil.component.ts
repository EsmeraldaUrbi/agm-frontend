import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../core/services/auth.service';

interface PeriodoAcademico {
  id: string;
  nombre: string;
  materias: { nrc: string; nombre: string; aprobacion: number }[];
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

  periodosMock: PeriodoAcademico[] = [];

  selectedPeriodoId = signal<string>('');

  get currentPeriodoData() {
    return this.periodosMock.find(p => p.id === this.selectedPeriodoId()) || null;
  }

  ngOnInit() {
    // 1. Set local user immediately so UI doesn't get stuck on "Cargando..."
    const localUser = this.authService.currentUser();
    if (localUser) {
      this.usuario = {
        user_id: localUser.user_id,
        nombre_completo: localUser.nombre_completo || 'Usuario',
        email: localUser.email,
        rol: localUser.rol || 'DOCENTE',
        activo: true
      };
    }

    // 2. Fetch real data if backend is available
    this.authService.getProfile().subscribe({
      next: (profile: UserProfile) => {
        this.usuario = profile;
      },
      error: (err: any) => {
        console.error('Error al obtener perfil:', err);
      }
    });
  }

  // Modal y Toasts
  showPasswordModal = signal(false);
  passwordModalStep = signal<1 | 2>(1);
  tempPassword = signal('');
  newPassword = signal('');

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

  openPasswordModal() {
    this.passwordModalStep.set(1);
    this.tempPassword.set('');
    this.newPassword.set('');
    this.showPasswordModal.set(true);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
    setTimeout(() => this.passwordModalStep.set(1), 300); // Reset after animation
  }

  requestPasswordChange() {
    // Simulamos que se envió el correo con éxito y avanzamos al Paso 2
    this.passwordModalStep.set(2);
  }

  confirmNewPassword() {
    // Validamos que los campos no estén vacíos
    if (!this.tempPassword() || !this.newPassword()) {
      return;
    }

    // Simulamos la confirmación del cambio
    this.closePasswordModal();
    this.toastMessage.set('Contraseña actualizada correctamente.');
    this.showToast.set(true);
    
    setTimeout(() => {
      this.showToast.set(false);
    }, 4000);
  }
}
