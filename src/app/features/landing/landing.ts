import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgmButtonComponent, AgmCardComponent } from '../../shared/components/ui';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, AgmButtonComponent, AgmCardComponent],
  templateUrl: './landing.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LandingComponent {}
