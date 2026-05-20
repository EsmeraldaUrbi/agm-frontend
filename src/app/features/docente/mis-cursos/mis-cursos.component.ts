import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Curso {
  nrc: string;
  seccion: string;
  nombre: string;
  alumnos: number;
  progreso: number;
  progresoColor: string;
  estado: string;
}

@Component({
  selector: 'app-mis-cursos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-cursos.component.html'
})
export class MisCursosComponent {
  cursos: Curso[] = [
    { nrc: '15842', seccion: '101', nombre: 'Arquitectura de Servicios Web', alumnos: 34, progreso: 65, progresoColor: 'bg-[#42d0fe]', estado: 'ACTIVA' },
    { nrc: '15845', seccion: '102', nombre: 'Ingeniería de Software II', alumnos: 28, progreso: 100, progresoColor: 'bg-[#fcb882]', estado: 'CERRADA' },
    { nrc: '16021', seccion: '101', nombre: 'Programación Paralela', alumnos: 22, progreso: 12, progresoColor: 'bg-[#ba1a1a]', estado: 'ACTIVA' },
    { nrc: '16110', seccion: '104', nombre: 'Seguridad de la Información', alumnos: 40, progreso: 45, progresoColor: 'bg-[#42d0fe]', estado: 'ACTIVA' },
  ];

  get totalAlumnos(): number {
    return this.cursos.reduce((sum, c) => sum + c.alumnos, 0);
  }
}
