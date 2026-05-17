import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styles: ``
})
export class EmptyStateComponent {
  @Input() iconName: string = '';
  @Input() imageSrc: string = '';
  @Input() imageAlt: string = '';
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() actionText: string = '';
  @Input() actionIcon: string = '';
  @Input() actionType: 'primary' | 'secondary' = 'primary';
  
  @Output() actionClick = new EventEmitter<void>();

  onAction() {
    this.actionClick.emit();
  }
}
