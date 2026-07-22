import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AgmButtonComponent, AgmInputComponent, AgmCardComponent } from '../../../shared/components/ui';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AgmButtonComponent,
    AgmInputComponent,
    AgmCardComponent
  ],
  templateUrl: './recover-password.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class RecoverPasswordComponent implements OnInit {
  email = '';
  tempPassword = '';
  newPassword = '';
  isSubmitted = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  isResetting = signal<boolean>(false);
  resetSuccess = signal<boolean>(false);
  showError = signal<boolean>(false);
  errorMessage = signal<string>('El correo ingresado no es válido o no está registrado.');

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['step'] === '2') {
        this.isSubmitted.set(true);
      }
    });
  }

  onSubmit() {
    this.showError.set(false);
    
    // Validar formato de correo institucional BUAP
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage.set('Por favor, ingresa un correo electrónico válido.');
      this.showError.set(true);
      return;
    }

    this.isLoading.set(true);
    
    // Llamar al API real
    this.authService.recoverPassword(this.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSubmitted.set(true);
        this.showError.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Ocurrió un error al procesar tu solicitud. Intenta nuevamente.');
        this.showError.set(true);
      }
    });
  }

  onResetPassword() {
    this.showError.set(false);
    
    if (!this.tempPassword || !this.newPassword) {
      this.errorMessage.set('Por favor, completa ambos campos de contraseña.');
      this.showError.set(true);
      return;
    }

    this.isResetting.set(true);
    
    this.authService.resetPassword(this.tempPassword, this.newPassword).subscribe({
      next: () => {
        this.isResetting.set(false);
        this.resetSuccess.set(true);
        this.showError.set(false);
      },
      error: () => {
        this.isResetting.set(false);
        this.errorMessage.set('El token de recuperación es inválido o ha expirado.');
        this.showError.set(true);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
