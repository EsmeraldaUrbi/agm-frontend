import { Component, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-solicitar-baja',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './solicitar-baja.component.html',
  styles: ``
})
export class SolicitarBajaComponent {
  @Output() cerrar = new EventEmitter<void>();

  cancelar() {
    this.cerrar.emit();
  }

  confirmarBaja() {
    // Lógica para enviar la baja
    this.cerrar.emit();
  }
}
