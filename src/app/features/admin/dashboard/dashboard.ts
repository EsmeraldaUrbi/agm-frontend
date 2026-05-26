import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PeriodosService, Periodo } from '../../../core/services/periodos.service';
import { DashboardAdminService } from '../../../core/services/dashboard-admin.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

interface QuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string; // Tailwind bg class
}

interface ActivityItem {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styles: [`
    :host { display: block; }

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-card {
      animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .delay-1 { animation-delay: 0.05s; opacity: 0; }
    .delay-2 { animation-delay: 0.10s; opacity: 0; }
    .delay-3 { animation-delay: 0.15s; opacity: 0; }
    .delay-4 { animation-delay: 0.20s; opacity: 0; }
    .delay-5 { animation-delay: 0.25s; opacity: 0; }
    .delay-6 { animation-delay: 0.30s; opacity: 0; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private periodosService = inject(PeriodosService);
  private dashboardAdminService = inject(DashboardAdminService);
  private clockInterval: any;

  // ── Estadísticas y Gráficas ──────────────────────────────────────────────
  totalDocentes = signal<number>(0);
  totalAlumnos = signal<number>(0);
  
  chartData = signal<ChartData<'doughnut'>>({
    labels: ['Docentes', 'Alumnos'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#003b5c', '#42d0fe'],
      hoverBackgroundColor: ['#00253B', '#1FB2E5'],
      borderWidth: 0
    }]
  });

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: 'Inter', weight: 'bold' } } },
      tooltip: { padding: 12, cornerRadius: 8, bodyFont: { family: 'Inter' } }
    }
  };

  // ── Reloj en tiempo real ─────────────────────────────────────────────────
  currentTime = signal<string>('');
  currentDate = signal<string>('');

  // ── Periodo Activo (desde API) ───────────────────────────────────────────
  activePeriod = signal<Periodo | null>(null);


  // ── Progreso del periodo activo ──────────────────────────────────────────
  periodProgress = computed(() => {
    const p = this.activePeriod();
    if (!p) return 0;
    const start = new Date(p.fecha_inicio).getTime();
    const end   = new Date(p.fecha_fin).getTime();
    const now   = new Date().getTime(); 
    if (now <= start) return 0;
    if (now >= end)   return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  });

  daysLeft = computed(() => {
    const p = this.activePeriod();
    if (!p) return 0;
    const end = new Date(p.fecha_fin).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  });

  // ── Acciones Rápidas ─────────────────────────────────────────────────────
  quickActions: QuickAction[] = [
    {
      label: 'Gestionar Periodos',
      description: 'Crear, editar y activar ciclos escolares',
      icon: 'calendar_month',
      route: '/admin/periodos',
      color: 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20'
    },
    {
      label: 'Directorio de Docentes',
      description: 'Consultar y administrar padrón académico',
      icon: 'supervisor_account',
      route: '/admin/usuarios',
      color: 'bg-primary/10 text-primary hover:bg-primary/20'
    },
    {
      label: 'Importar Docentes',
      description: 'Carga masiva por CSV/PDF',
      icon: 'group_add',
      route: '/admin/importar-docentes',
      color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
    },
    {
      label: 'Importar Materias',
      description: 'Cargar programación académica',
      icon: 'upload_file',
      route: '/admin/importar-materias',
      color: 'bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20'
    },
    {
      label: 'Mi Perfil',
      description: 'Ver datos y cambiar contraseña',
      icon: 'manage_accounts',
      route: '/profile',
      color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
    }
  ];

  // La sección Actividad Reciente fue removida por no contar con soporte en el backend actual.

  ngOnInit() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.cargarPeriodoActivo();
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.dashboardAdminService.getStats().subscribe({
      next: (stats) => {
        this.totalDocentes.set(stats.totalDocentes);
        this.totalAlumnos.set(stats.totalAlumnos);
        this.chartData.set({
          labels: ['Docentes', 'Alumnos'],
          datasets: [{
            data: [stats.totalDocentes, stats.totalAlumnos],
            backgroundColor: ['#003b5c', '#42d0fe'],
            hoverBackgroundColor: ['#00253B', '#1FB2E5'],
            borderWidth: 0
          }]
        });
      },
      error: (err) => console.error('Error cargando estadísticas', err)
    });
  }

  cargarPeriodoActivo() {
    this.periodosService.getPeriodoActivo().subscribe({
      next: (res) => {
        this.activePeriod.set(res);
      },
      error: (err) => console.error('Error obteniendo periodo activo', err)
    });
  }

  ngOnDestroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private updateClock() {
    const now = new Date();
    this.currentTime.set(
      now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    this.currentDate.set(
      now.toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    );
  }
}
