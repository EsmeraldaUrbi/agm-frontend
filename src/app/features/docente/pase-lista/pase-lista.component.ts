import { Component, signal, computed, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

  estadoSesion = signal<EstadoSesion>('idle');

  materiaSeleccionada = '';
  materias = [
    { nrc: '15842', nombre: 'Arquitectura de Servicios Web', seccion: '101' },
    { nrc: '15845', nombre: 'Ingeniería de Software II',     seccion: '102' },
    { nrc: '16021', nombre: 'Programación Paralela',         seccion: '101' },
    { nrc: '16110', nombre: 'Seguridad de la Información',   seccion: '104' },
  ];

  sessionId   = signal<string>('');
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

  iniciarSesion() {
    if (!this.materiaSeleccionada) return;

    const mockSessionId    = 'sess-' + Math.random().toString(36).slice(2, 10);
    const mockSessionToken = Math.random().toString(36).slice(2, 18).toUpperCase();

    this.sessionId.set(mockSessionId);
    this.sessionToken.set(mockSessionToken);
    
    // Iniciar countdown
    this.tiempoRestante.set(600);
    this.alumnosRegistrados.set([]);
    this.estadoSesion.set('activa');

    this.timerInterval = setInterval(() => {
      if (this.tiempoRestante() <= 0) {
        this.finalizarSesion();
        return;
      }
      this.tiempoRestante.update(t => t - 1);
    }, 1000);

    // Timeout to ensure DOM is updated to 'activa' before accessing videoEl
    setTimeout(() => this.iniciarCamara(), 100);
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
    if (!this.videoEl || !this.canvasEl) return;
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

      if (code && code.data) {
        this.procesarQR(code.data);
      }
    }

    if (this.escaneando()) {
      this.rafId = requestAnimationFrame(() => this.escanearFrame());
    }
  }

  procesarQR(data: string) {
    // Mock processing logic
    // Extraemos matricula mock de la data o generamos una
    const matriculaDetectada = data.match(/\d+/) ? data.match(/\d+/)![0] : '202100000';
    
    const yaRegistrado = this.alumnosRegistrados().some(a => a.matricula === matriculaDetectada);
    if (yaRegistrado) return;

    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const minutosTranscurridos = Math.floor((600 - this.tiempoRestante()) / 60);
    const estado: 'presente' | 'retardo' = minutosTranscurridos <= 5 ? 'presente' : 'retardo';

    const nuevo: AlumnoRegistrado = {
      nombre: 'Alumno Escaneado (' + matriculaDetectada.slice(-3) + ')',
      matricula: matriculaDetectada,
      hora,
      estado
    };

    // Prepend to array
    this.alumnosRegistrados.update(list => [nuevo, ...list]);
    this.ultimoEscaneado.set(nuevo);
    this.escaneando.set(false);

    // Pausar escáner brevemente para mostrar feedback
    setTimeout(() => {
      this.ultimoEscaneado.set(null);
      this.escaneando.set(true);
      this.escanearFrame();
    }, 1500);
  }

  finalizarSesion() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.detenerCamara();
    this.estadoSesion.set('finalizada');
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

  get esIdle()      { return this.estadoSesion() === 'idle'; }
  get esActiva()    { return this.estadoSesion() === 'activa'; }
  get esFinalizada(){ return this.estadoSesion() === 'finalizada'; }

  get materiaActual() {
    return this.materias.find(m => m.nrc === this.materiaSeleccionada);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.detenerCamara();
  }
}
