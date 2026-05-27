import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { AsistenciasService } from '../../../core/services/asistencias.service';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { ReportesService } from '../../../core/services/reportes.service';

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

  materias: any[] = [];
  materiasResumen: any[] = [];

  totalMateriasValue: number = 0;
  totalAlumnosValue: number = 0;
  asistenciaPromedioValue: number = 0;
  materiasPorCerrarValue: number = 0;

  selectedMateriaIdForAsistencia = '';
  asistenciaSemanalDatos: number[] = [];

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
        if (docente && (docente.docente_id || docente.id)) {
          const docenteId = docente.docente_id || docente.id;
          this.cargarMetricasGlobales(docenteId as string);
          this.cargarMateriasDelDocente(docenteId as string);
        } else {
          console.warn('Docente no encontrado en el padrón.');
        }
      },
      error: (err) => console.error('Error cargando padrón docente', err)
    });
  }

  cargarMetricasGlobales(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId, { limit: 100 }).subscribe({
      next: (res) => this.totalMateriasValue = res.total || res.items?.length || 0,
      error: (err) => console.error(err)
    });

    this.inscripcionesService.getTotalAlumnosDocente(docenteId).subscribe({
      next: (res) => this.totalAlumnosValue = res.total_alumnos || 0,
      error: (err) => console.error(err)
    });

    this.asistenciasService.getAsistenciaPromedioDocente(docenteId).subscribe({
      next: (res) => this.asistenciaPromedioValue = res.porcentaje_asistencia || 0,
      error: (err) => console.error(err)
    });

    this.materiasService.getMateriasPorCerrar(docenteId).subscribe({
      next: (res) => this.materiasPorCerrarValue = res?.length || 0,
      error: (err) => console.error(err)
    });

    this.reportesService.getResumenMateriasDocente(docenteId).subscribe({
      next: (res) => {
        if (res && res.periodos && res.periodos.length > 0) {
           this.materiasResumen = res.periodos[0].materias || [];
        } else {
           this.materiasResumen = [];
        }
      },
      error: (err) => console.error(err)
    });
  }

  cargarMateriasDelDocente(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId, { limit: 100 }).subscribe({
      next: (response) => {
        this.materias = response.items || [];
        
        if (this.materias.length > 0) {
          const peticionesRendimiento = this.materias.map(m => 
            this.calificacionesService.getRendimientoMateria(m.materia_id || m.id).pipe(
              catchError(() => of({ rendimiento_promedio: 0 }))
            )
          );
          
          forkJoin(peticionesRendimiento).subscribe(rendimientos => {
            this.materias.forEach((m, i) => {
               m.rendimiento = rendimientos[i].rendimiento_promedio || 0;
            });
          });

          this.selectedMateriaIdForAsistencia = this.materias[0].materia_id || this.materias[0].id;
          this.selectedMateriaIdForChart = this.materias[0].materia_id || this.materias[0].id;
          
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

  onAsistenciaMateriaChange() {
    if (!this.selectedMateriaIdForAsistencia) return;
    this.asistenciasService.getHistoricoSemanalMateria(this.selectedMateriaIdForAsistencia).subscribe({
      next: (res) => {
         this.asistenciaSemanalDatos = Array.isArray(res) ? res : [100, 100, 100, 100, 100];
      },
      error: (err) => {
         console.error(err);
         this.asistenciaSemanalDatos = [0,0,0,0,0];
      }
    });
  }

  get asisLinePath(): string {
    const data = this.asistenciaSemanalDatos;
    if (!data || data.length === 0) return '';
    const points = data.map((val: number, i: number) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - val;
      return `${x},${y}`;
    });
    return `M${points.join(' L')}`;
  }

  get asisAreaPath(): string {
    const data = this.asistenciaSemanalDatos;
    if (!data || data.length === 0) return '';
    const points = data.map((val: number, i: number) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - val;
      return `${x},${y}`;
    });
    return `M0,100 L${points.join(' L')} L100,100 Z`;
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

  onChartMateriaChange() {
    if (!this.selectedMateriaIdForChart) return;
    this.calificacionesService.getDistribucionCalificaciones(this.selectedMateriaIdForChart).subscribe({
      next: (res) => {
        const excelencia = res.excelencia || 0;
        const regular = res.regular || 0;
        const reprobados = res.reprobados || 0;
        
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
      error: (err) => console.error(err)
    });
  }
}
