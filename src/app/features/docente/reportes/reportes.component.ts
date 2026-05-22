import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface AlumnoRendimiento {
  matricula: string;
  nombre: string;
  promedioActual: number;
  promedioFinal: number;
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
      alumnos: Array.from({ length: 25 }).map((_, i) => ({
        matricula: `2020123${i < 10 ? '0'+i : i}`,
        nombre: `Alumno Generico ${i+1}`,
        promedioActual: Number((Math.random() * 4 + 6).toFixed(1)), // 6 to 10
        promedioFinal: Number((Math.random() * 4 + 6).toFixed(1)),
        promedioPonderadoReal: Number((Math.random() * 4 + 6).toFixed(1)),
        promedioRedondeadoOficial: Math.round(Number((Math.random() * 4 + 6).toFixed(1))),
        asistencia: Math.floor(Math.random() * 20 + 80), // 80 to 100
        estatus: (Math.random() > 0.3) ? 'Aprobado Excelente' : 'Riesgo Moderado'
      }))
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
        { matricula: '202144551', nombre: 'Carlos Mendoza Rivas', promedioActual: 8.5, promedioFinal: 8.6, promedioPonderadoReal: 8.6, promedioRedondeadoOficial: 9.0, asistencia: 95, estatus: 'Aprobado Buen Nivel' },
        { matricula: '202188992', nombre: 'Sofia Castro Vega', promedioActual: 9.0, promedioFinal: 9.2, promedioPonderadoReal: 9.2, promedioRedondeadoOficial: 9.0, asistencia: 98, estatus: 'Aprobado Excelente' },
        { matricula: '202199003', nombre: 'Luis Fernando Torres', promedioActual: 7.2, promedioFinal: 7.4, promedioPonderadoReal: 7.4, promedioRedondeadoOficial: 7.0, asistencia: 88, estatus: 'Aprobado Regular' },
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
        { matricula: '202211223', nombre: 'Elena Rostova', promedioActual: 9.4, promedioFinal: 9.6, promedioPonderadoReal: 9.6, promedioRedondeadoOficial: 10.0, asistencia: 100, estatus: 'Aprobado Excelente' },
        { matricula: '202233445', nombre: 'Miguel Angel Fox', promedioActual: 8.7, promedioFinal: 8.8, promedioPonderadoReal: 8.8, promedioRedondeadoOficial: 9.0, asistencia: 92, estatus: 'Aprobado Buen Nivel' },
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
        { matricula: '202355667', nombre: 'Patricia Fernandez', promedioActual: 8.1, promedioFinal: 8.4, promedioPonderadoReal: 8.4, promedioRedondeadoOficial: 8.0, asistencia: 90, estatus: 'Aprobado Buen Nivel' },
        { matricula: '202377889', nombre: 'Roberto Gómez', promedioActual: 6.2, promedioFinal: 6.4, promedioPonderadoReal: 6.4, promedioRedondeadoOficial: 6.0, asistencia: 78, estatus: 'Riesgo Moderado' },
      ]
    }
  ];

  materiaSeleccionadaNrc = signal<string>('15842');
  materia = this.listaMateriasDisponibles[0];
  tabs = ['Alumnos', 'Ponderaciones', 'Actividades'];
  alumnos = signal<AlumnoRendimiento[]>(this.materia.alumnos);

  // Pagination states
  currentPage = signal(1);
  itemsPerPage = 10;

  paginatedAlumnos = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.alumnos().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.alumnos().length / this.itemsPerPage));
  });

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

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
      this.currentPage.set(1);
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
