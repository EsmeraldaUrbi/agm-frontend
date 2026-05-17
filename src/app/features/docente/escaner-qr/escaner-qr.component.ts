import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import jsQR from 'jsqr';

interface AlumnoEscaneado {
  nombre: string;
  matricula: string;
  hora: string;
  estado: 'presente' | 'retardo';
}

@Component({
  selector: 'app-escaner-qr',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './escaner-qr.component.html'
})
export class EscanerQrComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl', { static: true }) videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl', { static: true }) canvasEl!: ElementRef<HTMLCanvasElement>;

  // Datos de sesión desde URL params
  sessionId    = '';
  sessionToken = '';
  materia      = 'Arquitectura de Servicios Web'; // Vendrá del backend

  // Estado del escáner
  camaraActiva     = signal(false);
  escaneando       = signal(false);
  errorCamara      = signal('');
  ultimoEscaneado  = signal<AlumnoEscaneado | null>(null);

  // Contador de tiempo
  tiempoRestante = signal(600);
  tiempoFormateado = () => {
    const m = Math.floor(this.tiempoRestante() / 60).toString().padStart(2, '0');
    const s = (this.tiempoRestante() % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Registro de alumnos
  alumnosEscaneados = signal<AlumnoEscaneado[]>([]);
  presentes  = () => this.alumnosEscaneados().filter(a => a.estado === 'presente').length;
  retardos   = () => this.alumnosEscaneados().filter(a => a.estado === 'retardo').length;
  pendientes = () => 35 - this.alumnosEscaneados().length;

  private stream: MediaStream | null = null;
  private rafId: number | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  sesionFinalizada = signal(false);

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Leer parámetros de la URL (?session=...&token=...)
    this.route.queryParams.subscribe(params => {
      this.sessionId    = params['session'] ?? '';
      this.sessionToken = params['token']   ?? '';
    });

    // Iniciar timer
    this.timerInterval = setInterval(() => {
      if (this.tiempoRestante() <= 0) {
        this.finalizarSesion();
        return;
      }
      this.tiempoRestante.update(t => t - 1);
    }, 1000);

    // Iniciar cámara automáticamente
    this.iniciarCamara();
  }

  async iniciarCamara() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Cámara trasera en móvil
      });
      this.videoEl.nativeElement.srcObject = this.stream;
      await this.videoEl.nativeElement.play();
      this.camaraActiva.set(true);
      this.escaneando.set(true);
      this.escanearFrame();
    } catch (err) {
      this.errorCamara.set('No se pudo acceder a la cámara. Verifique los permisos.');
      console.error(err);
    }
  }

  escanearFrame() {
    const video  = this.videoEl.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    const ctx    = canvas.getContext('2d')!;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        this.procesarQR(code.data);
      }
    }

    if (this.escaneando()) {
      this.rafId = requestAnimationFrame(() => this.escanearFrame());
    }
  }

  procesarQR(data: string) {
    // Aquí se hará POST :8005/asistencias/registrar con { qrData: data, sessionId }
    // Mock: simular respuesta del backend
    const yaRegistrado = this.alumnosEscaneados().some(a => a.matricula === '202199999');
    if (yaRegistrado) return; // Anti-duplicado local (el backend también lo valida)

    const ahora = new Date();
    const hora  = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const minutosTranscurridos = Math.floor((600 - this.tiempoRestante()) / 60);
    const estado: 'presente' | 'retardo' = minutosTranscurridos <= 5 ? 'presente' : 'retardo';

    const nuevo: AlumnoEscaneado = {
      nombre:    'Alumno Escaneado',
      matricula: '202199999',
      hora,
      estado
    };

    this.alumnosEscaneados.update(list => [nuevo, ...list]);
    this.ultimoEscaneado.set(nuevo);

    // Pausar el escáner 2 segundos para mostrar confirmación
    this.escaneando.set(false);
    setTimeout(() => {
      this.ultimoEscaneado.set(null);
      this.escaneando.set(true);
      this.escanearFrame();
    }, 2000);
  }

  finalizarSesion() {
    // DELETE :8005/sesiones/:id/cerrar
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach(t => t.stop());
    this.escaneando.set(false);
    this.sesionFinalizada.set(true);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach(t => t.stop());
  }
}
