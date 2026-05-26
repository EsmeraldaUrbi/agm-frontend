import { Component, signal, computed, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsistenciasService } from '../../../core/services/asistencias.service';
import jsQR from 'jsqr';

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
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './pase-lista.component.html'
})
export class PaseListaComponent implements OnDestroy {
  @ViewChild('videoEl', { static: false }) videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl', { static: false }) canvasEl!: ElementRef<HTMLCanvasElement>;

  private asistenciasService = inject(AsistenciasService);

  estadoSesion = signal<EstadoSesion>('idle');

  materiaSeleccionada = '';
  materias = [
    { id_materia: 1, nrc: '15842', nombre: 'Arquitectura de Servicios Web', seccion: '101' },
    { id_materia: 2, nrc: '15845', nombre: 'Ingeniería de Software II',     seccion: '102' },
    { id_materia: 3, nrc: '16021', nombre: 'Programación Paralela',         seccion: '101' },
    { id_materia: 4, nrc: '16110', nombre: 'Seguridad de la Información',   seccion: '104' },
  ];

  // Datos de sesión activa
  sessionId = signal<number | null>(null);
  sessionToken = signal<string>('');

  tiempoRestante = signal(600);
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  tiempoFormateado = computed(() => {
    const m = Math.floor(this.tiempoRestante() / 60).toString().padStart(2, '0');
    const s = (this.tiempoRestante() % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  timerPorcentaje = computed(() => (this.tiempoRestante() / 600) * 100);

  alumnosRegistrados = signal<AlumnoRegistrado[]>([]);

  presentes  = computed(() => this.alumnosRegistrados().filter(a => a.estado === 'presente').length);
  retardos   = computed(() => this.alumnosRegistrados().filter(a => a.estado === 'retardo').length);
  totalGrupo = 35;

  pendientes = computed(() => this.totalGrupo - this.alumnosRegistrados().length);

  // --- ESCÁNER STATES ---
  camaraActiva = signal(false);
  escaneando = signal(false);
  errorCamara = signal('');
  ultimoEscaneado = signal<AlumnoRegistrado | null>(null);

  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private lecturaBloqueada = false;

  iniciarSesion() {
    if (!this.materiaSeleccionada) return;

    const idMateria = Number(this.materiaSeleccionada);

    this.asistenciasService.iniciarSesion(idMateria).subscribe({
      next: (sesion) => {
        this.sessionId.set(sesion.id_sesion);
        this.estadoSesion.set('activa');

        const fechaFin = new Date(sesion.fecha_hora_fin).getTime();
        const ahora = Date.now();
        const segundosRestantes = Math.max(0, Math.floor((fechaFin - ahora) / 1000));

        this.tiempoRestante.set(segundosRestantes);
        this.alumnosRegistrados.set([]);

        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
          if (this.tiempoRestante() <= 0) {
            this.finalizarSesion();
            return;
          }
          this.tiempoRestante.update(t => t - 1);
        }, 1000);

        // Intentar cargar historial inicial por si existen alumnos registrados
        this.cargarHistorial();

        // Iniciar cámara web para el escaneo directo
        setTimeout(() => this.iniciarCamara(), 100);
      },
      error: (error) => {
        console.error('Error al iniciar sesión de asistencia:', error);
        alert(error.error?.detail || 'No se pudo iniciar la sesión de asistencia.');
      }
    });
  }

  async iniciarCamara() {
    this.errorCamara.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Cámara trasera en móvil si está disponible
      });
      if (this.videoEl) {
        this.videoEl.nativeElement.srcObject = this.stream;
        await this.videoEl.nativeElement.play();
        this.camaraActiva.set(true);
        this.escaneando.set(true);
        this.escanearFrame();
      }
    } catch (err) {
      this.errorCamara.set('No se pudo acceder a la cámara. Verifique los permisos del navegador.');
      console.error(err);
    }
  }

  escanearFrame() {
    if (!this.videoEl || !this.canvasEl || !this.escaneando()) return;
    const video = this.videoEl.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    const ctx = canvas.getContext('2d')!;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data && !this.lecturaBloqueada) {
        this.procesarQR(code.data);
      }
    }

    if (this.escaneando()) {
      this.rafId = requestAnimationFrame(() => this.escanearFrame());
    }
  }

  procesarQR(data: string) {
    if (this.lecturaBloqueada) return;
    this.lecturaBloqueada = true;

    // Pausar frame loop de la cámara
    this.escaneando.set(false);

    this.asistenciasService.registrarAsistencia(data).subscribe({
      next: (res) => {
        // Consultar el historial para obtener la matrícula real del alumno escaneado
        const idSesion = this.sessionId();
        if (idSesion) {
          this.asistenciasService.obtenerHistorial(idSesion).subscribe({
            next: (historial: any[]) => {
              const registroMatch = historial.find((h: any) => h.id_asistencia === res.id_asistencia);
              const matricula = registroMatch ? registroMatch.matricula : 'Desconocida';

              const nuevo: AlumnoRegistrado = {
                nombre: `Alumno ${matricula}`,
                matricula: matricula,
                hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                estado: res.estado.toLowerCase() as 'presente' | 'retardo'
              };

              this.ultimoEscaneado.set(nuevo);

              const listaMapeada: AlumnoRegistrado[] = historial.map((h: any) => ({
                nombre: `Alumno ${h.matricula}`,
                matricula: h.matricula,
                hora: new Date(h.fecha_hora_registro).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                estado: h.estado_asistencia.toLowerCase() as 'presente' | 'retardo'
              }));
              this.alumnosRegistrados.set(listaMapeada);

              // Feedback visual de 1.5s y reiniciar cámara
              setTimeout(() => {
                this.ultimoEscaneado.set(null);
                this.lecturaBloqueada = false;
                this.escaneando.set(true);
                this.escanearFrame();
              }, 1500);
            },
            error: () => {
              // Fallback básico
              const nuevo: AlumnoRegistrado = {
                nombre: 'Alumno Registrado',
                matricula: 'Confirmado',
                hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                estado: res.estado.toLowerCase() as 'presente' | 'retardo'
              };
              this.ultimoEscaneado.set(nuevo);
              this.alumnosRegistrados.update(list => [nuevo, ...list]);

              setTimeout(() => {
                this.ultimoEscaneado.set(null);
                this.lecturaBloqueada = false;
                this.escaneando.set(true);
                this.escanearFrame();
              }, 1500);
            }
          });
        }
      },
      error: (error) => {
        const errorMsg = error.error?.detail || 'Error al procesar el código QR o asistencia ya registrada.';
        alert(errorMsg);

        setTimeout(() => {
          this.lecturaBloqueada = false;
          this.escaneando.set(true);
          this.escanearFrame();
        }, 1500);
      }
    });
  }

  cargarHistorial() {
    const idSesion = this.sessionId();
    if (!idSesion) return;

    this.asistenciasService.obtenerHistorial(idSesion).subscribe({
      next: (historial: any[]) => {
        const listaMapeada: AlumnoRegistrado[] = historial.map((h: any) => ({
          nombre: `Alumno ${h.matricula}`,
          matricula: h.matricula,
          hora: new Date(h.fecha_hora_registro).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          estado: h.estado_asistencia.toLowerCase() as 'presente' | 'retardo'
        }));
        this.alumnosRegistrados.set(listaMapeada);
      },
      error: (err) => {
        console.error('Error al cargar historial inicial:', err);
      }
    });
  }

  finalizarSesion() {
    const idSesion = this.sessionId();
    if (!idSesion) {
      this.detenerCamara();
      this.estadoSesion.set('finalizada');
      return;
    }

    this.asistenciasService.cerrarSesion(idSesion).subscribe({
      next: () => {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.detenerCamara();
        this.estadoSesion.set('finalizada');
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        // Fallback
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.detenerCamara();
        this.estadoSesion.set('finalizada');
      }
    });
  }

  detenerCamara() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach(t => t.stop());
    this.escaneando.set(false);
    this.camaraActiva.set(false);
  }

  nueva() {
    this.estadoSesion.set('idle');
    this.materiaSeleccionada = '';
    this.alumnosRegistrados.set([]);
    this.tiempoRestante.set(600);
  }

  getInitials(nombre: string): string {
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('');
  }

  get esIdle()      { return this.estadoSesion() === 'idle'; }
  get esActiva()    { return this.estadoSesion() === 'activa'; }
  get esFinalizada(){ return this.estadoSesion() === 'finalizada'; }

  get materiaActual() {
    return this.materias.find(m => m.id_materia === Number(this.materiaSeleccionada));
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.detenerCamara();
  }
}
