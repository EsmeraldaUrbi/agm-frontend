import { Component, Output, EventEmitter, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-solicitar-baja',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './solicitar-baja.component.html',
  styles: ``
})
export class SolicitarBajaComponent {
  @Input() nombreMateria = '';
  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();

  confirmText = '';

  cancelar() {
    this.cerrar.emit();
  }

  confirmarBaja() {
    if (this.confirmText === 'CONFIRMAR') {
      this.confirmar.emit();
    }
  }
}
