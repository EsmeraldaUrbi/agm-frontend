import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  // Datos mockeados para la vista inicial
  materias = [
    { nrc: '28491', nombre: 'Web Services Architecture', seccion: 'Sec 101', alumnos: 32, estatus: 'ACTIVA', rendimiento: 8.8, asistencia: 85, asistenciaSemanal: [95, 90, 85, 100, 95] },
    { nrc: '31022', nombre: 'Advanced Databases', seccion: 'Sec 202', alumnos: 38, estatus: 'ACTIVA', rendimiento: 9.2, asistencia: 92, asistenciaSemanal: [100, 95, 100, 90, 95] },
    { nrc: '29554', nombre: 'Software Engineering II', seccion: 'Sec 104', alumnos: 35, estatus: 'ACTIVA', rendimiento: 7.5, asistencia: 78, asistenciaSemanal: [85, 80, 75, 80, 70] },
    { nrc: '22310', nombre: 'Mobile Development', seccion: 'Sec 105', alumnos: 37, estatus: 'ACTIVA', rendimiento: 8.1, asistencia: 88, asistenciaSemanal: [90, 95, 85, 90, 85] }
  ];

  selectedMateriaNrc = this.materias[0].nrc;

  get selectedMateria() {
    return this.materias.find(m => m.nrc === this.selectedMateriaNrc) || this.materias[0];
  }

  get asisLinePath(): string {
    const data = this.selectedMateria.asistenciaSemanal;
    if (!data || data.length === 0) return '';
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - val;
      return `${x},${y}`;
    });
    return `M${points.join(' L')}`;
  }

  get asisAreaPath(): string {
    const data = this.selectedMateria.asistenciaSemanal;
    if (!data || data.length === 0) return '';
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - val;
      return `${x},${y}`;
    });
    return `M0,100 L${points.join(' L')} L100,100 Z`;
  }
}
