import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HorarioComponent } from '../horario/horario.component';
import { SolicitarBajaComponent } from '../solicitar-baja/solicitar-baja.component';

@Component({
  selector: 'app-mis-materias',
  standalone: true,
  imports: [CommonModule, RouterModule, HorarioComponent, SolicitarBajaComponent],
  templateUrl: './mis-materias.component.html',
  styleUrl: './mis-materias.component.css'
})
export class MisMateriasComponent {
  mostrarHorarioModal = false;
  mostrarBajaModal = false;

  materias = [
    { nrc: '24589', nombre: 'Arquitectura de Software', docente: 'Dr. Javier Ruiz Esparza', promedio: 9.8, creditos: 6 },
    { nrc: '24601', nombre: 'Sistemas Operativos', docente: 'M.C. Laura Torres', promedio: 8.5, creditos: 6 },
    { nrc: '24712', nombre: 'Inteligencia Artificial', docente: 'Dr. Roberto Mendoza', promedio: 9.2, creditos: 5 },
    { nrc: '24855', nombre: 'Base de Datos II', docente: 'Mtra. Elena Gómez', promedio: 7.4, creditos: 5 },
  ];

  abrirHorario() {
    this.mostrarHorarioModal = true;
  }

  cerrarHorario() {
    this.mostrarHorarioModal = false;
  }

  abrirBaja() {
    this.mostrarBajaModal = true;
  }

  cerrarBaja() {
    this.mostrarBajaModal = false;
  }
}
