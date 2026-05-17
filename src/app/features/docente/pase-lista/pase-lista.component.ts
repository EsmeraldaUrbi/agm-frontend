import { Component, signal, computed, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { FormsModule } from '@angular/forms';

interface AlumnoRegistrado {
  nombre: string;
  matricula: string;
  hora: string;
  estado: 'presente' | 'retardo';
}

type EstadoSesion = 'idle' | 'activa' | 'finalizada';

@Component({
  selector: 'app-pase-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeComponent, FormsModule],
  templateUrl: './pase-lista.component.html'
})
export class PaseListaComponent {
  // Estado de la sesión
  estadoSesion = signal<EstadoSesion>('idle');

  // Materia seleccionada
  materiaSeleccionada = '';
  materias = [
    { nrc: '15842', nombre: 'Arquitectura de Servicios Web', seccion: '101' },
    { nrc: '15845', nombre: 'Ingeniería de Software II',     seccion: '102' },
    { nrc: '16021', nombre: 'Programación Paralela',         seccion: '101' },
    { nrc: '16110', nombre: 'Seguridad de la Información',   seccion: '104' },
  ];

  // Datos de sesión activa
  sessionId   = signal<string>('');
  sessionToken = signal<string>('');
  qrUrl        = signal<string>('');  // URL que irá dentro del QR

  // Timer (10 minutos = 600 segundos)
  tiempoRestante = signal(600);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  tiempoFormateado = computed(() => {
    const m = Math.floor(this.tiempoRestante() / 60).toString().padStart(2, '0');
    const s = (this.tiempoRestante() % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  timerPorcentaje = computed(() => (this.tiempoRestante() / 600) * 100);

  // Alumnos registrados en tiempo real
  alumnosRegistrados = signal<AlumnoRegistrado[]>([
    { nombre: 'Juan Pérez García',    matricula: '202104523', hora: '09:02 AM', estado: 'presente' },
    { nombre: 'María García Ortiz',   matricula: '202108711', hora: '09:07 AM', estado: 'retardo'  },
  ]);

  presentes  = computed(() => this.alumnosRegistrados().filter(a => a.estado === 'presente').length);
  retardos   = computed(() => this.alumnosRegistrados().filter(a => a.estado === 'retardo').length);
  totalGrupo = 35; // mockeado — vendrá del MS-2

  pendientes = computed(() => this.totalGrupo - this.alumnosRegistrados().length);

  // ── Iniciar sesión ──────────────────────────────────────────────
  iniciarSesion() {
    if (!this.materiaSeleccionada) return;

    // Mock: aquí irá POST :8005/sesiones/iniciar
    const mockSessionId    = 'sess-' + Math.random().toString(36).slice(2, 10);
    const mockSessionToken = Math.random().toString(36).slice(2, 18).toUpperCase();
    const baseUrl = window.location.origin;

    this.sessionId.set(mockSessionId);
    this.sessionToken.set(mockSessionToken);
    // El QR codifica la URL que el docente abrirá en su teléfono
    this.qrUrl.set(`${baseUrl}/docente/escaner?session=${mockSessionId}&token=${mockSessionToken}`);
    this.estadoSesion.set('activa');

    // Iniciar countdown
    this.tiempoRestante.set(600);
    this.timerInterval = setInterval(() => {
      if (this.tiempoRestante() <= 0) {
        this.finalizarSesion();
        return;
      }
      this.tiempoRestante.update(t => t - 1);
    }, 1000);
  }

  // ── Finalizar sesión ────────────────────────────────────────────
  finalizarSesion() {
    // Aquí irá DELETE :8005/sesiones/:id/cerrar
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.estadoSesion.set('finalizada');
  }

  nueva() {
    this.estadoSesion.set('idle');
    this.materiaSeleccionada = '';
    this.alumnosRegistrados.set([]);
    this.tiempoRestante.set(600);
  }

  get esIdle()      { return this.estadoSesion() === 'idle'; }
  get esActiva()    { return this.estadoSesion() === 'activa'; }
  get esFinalizada(){ return this.estadoSesion() === 'finalizada'; }

  get materiaActual() {
    return this.materias.find(m => m.nrc === this.materiaSeleccionada);
  }
}
