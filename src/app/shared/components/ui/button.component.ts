import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'agm-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [ngClass]="[
        'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden',
        getVariantClasses(),
        getSizeClasses(),
        customClass
      ]"
      (click)="handleClick($event)"
    >
      <!-- Loading Spinner -->
      <div *ngIf="loading" class="absolute inset-0 flex items-center justify-center bg-inherit">
        <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Button Content -->
      <div [class.opacity-0]="loading" class="flex items-center gap-2">
        <ng-content select="[iconLeft]"></ng-content>
        <ng-content></ng-content>
        <ng-content select="[iconRight]"></ng-content>
      </div>

      <!-- Glossy/Glass effect overlay on hover -->
      <div class="absolute inset-0 w-full h-full pointer-events-none bg-gradient-to-tr from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class AgmButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() customClass = '';

  @Output() agmClick = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent) {
    if (!this.disabled && !this.loading) {
      this.agmClick.emit(event);
    }
  }

  getVariantClasses(): string {
    const variants = {
      primary: 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-md hover:shadow-lg',
      secondary: 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container shadow-sm',
      outline: 'bg-transparent border-2 border-outline text-primary hover:bg-surface-container-low',
      ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container',
      error: 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container shadow-md'
    };
    return variants[this.variant] || variants.primary;
  }

  getSizeClasses(): string {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-5 py-2.5 text-base rounded-xl',
      lg: 'px-8 py-3.5 text-lg rounded-2xl'
    };
    return sizes[this.size] || sizes.md;
  }
}
