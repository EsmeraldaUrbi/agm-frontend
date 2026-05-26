import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  // Datos mockeados para la vista inicial
  materias: any[] = [];

  selectedMateriaNrc = '';
  selectedChartNrc = '';

  get selectedMateria() {
    return this.materias.find(m => m.nrc === this.selectedMateriaNrc) || { nrc: '', nombre: '', seccion: '', alumnos: 0, estatus: '', rendimiento: 0, asistencia: 0, asistenciaSemanal: [] };
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
