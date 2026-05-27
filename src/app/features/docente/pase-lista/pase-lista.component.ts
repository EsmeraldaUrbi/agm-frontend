import { Component, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsistenciasService } from '../../../core/services/asistencias.service';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';
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
export class PaseListaComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl', { static: false }) videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl', { static: false }) canvasEl!: ElementRef<HTMLCanvasElement>;

  private asistenciasService = inject(AsistenciasService);
  private authService = inject(AuthService);
  private docentesService = inject(DocentesService);
  private materiasService = inject(MateriasService);

  estadoSesion = signal<EstadoSesion>('idle');

  materiaSeleccionada = '';
  materias: any[] = [];
  docenteId: string | null = null;
  isLoading = signal(false);

  ngOnInit() {
    this.resolverDocenteYCargarCursos();
  }

  resolverDocenteYCargarCursos() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.isLoading.set(true);
    this.docentesService.getDocentes().subscribe({
      next: (docentes) => {
        const matchingDocente = docentes.find(d => {
          const docenteEmail = (d as any).email || d.correo || '';
          return docenteEmail.toLowerCase() === user.email.toLowerCase();
        });
        if (matchingDocente && matchingDocente.docente_id) {
          this.docenteId = matchingDocente.docente_id;
          this.cargarCursos(matchingDocente.docente_id);
        } else {
          this.docenteId = user.user_id;
          this.cargarCursos(user.user_id);
        }
      },
      error: (err) => {
        console.error('Error al resolver docente:', err);
        this.docenteId = user.user_id;
        this.cargarCursos(user.user_id);
      }
    });
  }

  cargarCursos(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId).subscribe({
      next: (res) => {
        this.materias = res.items || [];
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar materias:', err);
        this.isLoading.set(false);
      }
    });
  }

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

  idSesionInput: number | null = null;

  iniciarSesion() {
    if (!this.materiaSeleccionada) return;

    const idMateria = String(this.materiaSeleccionada);

    this.asistenciasService.iniciarSesion(idMateria).subscribe({
      next: (sesion) => this.activarSesion(sesion),
      error: (error) => this.manejarErrorSesion(error, 'No se pudo iniciar la sesión de asistencia.')
    });
  }

  reanudarSesion() {
    if (!this.idSesionInput || this.idSesionInput <= 0) {
      alert("Ingrese un ID de sesión válido.");
      return;
    }
    
    this.asistenciasService.obtenerSesion(this.idSesionInput).subscribe({
      next: (sesion) => {
        if (sesion.estado_sesion !== 'ACTIVA') {
          alert(`Esta sesión no está activa (Estado: ${sesion.estado_sesion}).`);
          return;
        }
        // Configurar la materia seleccionada para la UI
        this.materiaSeleccionada = String(sesion.id_materia);
        this.activarSesion(sesion);
      },
      error: (error) => this.manejarErrorSesion(error, 'No se pudo reanudar la sesión.')
    });
  }

  private activarSesion(sesion: any) {
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
  }

  private manejarErrorSesion(error: any, defaultMsg: string) {
    console.error('Error de sesión:', error);
    let msg = defaultMsg;
    if (error.error?.detail) {
      if (typeof error.error.detail === 'string') {
        msg = error.error.detail;
      } else if (Array.isArray(error.error.detail)) {
        msg = error.error.detail.map((e: any) => e.msg).join(', ');
      }
    }
    alert(msg);
  }

  async iniciarCamara() {
    this.errorCamara.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } } // Cámara trasera en móvil si está disponible, o webcam en PC
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
        let msg = 'Error al procesar el código QR o asistencia ya registrada.';
        if (error.error?.detail) {
          if (typeof error.error.detail === 'string') {
            msg = error.error.detail;
          } else if (Array.isArray(error.error.detail)) {
            msg = error.error.detail.map((e: any) => e.msg).join(', ');
          }
        }
        alert(msg);

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
    return this.materias.find(m => String(m.materia_id) === String(this.materiaSeleccionada));
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.detenerCamara();
  }
}
