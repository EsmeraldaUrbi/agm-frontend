import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';

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

  materias: any[] = [];

  selectedMateriaNrc = '';
  selectedChartNrc = '';

  ngOnInit() {
    this.cargarMaterias();
  }

  cargarMaterias() {
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
          this.materiasService.getMateriasByDocente(docenteId as string, { limit: 100 }).subscribe({
            next: (response) => {
              this.materias = response.items || [];
              if (this.materias.length > 0) {
                this.selectedMateriaNrc = this.materias[0].nrc;
                this.selectedChartNrc = this.materias[0].nrc;
              }
            },
            error: (err) => console.error('Error cargando materias', err)
          });
        } else {
          console.warn('Docente no encontrado en el padrón.');
        }
      },
      error: (err) => console.error('Error cargando padrón docente', err)
    });
  }

  get selectedMateria() {
    return this.materias.find(m => m.nrc === this.selectedMateriaNrc) || { nrc: '', nombre: '', seccion: '', alumnos: 0, estatus: '', rendimiento: 0, asistencia: 0, asistenciaSemanal: [] };
  }

  get totalMaterias(): number {
    return this.materias.length;
  }

  get totalAlumnos(): number {
    return this.materias.reduce((acc, m) => acc + (m.alumnos || 0), 0);
  }

  get asistenciaPromedio(): number {
    if (this.materias.length === 0) return 0;
    const sum = this.materias.reduce((acc, m) => acc + (m.asistencia || 0), 0);
    return Math.round(sum / this.materias.length);
  }

  get materiasPorCerrar(): number {
    return this.materias.filter(m => m.estatus === 'PROXIMO_CIERRE' || m.estatus === 'POR CERRAR').length;
  }

  get asisLinePath(): string {
    const data = this.selectedMateria.asistenciaSemanal;
    if (!data || data.length === 0) return '';
    const points = data.map((val: number, i: number) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - val;
      return `${x},${y}`;
    });
    return `M${points.join(' L')}`;
  }

  get asisAreaPath(): string {
    const data = this.selectedMateria.asistenciaSemanal;
    if (!data || data.length === 0) return '';
    const points = data.map((val: number, i: number) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - val;
      return `${x},${y}`;
    });
    return `M0,100 L${points.join(' L')} L100,100 Z`;
  }



  // ==========================================
  // WIDGET 2: Gráfico de Distribución (Histograma)
  // ==========================================
  
  public chartType: ChartType = 'bar';
  
  public chartData: ChartConfiguration['data'] = {
    labels: ['Excelencia (9.0 - 10)', 'Regular (6.0 - 8.9)', 'Reprobados (< 6.0)'],
    datasets: [
      {
        data: [0, 0, 0], // Datos pendientes de consumir backend
        backgroundColor: ['#2E7D32', '#0070A8', '#C62828'],
        borderRadius: 4,
        barPercentage: 0.6,
      }
    ]
  };

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.raw} alumnos`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 5 },
        grid: { color: '#f1f5f9' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      }
    }
  };

  // Escuchar el cambio del select para "recalcular" el histograma
  onChartMateriaChange() {
    // TODO: Consumir MS-Calificaciones para obtener el histograma real.
    // Por ahora, se elimina la lógica estática de Math.random() requerida en la limpieza de mocks.
    this.chartData = {
      labels: ['Excelencia (9.0 - 10)', 'Regular (6.0 - 8.9)', 'Reprobados (< 6.0)'],
      datasets: [
        {
          data: [0, 0, 0], // Datos reales pendientes de conexión a ms-calificaciones
          backgroundColor: ['#2E7D32', '#0070A8', '#C62828'],
          borderRadius: 4,
          barPercentage: 0.6,
        }
      ]
    };
  }
}
