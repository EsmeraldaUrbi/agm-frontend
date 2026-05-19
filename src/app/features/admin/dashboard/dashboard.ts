import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PeriodosService, Periodo } from '../../../core/services/periodos.service';

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
  imports: [CommonModule, RouterModule],
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
  private clockInterval: any;

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
      color: 'bg-primary/10 text-primary hover:bg-primary/20'
    },
    {
      label: 'Directorio de Usuarios',
      description: 'Consultar y administrar docentes y alumnos',
      icon: 'supervisor_account',
      route: '/admin/usuarios',
      color: 'bg-secondary/10 text-secondary hover:bg-secondary/20'
    },
    {
      label: 'Importar Materias',
      description: 'Cargar PDF de programación académica',
      icon: 'upload_file',
      route: '/admin/importar-materias',
      color: 'bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20'
    },
    {
      label: 'Mi Perfil',
      description: 'Ver datos personales y cambiar contraseña',
      icon: 'manage_accounts',
      route: '/profile',
      color: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
    }
  ];

  // ── Actividad Reciente ───────────────────────────────────────────────────
  recentActivity: ActivityItem[] = [
    {
      icon: 'upload_file',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Importación de Materias Completada',
      description: '312 materias asignadas al periodo Primavera 2026.',
      time: 'Hace 2 horas'
    },
    {
      icon: 'person_add',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      title: 'Directorio de Docentes Actualizado',
      description: '124 docentes importados desde el PDF institucional.',
      time: 'Hace 5 horas'
    },
    {
      icon: 'calendar_month',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      title: 'Periodo Primavera 2026 Activado',
      description: 'El ciclo escolar fue marcado como activo.',
      time: 'Hace 1 día'
    },
    {
      icon: 'warning',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      title: 'Alerta: 25 materias sin docente asignado',
      description: 'Revisar la programación de Secretaría Académica.',
      time: 'Hace 1 día'
    }
  ];

  ngOnInit() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.cargarPeriodoActivo();
  }

  cargarPeriodoActivo() {
    this.periodosService.getPeriodoActivo().subscribe({
      next: (res) => {
        this.activePeriod.set(res.data);
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
