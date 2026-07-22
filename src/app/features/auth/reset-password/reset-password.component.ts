import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AgmButtonComponent, AgmInputComponent, AgmCardComponent } from '../../../shared/components/ui';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AgmButtonComponent,
    AgmInputComponent,
    AgmCardComponent
  ],
  templateUrl: './reset-password.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ResetPasswordComponent {
  password = '';
  confirmPassword = '';
  isSubmitted = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  showError = signal<boolean>(false);
  errorMessage = signal<string>('Ocurrió un error al intentar restablecer su contraseña.');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.showError.set(false);

    // Validar campos vacíos
    if (!this.password || !this.confirmPassword) {
      this.errorMessage.set('Por favor, completa todos los campos.');
      this.showError.set(true);
      return;
    }

    // Validar longitud mínima
    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      this.showError.set(true);
      return;
    }

    // Validar coincidencia
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas ingresadas no coinciden.');
      this.showError.set(true);
      return;
    }

    this.isLoading.set(true);

    // Llamar al API real
    this.authService.resetPassword(this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Ocurrió un error. El token puede haber expirado.');
        this.showError.set(true);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
