import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { AsistenciasService } from '../../../core/services/asistencias.service';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { AlumnosService } from '../../../core/services/alumnos.service';

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private docentesService = inject(DocentesService);
  private materiasService = inject(MateriasService);
  private inscripcionesService = inject(InscripcionesService);
  private asistenciasService = inject(AsistenciasService);
  private calificacionesService = inject(CalificacionesService);
  private reportesService = inject(ReportesService);
  private alumnosService = inject(AlumnosService);

  materias: any[] = [];

  totalMateriasValue: number = 0;
  totalAlumnosValue: number = 0;
  asistenciaPromedioValue: number = 0;
  materiasPorCerrarValue: number = 0;

  selectedMateriaIdForAsistencia = '';
  hasAttendanceData = false;
  attendanceMessage = '';
  
  public attendanceChartType: ChartType = 'doughnut';
  public attendanceChartData: ChartConfiguration['data'] = {
    labels: ['Presentes', 'Retardos', 'Faltas'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#2E7D32', '#0070A8', '#C62828']
    }]
  };
  public attendanceChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw} alumnos`
        }
      }
    }
  };

  selectedMateriaIdForChart = '';

  ngOnInit() {
    this.cargarDatosDocente();
  }

  cargarDatosDocente() {
    const user = this.authService.currentUser();
    if (!user || !user.email) return;

    this.docentesService.getDocentes({ limit: 100 }).subscribe({
      next: (docentes) => {
        const docente = docentes.find(d => {
          const docenteEmail = (d as any).email || d.correo || '';
          return docenteEmail.toLowerCase() === user.email.toLowerCase();
        });
        
        console.log('==== DEBUG 8. DOCENTE ACTUAL ====', { AuthUser: user, DocenteMatcheado: docente });

        if (docente && (docente.docente_id || docente.id)) {
          const docenteId = docente.docente_id || docente.id;
          
          // Asistencia promedio global
          this.asistenciasService.getAsistenciaPromedioDocente(docenteId as string).subscribe({
            next: (res: any) => this.asistenciaPromedioValue = res.porcentaje_asistencia || 0,
            error: (err) => console.error('Error cargando asistencia promedio MS5', err)
          });

          this.cargarMateriasDelDocente(docenteId as string);
        } else {
          console.warn('Docente no encontrado en el padrón.');
        }
      },
      error: (err) => console.error('Error cargando padrón docente MS3', err)
    });
  }

  cargarMateriasDelDocente(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId, { limit: 100 }).subscribe({
      next: (response) => {
        this.materias = response.items || [];
        console.log('==== DEBUG 1. MATERIAS ASIGNADAS ====', this.materias);
        
        this.totalMateriasValue = this.materias.length;

        // 7. Materias por cerrar (calculado manualmente para evitar que quede en 0 si no funciona el endpoint)
        this.materiasPorCerrarValue = this.materias.filter(m => 
            m.estado === 'ACTIVA' || 
            m.estado === 'PROXIMO_CIERRE' || 
            m.estado === 'POR CERRAR' ||
            m.estatus === 'ACTIVA' ||
            m.estatus === 'PROXIMO_CIERRE' ||
            m.estatus === 'POR CERRAR'
        ).length;

        if (this.materias.length > 0) {
          // 3. Alumnos inscritos (MS-3: getAlumnosByMateria)
          let alumnosTotales = 0;
          const peticionesAlumnos = this.materias.map(m => {
            const materiaId = m.materia_ofertada_id || m.materia_id || m.id;
            return this.alumnosService.getAlumnosByMateria(materiaId).pipe(
              catchError((err) => {
                console.error(`Error loading alumnos from MS3 for materia ${materiaId}`, err);
                return of([]);
              }),
              map((alumnos: any[]) => {
                console.log(`==== DEBUG 3. ALUMNOS MATERIA ${materiaId} ====`, alumnos);
                m.alumnos = alumnos?.length || 0;
                alumnosTotales += m.alumnos;
                return alumnos;
              })
            );
          });

          forkJoin(peticionesAlumnos).subscribe(() => {
            this.totalAlumnosValue = alumnosTotales;
          });

          // 4. Rendimiento por Materia (MS-7)
          this.reportesService.getEstadisticasDocente(docenteId).subscribe({
            next: (estadisticas: any) => {
              console.log('==== DEBUG 4. MS7 ESTADISTICAS DOCENTE ====', estadisticas);
              let periodos = estadisticas?.periodos || [];
              let materiasMS7: any[] = [];
              periodos.forEach((p: any) => {
                if (p.materias) {
                  materiasMS7 = [...materiasMS7, ...p.materias];
                }
              });

              this.materias.forEach(m => {
                const materiaId = m.materia_ofertada_id || m.materia_id || m.id;
                const mMS7 = materiasMS7.find((x: any) => (x.materia_id === materiaId || x.materia_ofertada_id === materiaId));
                m.rendimiento = mMS7 ? (mMS7.promedio_grupal || 0) : 0;
              });
            },
            error: (err) => {
              console.error('Error MS7:', err);
              this.materias.forEach(m => m.rendimiento = 0);
            }
          });

          // Seleccionar primera materia
          this.selectedMateriaIdForAsistencia = this.materias[0].materia_ofertada_id || this.materias[0].materia_id || this.materias[0].id;
          this.selectedMateriaIdForChart = this.materias[0].materia_ofertada_id || this.materias[0].materia_id || this.materias[0].id;
          
          this.onAsistenciaMateriaChange();
          this.onChartMateriaChange();
        }
      },
      error: (err) => console.error('Error cargando materias', err)
    });
  }

  get totalMaterias(): number { return this.totalMateriasValue; }
  get totalAlumnos(): number { return this.totalAlumnosValue; }
  get asistenciaPromedio(): number { return this.asistenciaPromedioValue; }
  get materiasPorCerrar(): number { return this.materiasPorCerrarValue; }

  // 6. Distribución de Asistencia de la sesión más reciente/hoy
  onAsistenciaMateriaChange() {
    if (!this.selectedMateriaIdForAsistencia) return;
    
    this.hasAttendanceData = false;
    this.attendanceMessage = 'Cargando datos...';

    forkJoin({
      alumnos: this.alumnosService.getAlumnosByMateria(this.selectedMateriaIdForAsistencia).pipe(
        catchError(() => of([]))
      ),
      asistencias: this.asistenciasService.getAsistenciasHoy(this.selectedMateriaIdForAsistencia).pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ alumnos, asistencias }) => {
        const totalAlumnos = alumnos.length;
        
        console.log(`==== DEBUG 6. MS5 ASISTENCIAS MATERIA ${this.selectedMateriaIdForAsistencia} ====`, {
          totalAlumnos,
          asistencias
        });

        if (asistencias.length > 0) {
          const presentes = asistencias.filter(a => a.estado?.toUpperCase() === 'PRESENTE').length;
          const retardos = asistencias.filter(a => a.estado?.toUpperCase() === 'RETARDO').length;
          const ausentes = Math.max(0, totalAlumnos - (presentes + retardos));
          
          this.attendanceChartData = {
            labels: ['Presentes', 'Retardos', 'Faltas'],
            datasets: [{
              data: [presentes, retardos, ausentes],
              backgroundColor: ['#2E7D32', '#0070A8', '#C62828']
            }]
          };
          this.hasAttendanceData = true;
          this.attendanceMessage = '';
        } else {
          this.hasAttendanceData = false;
          this.attendanceMessage = 'No hay pases de lista registrados el día de hoy para esta materia.';
        }
      },
      error: (err) => {
        console.error('Error cargando datos de asistencia:', err);
        this.hasAttendanceData = false;
        this.attendanceMessage = 'Error al cargar los datos de asistencia.';
      }
    });
  }

  public chartType: ChartType = 'bar';
  public chartData: ChartConfiguration['data'] = {
    labels: ['Excelencia (9.0 - 10)', 'Regular (6.0 - 8.9)', 'Reprobados (< 6.0)'],
    datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#2E7D32', '#0070A8', '#C62828'],
        borderRadius: 4,
        barPercentage: 0.6,
    }]
  };
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context: any) => ` ${context.raw} alumnos` } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 5 }, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } }
    }
  };

  // 5. Distribución de Calificaciones
  onChartMateriaChange() {
    if (!this.selectedMateriaIdForChart) return;
    this.calificacionesService.getConcentrado(this.selectedMateriaIdForChart, 'actual').subscribe({
      next: (res: any) => {
        console.log(`==== DEBUG 5. MS4 CONCENTRADO MATERIA ${this.selectedMateriaIdForChart} ====`, res);

        let excelencia = 0;
        let regular = 0;
        let reprobados = 0;

        let alumnosList = [];
        if (Array.isArray(res)) {
           alumnosList = res;
        } else if (res && Array.isArray(res.alumnos)) {
           alumnosList = res.alumnos;
        } else if (res && Array.isArray(res.calificaciones)) {
           alumnosList = res.calificaciones;
        }

        if (alumnosList.length > 0) {
           alumnosList.forEach((a: any) => {
              // Si el alumno no tiene peso considerado, significa que no tiene calificaciones reales, se ignora
              if (a.peso_considerado === 0) return;

              let finalRaw = a.promedio_real ?? a.promedio_redondeado ?? a.calificacion_final ?? a.calificacion_registrada ?? a.calificacion ?? a.promedio ?? null;
              
              if (finalRaw === null) return; // Sin calificar

              let final = Number(finalRaw);
              if (isNaN(final)) return; // Ignorar si no se puede parsear
              
              if (final >= 9) excelencia++;
              else if (final >= 6) regular++;
              else reprobados++;
           });
        } else {
           excelencia = res.excelencia || 0;
           regular = res.regular || 0;
           reprobados = res.reprobados || 0;
        }
        
        this.chartData = {
          labels: ['Excelencia (9.0 - 10)', 'Regular (6.0 - 8.9)', 'Reprobados (< 6.0)'],
          datasets: [{
            data: [excelencia, regular, reprobados],
            backgroundColor: ['#2E7D32', '#0070A8', '#C62828'],
            borderRadius: 4,
            barPercentage: 0.6,
          }]
        };
      },
      error: (err) => console.error('Error MS4 Concentrado:', err)
    });
  }
}
