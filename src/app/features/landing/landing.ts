import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.html',
  styles: [`
    .hero-gradient {
      background: linear-gradient(135deg, #003B5C 0%, #00253B 100%);
    }
  `]
})
export class LandingComponent {}
