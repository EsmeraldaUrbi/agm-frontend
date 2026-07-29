import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../core/services/auth.service';

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

  showPasswordModal = signal(false);
  passwordModalStep = signal<1 | 2>(1);
  tempPassword = signal('');
  newPassword = signal('');
  passwordError = signal<string | null>(null);
  isPasswordSubmitting = signal(false);

  showToast = signal(false);
  toastMessage = signal('');

  ngOnInit() {
    const localUser = this.authService.currentUser();

    if (localUser) {
      this.usuario = {
        user_id: localUser.user_id || '',
        nombre_completo: localUser.nombre_completo || 'Usuario',
        email: localUser.email || '',
        rol: localUser.rol || 'Sin rol asignado',
        activo: true
      };
    }

    this.authService.getProfile().subscribe({
      next: (profile: UserProfile) => {
        this.usuario = {
          user_id: profile.user_id || '',
          nombre_completo: profile.nombre_completo || 'Usuario',
          email: profile.email || '',
          rol: profile.rol || 'Sin rol asignado',
          activo: profile.activo ?? true
        };
      },
      error: (err: any) => {
        console.error('Error al obtener perfil:', err);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '';

    const parts = name
      .split(' ')
      .filter(p => p.length > 0 && p.toLowerCase() !== 'dr.' && p.toLowerCase() !== 'mtra.');

    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  openPasswordModal() {
    this.passwordModalStep.set(1);
    this.tempPassword.set('');
    this.newPassword.set('');
    this.passwordError.set(null);
    this.showPasswordModal.set(true);
  }

  closePasswordModal() {
    this.showPasswordModal.set(false);
    setTimeout(() => this.passwordModalStep.set(1), 300);
  }

  requestPasswordChange() {
    const email = this.usuario.email?.trim();

    if (!email || email === 'cargando...') {
      this.passwordError.set('No se pudo identificar el correo del usuario.');
      return;
    }

    this.passwordError.set(null);
    this.isPasswordSubmitting.set(true);

    this.authService.recoverPassword(email).subscribe({
      next: () => {
        this.passwordModalStep.set(2);
        this.isPasswordSubmitting.set(false);
        this.showSuccessToast('Código de recuperación enviado al correo institucional.');
      },
      error: (err: any) => {
        console.error('Error al solicitar recuperación de contraseña:', err);
        this.passwordError.set('No se pudo enviar el código de recuperación. Intente nuevamente.');
        this.isPasswordSubmitting.set(false);
      }
    });
  }

  confirmNewPassword() {
    const token = this.tempPassword().trim();
    const newPassword = this.newPassword();

    if (!token || !newPassword) {
      this.passwordError.set('Ingrese el código temporal y la nueva contraseña.');
      return;
    }

    this.passwordError.set(null);
    this.isPasswordSubmitting.set(true);

    this.authService.resetPassword(token, newPassword).subscribe({
      next: () => {
        this.isPasswordSubmitting.set(false);
        this.closePasswordModal();
        this.showSuccessToast('Contraseña actualizada correctamente.');
      },
      error: (err: any) => {
        console.error('Error al confirmar cambio de contraseña:', err);
        this.passwordError.set('No se pudo actualizar la contraseña. Verifique el código temporal.');
        this.isPasswordSubmitting.set(false);
      }
    });
  }

  private showSuccessToast(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);

    setTimeout(() => {
      this.showToast.set(false);
    }, 4000);
  }
}
