import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

interface AlumnoRendimiento {
  matricula: string;
  nombre: string;
  promedioActual: number;
  promedioFinal: number;
  asistencia: number;
  estatus: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent {
  materia = {
    nrc: '28491',
    nombre: 'Web Services Architecture',
    seccion: '101',
    horario: 'Lunes, Miércoles 16:00 - 18:00',
    programa: 'Postgrado en Computación',
    periodo: 'Primavera 2026',
  };

  tabs = ['Alumnos', 'Ponderaciones', 'Actividades', 'Asistencias', 'Reportes'];

  alumnos = signal<AlumnoRendimiento[]>([
    { matricula: '202012345', nombre: 'Diego Cannata', promedioActual: 9.4, promedioFinal: 9.5, asistencia: 96, estatus: 'Aprobado Excelente' },
    { matricula: '202015678', nombre: 'Alejandro Garcia', promedioActual: 6.8, promedioFinal: 7.0, asistencia: 82, estatus: 'Riesgo Moderado' },
    { matricula: '202019921', nombre: 'Maria Rodriguez Ortiz', promedioActual: 9.1, promedioFinal: 9.2, asistencia: 100, estatus: 'Aprobado Excelente' },
    { matricula: '202113342', nombre: 'Ana Beltrán López', promedioActual: 8.5, promedioFinal: 8.6, asistencia: 90, estatus: 'Aprobado Buen Nivel' },
  ]);

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.materia.nrc = id;
      }
    });
  }

  // Estado de descarga simulada
  descargando = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  descargarReporte(tipo: string, formato: string) {
    this.descargando.set(`${tipo} (${formato})`);
    this.mensajeExito.set(null);

    setTimeout(() => {
      this.descargando.set(null);
      this.mensajeExito.set(`¡El reporte "${tipo}" en formato ${formato.toUpperCase()} se ha generado y descargado exitosamente vía MS-Reportes!`);
      
      setTimeout(() => {
        this.mensajeExito.set(null);
      }, 5000);
    }, 2500);
  }
}
