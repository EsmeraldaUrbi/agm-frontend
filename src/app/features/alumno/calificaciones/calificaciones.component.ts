import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SolicitarBajaComponent } from '../solicitar-baja/solicitar-baja.component';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, SolicitarBajaComponent],
  templateUrl: './calificaciones.component.html',
  styles: ``
})
export class CalificacionesComponent {
  mostrarBajaModal = false;

  abrirBaja() {
    this.mostrarBajaModal = true;
  }

  cerrarBaja() {
    this.mostrarBajaModal = false;
  }
}
