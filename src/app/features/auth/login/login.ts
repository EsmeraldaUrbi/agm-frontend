import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styles: [`
    .login-gradient {
        background: linear-gradient(135deg, #003B5C 0%, #00253B 100%);
    }
  `]
})
export class LoginComponent {
  // Signals para el formulario
  email = '';
  password = '';
  selectedRole = signal<'admin' | 'docente' | 'alumno'>('admin');
  showError = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  selectRole(role: 'admin' | 'docente' | 'alumno') {
    this.selectedRole.set(role);
    this.showError.set(false);
  }

  onLogin() {
    // Simulamos una validación simple
    if (this.email && this.password) {
      const success = this.authService.login(this.email, this.password, this.selectedRole());
      if (success) {
        const role = this.selectedRole();
        if (role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'docente') {
          this.router.navigate(['/docente/dashboard']);
        } else if (role === 'alumno') {
          this.router.navigate(['/alumno/dashboard']);
        }
      }
    } else {
      this.showError.set(true);
    }
  }
}
