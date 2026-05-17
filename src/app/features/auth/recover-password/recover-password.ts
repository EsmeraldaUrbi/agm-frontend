import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
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
  templateUrl: './recover-password.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class RecoverPasswordComponent {
  email = '';
  isSubmitted = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  showError = signal<boolean>(false);
  errorMessage = signal<string>('El correo ingresado no es válido o no está registrado.');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.showError.set(false);
    
    // Validar formato de correo institucional BUAP
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage.set('Por favor, ingresa un correo electrónico válido.');
      this.showError.set(true);
      return;
    }

    this.isLoading.set(true);
    
    // Simular retraso de red
    setTimeout(() => {
      const success = this.authService.recoverPassword(this.email);
      this.isLoading.set(false);
      
      if (success) {
        this.isSubmitted.set(true);
      } else {
        this.showError.set(true);
      }
    }, 1500);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
