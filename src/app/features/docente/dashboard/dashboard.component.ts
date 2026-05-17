import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  // Datos mockeados para la vista inicial
  materias = [
    { nrc: '28491', nombre: 'Web Services Architecture', seccion: 'Sec 101', alumnos: 32, estatus: 'ACTIVA', rendimiento: 8.8 },
    { nrc: '31022', nombre: 'Advanced Databases', seccion: 'Sec 202', alumnos: 38, estatus: 'ACTIVA', rendimiento: 9.2 },
    { nrc: '29554', nombre: 'Software Engineering II', seccion: 'Sec 104', alumnos: 35, estatus: 'ACTIVA', rendimiento: 7.5 },
    { nrc: '22310', nombre: 'Mobile Development', seccion: 'Sec 105', alumnos: 37, estatus: 'ACTIVA', rendimiento: 8.1 }
  ];
}
