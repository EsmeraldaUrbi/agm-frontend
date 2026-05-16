import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'agm-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [ngClass]="[
        'relative bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden transition-all duration-300',
        hoverable ? 'hover:shadow-xl hover:-translate-y-1 hover:border-primary/20' : '',
        customClass
      ]"
    >
      <!-- Optional Accent Bar (Left or Top) -->
      <div *ngIf="accent" [ngClass]="[
        'absolute bg-primary',
        accentPosition === 'left' ? 'left-0 top-0 bottom-0 w-1.5' : 'left-0 right-0 top-0 h-1.5'
      ]"></div>

      <!-- Header -->
      <div *ngIf="title || hasHeader" class="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
        <div>
          <h3 *ngIf="title" class="text-lg font-bold text-on-surface leading-tight">{{ title }}</h3>
          <p *ngIf="subtitle" class="text-sm text-on-surface-variant mt-0.5">{{ subtitle }}</p>
        </div>
        <div class="flex items-center gap-2">
          <ng-content select="[headerAction]"></ng-content>
        </div>
      </div>

      <!-- Body -->
      <div [ngClass]="['px-6 py-5', bodyClass]">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      <div *ngIf="hasFooter" class="px-6 py-4 bg-surface-container-lowest/50 border-t border-outline-variant/10">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AgmCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() hoverable = false;
  @Input() accent = false;
  @Input() accentPosition: 'left' | 'top' = 'left';
  @Input() customClass = '';
  @Input() bodyClass = '';

  // Helper inputs to check for content presence if needed, 
  // though typically we use select in ng-content.
  @Input() hasHeader = false;
  @Input() hasFooter = false;
}
