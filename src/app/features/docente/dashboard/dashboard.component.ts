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
import { PeriodosService } from '../../../core/services/periodos.service';

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
  private periodosService = inject(PeriodosService);

  materias: any[] = [];
  periodos: any[] = [];
  selectedPeriodoId = '';
  materiasFiltradas: any[] = [];
  private materiasMS7: any[] = [];

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

    this.periodosService.getPeriodos(1, 100).subscribe({
      next: (res) => {
        this.periodos = res.items || [];
        const activo = this.periodos.find(p => p.activo);
        if (activo) {
          this.selectedPeriodoId = activo.periodo_id || '';
        } else if (this.periodos.length > 0) {
          this.selectedPeriodoId = this.periodos[0].periodo_id || '';
        }

        this.docentesService.getDocentes({ limit: 500 }).subscribe({
          next: (docentes) => {
            const docente = docentes.find(d => {
              const docenteEmail = (d as any).email || d.correo || '';
              return docenteEmail.toLowerCase() === user.email.toLowerCase();
            });

            if (docente && (docente.docente_id || docente.id)) {
              const docenteId = docente.docente_id || docente.id;
              this.cargarMateriasDelDocente(docenteId as string);
            } else {
              console.warn('Docente no encontrado en el padrón.');
            }
          },
          error: (err) => console.error('Error cargando padrón docente MS3', err)
        });
      },
      error: (err) => console.error('Error cargando periodos', err)
    });
  }

  private normalizarEstadoMateria(materia: any): string {
    return String(
      materia?.estado ||
      materia?.estatus ||
      materia?.estado_materia ||
      'ACTIVA'
    ).trim().toUpperCase();
  }

  private esMateriaVisibleEnDashboard(materia: any): boolean {
    const estado = this.normalizarEstadoMateria(materia);

    return (
      estado === 'ACTIVA' ||
      estado === 'PROXIMO_CIERRE' ||
      estado === 'POR CERRAR'
    );
  }

  private obtenerMateriaId(materia: any): string {
    return String(
      materia?.materia_ofertada_id ||
      materia?.materia_id ||
      materia?.id ||
      ''
    ).trim();
  }

  private obtenerPeriodoId(valor: any): string {
    return String(
      valor?.periodo_id ||
      valor?.id_periodo ||
      valor?.periodo?.periodo_id ||
      valor?.periodo?.id ||
      valor?.id ||
      ''
    ).trim();
  }

  private obtenerNrcMateria(materia: any): string {
    return String(
      materia?.nrc ||
      materia?.nrc_materia ||
      ''
    ).trim();
  }

  private obtenerIdentidadAlumno(alumno: any): string {
    return String(
      alumno?.alumno_id ||
      alumno?.id ||
      alumno?.matricula ||
      alumno?.correo ||
      alumno?.email ||
      ''
    ).trim().toLowerCase();
  }

  cargarMateriasDelDocente(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId, { limit: 100 }).subscribe({
      next: (response) => {
        this.materias = response.items || [];
        
        // 4. Rendimiento por Materia (MS-7)
        this.reportesService.getEstadisticasDocente(docenteId).subscribe({
          next: (estadisticas: any) => {
            const periodos = estadisticas?.periodos || [];

            this.materiasMS7 = [];

            periodos.forEach((periodo: any) => {
              if (Array.isArray(periodo.materias)) {
                this.materiasMS7 = [
                  ...this.materiasMS7,
                  ...periodo.materias.map((materia: any) => ({
                    ...materia,
                    periodo_id: this.obtenerPeriodoId(materia) || this.obtenerPeriodoId(periodo)
                  }))
                ];
              }
            });

            // Mantener cálculo de rendimiento por materia
            this.materias.forEach(m => {
              const materiaId = this.obtenerMateriaId(m);
              const nrc = this.obtenerNrcMateria(m);

              const materiaMS7 = this.materiasMS7.find((x: any) => {
                const idMS7 = this.obtenerMateriaId(x);
                const nrcMS7 = this.obtenerNrcMateria(x);

                return Boolean(
                  (materiaId && idMS7 && idMS7 === materiaId) ||
                  (nrc && nrcMS7 && nrcMS7 === nrc)
                );
              });

              m.rendimiento = materiaMS7 ? Number(materiaMS7.promedio_grupal || 0) : 0;
            });

            // Filtrar materias por periodo
            this.filtrarMateriasPorPeriodo();
          },
          error: (err) => {
            console.error('Error MS7:', err);
            this.asistenciaPromedioValue = 0;
            this.materias.forEach(m => m.rendimiento = 0);
            this.filtrarMateriasPorPeriodo();
          }
        });
      },
      error: (err) => console.error('Error cargando materias', err)
    });
  }

  private actualizarAsistenciaPromedio(): void {
    const materiasVisibles = this.materiasFiltradas || [];

    if (materiasVisibles.length === 0) {
      this.asistenciaPromedioValue = 0;
      return;
    }

    const porcentajes = materiasVisibles
      .map((materia: any) => {
        const materiaId = this.obtenerMateriaId(materia);
        const nrc = this.obtenerNrcMateria(materia);

        const estadistica = this.materiasMS7.find((item: any) => {
          const itemMateriaId = this.obtenerMateriaId(item);
          const itemNrc = this.obtenerNrcMateria(item);
          const itemPeriodoId = this.obtenerPeriodoId(item);

          const coincideMateria = Boolean(
            (materiaId && itemMateriaId && itemMateriaId === materiaId) ||
            (nrc && itemNrc && itemNrc === nrc)
          );

          const coincidePeriodo = !this.selectedPeriodoId ||
            !itemPeriodoId ||
            itemPeriodoId === this.selectedPeriodoId;

          return coincideMateria && coincidePeriodo;
        });

        return estadistica ? Number(estadistica.porcentaje_asistencia ?? 0) : null;
      })
      .filter((valor: number | null): valor is number =>
        valor !== null && Number.isFinite(valor)
      );

    if (porcentajes.length === 0) {
      this.asistenciaPromedioValue = 0;
      return;
    }

    const suma = porcentajes.reduce((acc, valor) => acc + valor, 0);
    this.asistenciaPromedioValue = Math.round(suma / porcentajes.length);
  }

  onPeriodoChange() {
    this.filtrarMateriasPorPeriodo();
  }

  filtrarMateriasPorPeriodo() {
    if (!this.selectedPeriodoId) {
      this.materiasFiltradas = this.materias;
    } else {
      this.materiasFiltradas = this.materias.filter(m => m.periodo_id === this.selectedPeriodoId);
    }

    this.totalMateriasValue = this.materiasFiltradas.length;
    this.actualizarAsistenciaPromedio();

    // Materias por cerrar del periodo filtrado
    this.materiasPorCerrarValue = this.materiasFiltradas.filter(m => 
        m.estado === 'ACTIVA' || 
        m.estado === 'PROXIMO_CIERRE' || 
        m.estado === 'POR CERRAR' ||
        m.estatus === 'ACTIVA' ||
        m.estatus === 'PROXIMO_CIERRE' ||
        m.estatus === 'POR CERRAR'
    ).length;

    // Deduplicar alumnos activos para el periodo filtrado
    const alumnosUnicos = new Set<string>();
    const peticionesAlumnos = this.materiasFiltradas.map(m => {
      const materiaId = m.materia_ofertada_id || m.materia_id || m.id;
      return this.alumnosService.getAlumnosByMateria(materiaId).pipe(
        catchError((err) => {
          console.error(`Error loading alumnos from MS3 for materia ${materiaId}`, err);
          return of([]);
        }),
        map((alumnos: any[]) => {
          const lista = alumnos || [];
          m.alumnos = lista.length;

          lista.forEach((alumno: any) => {
            const identidad = this.obtenerIdentidadAlumno(alumno);
            if (identidad) {
              alumnosUnicos.add(identidad);
            }
          });

          return lista;
        })
      );
    });

    if (peticionesAlumnos.length > 0) {
      forkJoin(peticionesAlumnos).subscribe(() => {
        this.totalAlumnosValue = alumnosUnicos.size;
      });
    } else {
      this.totalAlumnosValue = 0;
    }

    // Seleccionar primeras materias del periodo filtrado para las gráficas
    if (this.materiasFiltradas.length > 0) {
      const firstId = this.materiasFiltradas[0].materia_ofertada_id || this.materiasFiltradas[0].materia_id || this.materiasFiltradas[0].id;
      
      const idAsistenciaValido = this.materiasFiltradas.some(m => (m.materia_ofertada_id || m.materia_id || m.id) === this.selectedMateriaIdForAsistencia);
      if (!idAsistenciaValido) {
        this.selectedMateriaIdForAsistencia = firstId;
      }
      this.onAsistenciaMateriaChange();

      const idChartValido = this.materiasFiltradas.some(m => (m.materia_ofertada_id || m.materia_id || m.id) === this.selectedMateriaIdForChart);
      if (!idChartValido) {
        this.selectedMateriaIdForChart = firstId;
      }
      this.onChartMateriaChange();
    } else {
      this.selectedMateriaIdForAsistencia = '';
      this.selectedMateriaIdForChart = '';
      this.hasAttendanceData = false;
      this.attendanceMessage = 'No hay materias registradas en este periodo.';
      this.chartData = {
        labels: ['Excelencia (9.0 - 10)', 'Regular (6.0 - 8.9)', 'Reprobados (< 6.0)'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#2E7D32', '#0070A8', '#C62828'],
          borderRadius: 4,
          barPercentage: 0.6,
        }]
      };
    }
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
      error: (err) => {
        if (err && err.status !== 404) {
          console.error('Error MS4 Concentrado:', err);
        }
        // Reset chart data
        this.chartData = {
          labels: ['Excelencia (9.0 - 10)', 'Regular (6.0 - 8.9)', 'Reprobados (< 6.0)'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#2E7D32', '#0070A8', '#C62828'],
            borderRadius: 4,
            barPercentage: 0.6,
          }]
        };
      }
    });
  }
}
