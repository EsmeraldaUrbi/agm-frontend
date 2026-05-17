import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-registro-calificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './registro-calificaciones.component.html'
})
export class RegistroCalificacionesComponent {
  alumnos = [
    { id: 1, matricula: '202012345', nombre: 'Juan Pérez Garcia', t1: 8.5, t2: 9.0, e1: 7.5, promedioReal: 8.33, promedioRedondeado: 8, aprobado: true },
    { id: 2, matricula: '202015678', nombre: 'Maria Rodriguez Ortiz', t1: 10.0, t2: 9.5, e1: 9.0, promedioReal: 9.50, promedioRedondeado: 10, aprobado: true },
    { id: 3, matricula: '202019921', nombre: 'Carlos Sánchez Ruiz', t1: 5.0, t2: 6.0, e1: 5.5, promedioReal: 5.50, promedioRedondeado: 6, aprobado: false },
    { id: 4, matricula: '202113342', nombre: 'Ana Beltrán López', t1: 8.0, t2: 7.5, e1: 8.5, promedioReal: 8.00, promedioRedondeado: 8, aprobado: true },
  ];
}
