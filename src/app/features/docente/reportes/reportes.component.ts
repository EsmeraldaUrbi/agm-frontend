import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface AlumnoRendimiento {
  matricula: string;
  nombre: string;
  promedioPonderadoReal: number;
  promedioRedondeadoOficial: number;
  asistencia: number;
  estatus: string;
}

interface MateriaActiva {
  nrc: string;
  nombre: string;
  seccion: string;
  horario: string;
  programa: string;
  periodo: string;
  promedioGeneral: string;
  tasaAprobacion: string;
  alumnosRiesgo: string;
  asistenciaPromedio: string;
  alumnos: AlumnoRendimiento[];
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent {
  // Lista de materias asignadas en el periodo activo para seleccionar dinámicamente
  listaMateriasDisponibles: MateriaActiva[] = [
    {
      nrc: '15842',
      nombre: 'Web Services Architecture',
      seccion: '101',
      horario: 'Lunes, Miércoles 16:00 - 18:00',
      programa: 'Postgrado en Computación',
      periodo: 'Primavera 2026',
      promedioGeneral: '8.4',
      tasaAprobacion: '75%',
      alumnosRiesgo: '25%',
      asistenciaPromedio: '92%',
      alumnos: [
        { matricula: '202012345', nombre: 'Diego Cannata', promedioPonderadoReal: 9.4, promedioRedondeadoOficial: 9.0, asistencia: 96, estatus: 'Aprobado Excelente' },
        { matricula: '202015678', nombre: 'Alejandro Garcia', promedioPonderadoReal: 6.8, promedioRedondeadoOficial: 7.0, asistencia: 82, estatus: 'Riesgo Moderado' },
        { matricula: '202019921', nombre: 'Maria Rodriguez Ortiz', promedioPonderadoReal: 9.5, promedioRedondeadoOficial: 10.0, asistencia: 100, estatus: 'Aprobado Excelente' },
        { matricula: '202113342', nombre: 'Ana Beltrán López', promedioPonderadoReal: 8.5, promedioRedondeadoOficial: 9.0, asistencia: 90, estatus: 'Aprobado Buen Nivel' },
      ]
    },
    {
      nrc: '28491',
      nombre: 'Sistemas Distribuidos',
      seccion: '002',
      horario: 'Martes, Jueves 14:00 - 16:00',
      programa: 'Postgrado en Computación',
      periodo: 'Primavera 2026',
      promedioGeneral: '8.6',
      tasaAprobacion: '88%',
      alumnosRiesgo: '12%',
      asistenciaPromedio: '95%',
      alumnos: [
        { matricula: '202144551', nombre: 'Carlos Mendoza Rivas', promedioPonderadoReal: 8.6, promedioRedondeadoOficial: 9.0, asistencia: 95, estatus: 'Aprobado Buen Nivel' },
        { matricula: '202188992', nombre: 'Sofia Castro Vega', promedioPonderadoReal: 9.2, promedioRedondeadoOficial: 9.0, asistencia: 98, estatus: 'Aprobado Excelente' },
        { matricula: '202199003', nombre: 'Luis Fernando Torres', promedioPonderadoReal: 7.4, promedioRedondeadoOficial: 7.0, asistencia: 88, estatus: 'Aprobado Regular' },
      ]
    },
    {
      nrc: '31022',
      nombre: 'Advanced Databases',
      seccion: '202',
      horario: 'Lunes, Miércoles 10:00 - 12:00',
      programa: 'Postgrado en Computación',
      periodo: 'Primavera 2026',
      promedioGeneral: '9.2',
      tasaAprobacion: '95%',
      alumnosRiesgo: '5%',
      asistenciaPromedio: '96%',
      alumnos: [
        { matricula: '202211223', nombre: 'Elena Rostova', promedioPonderadoReal: 9.6, promedioRedondeadoOficial: 10.0, asistencia: 100, estatus: 'Aprobado Excelente' },
        { matricula: '202233445', nombre: 'Miguel Angel Fox', promedioPonderadoReal: 8.8, promedioRedondeadoOficial: 9.0, asistencia: 92, estatus: 'Aprobado Buen Nivel' },
      ]
    },
    {
      nrc: '22310',
      nombre: 'Mobile Development',
      seccion: '105',
      horario: 'Viernes 14:00 - 18:00',
      programa: 'Postgrado en Computación',
      periodo: 'Primavera 2026',
      promedioGeneral: '8.1',
      tasaAprobacion: '80%',
      alumnosRiesgo: '20%',
      asistenciaPromedio: '89%',
      alumnos: [
        { matricula: '202355667', nombre: 'Patricia Fernandez', promedioPonderadoReal: 8.4, promedioRedondeadoOficial: 8.0, asistencia: 90, estatus: 'Aprobado Buen Nivel' },
        { matricula: '202377889', nombre: 'Roberto Gómez', promedioPonderadoReal: 6.4, promedioRedondeadoOficial: 6.0, asistencia: 78, estatus: 'Riesgo Moderado' },
      ]
    }
  ];

  materiaSeleccionadaNrc = signal<string>('15842');
  materia = this.listaMateriasDisponibles[0];
  tabs = ['Alumnos', 'Ponderaciones', 'Actividades'];
  alumnos = signal<AlumnoRendimiento[]>(this.materia.alumnos);

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cambiarMateria(id);
      }
    });
  }

  cambiarMateria(nrc: string) {
    const mat = this.listaMateriasDisponibles.find(m => m.nrc === nrc);
    if (mat) {
      this.materiaSeleccionadaNrc.set(mat.nrc);
      this.materia = mat;
      this.alumnos.set(mat.alumnos);
    }
  }

  // Estado de descarga simulada
  descargando = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  descargarReporte(tipo: string, formato: string) {
    this.descargando.set(`${tipo} (${formato})`);
    this.mensajeExito.set(null);

    setTimeout(() => {
      this.descargando.set(null);
      this.mensajeExito.set(`¡El reporte "${tipo}" para la materia ${this.materia.nombre} (NRC: ${this.materia.nrc}) en formato ${formato.toUpperCase()} se ha generado y descargado exitosamente vía MS-Reportes!`);
      
      setTimeout(() => {
        this.mensajeExito.set(null);
      }, 5000);
    }, 2500);
  }
}
