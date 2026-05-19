import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-error-404',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './error-404.html',
  styles: [`
    :host {
      display: block;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-12px) scale(1.02); }
    }
    @keyframes pulse-soft {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 0.4; }
    }
    .animate-float {
      animation: float 5s ease-in-out infinite;
    }
    .animate-pulse-soft {
      animation: pulse-soft 4s ease-in-out infinite;
    }
  `]
})
export class Error404Component {
  constructor(private authService: AuthService, private router: Router) {}

  goHome(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.router.navigate([`/${user.rol}/dashboard`]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
