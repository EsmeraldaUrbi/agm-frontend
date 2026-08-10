import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HorarioComponent } from '../../../shared/components/horario/horario.component';
import { SolicitarBajaComponent } from '../solicitar-baja/solicitar-baja.component';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { PeriodosService } from '../../../core/services/periodos.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-mis-materias',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HorarioComponent, SolicitarBajaComponent],
  templateUrl: './mis-materias.component.html',
  styleUrl: './mis-materias.component.css'
})
export class MisMateriasComponent implements OnInit {
  mostrarHorarioModal = false;
  mostrarBajaModal = false;
  cargando = true;
  mensajeExito: string | null = null;

  filtroActivo: 'todas' | 'activas' | 'bajas' = 'todas';

  materias: any[] = [];
  scheduleData: any[] = [];
  periodos: any[] = [];

  periodoSeleccionadoId: string | null = null;
  periodoActivoId: string | null = null;
  periodoActivoNombre = 'Periodo por consultar';

  alumnoId: string | null = null;
  materiaSeleccionada: any = null;

  private inscripcionesAlumno: any[] = [];
  private inscripcionesHorarioActivo: any[] = [];
  private materiasInfoMap = new Map<string, any>();
  private statsMap = new Map<string, any>();

  private inscripcionesService = inject(InscripcionesService);
  private materiasService = inject(MateriasService);
  private alumnosService = inject(AlumnosService);
  private authService = inject(AuthService);
  private reportesService = inject(ReportesService);
  private periodosService = inject(PeriodosService);

  ngOnInit() {
    this.cargarDatos();
  }

  get materiasFiltradas() {
    if (this.filtroActivo === 'activas') {
      return this.materias.filter(m => m.activa);
    }

    if (this.filtroActivo === 'bajas') {
      return this.materias.filter(m => !m.activa);
    }

    return this.materias;
  }

  get totalMateriasHorario(): number {
    return this.inscripcionesHorarioActivo.length;
  }

  get periodoSeleccionadoNombre(): string {
    const periodo = this.periodos.find(p => this.obtenerPeriodoId(p) === this.periodoSeleccionadoId);
    return periodo?.nombre || 'Periodo no disponible';
  }

  onPeriodoSeleccionadoChange(periodoId: string) {
    this.periodoSeleccionadoId = periodoId || null;
    this.actualizarMateriasPeriodoSeleccionado();
  }

  cargarDatos() {
    this.cargando = true;

    const user = this.authService.getCurrentUser();

    if (!user) {
      this.limpiarVista();
      return;
    }

    forkJoin({
      periodos: this.periodosService.getPeriodos(1, 100).pipe(
        catchError(() => of({ items: [] }))
      ),
      periodoActivo: this.periodosService.getPeriodoActivo().pipe(
        catchError(() => of(null))
      ),
      alumnos: this.alumnosService.getAlumnos({ limit: 1000 }).pipe(
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ periodos, periodoActivo, alumnos }: any) => {
        this.configurarPeriodos(periodos, periodoActivo);

        const miRegistro = this.resolverAlumnoActual(alumnos, user);

        if (!miRegistro?.alumno_id) {
          this.alumnoId = null;
          this.limpiarVista();
          return;
        }

        this.alumnoId = miRegistro.alumno_id;

        this.inscripcionesService.getInscripcionesByAlumno(miRegistro.alumno_id).pipe(
          catchError((err) => {
            console.error('Error al cargar inscripciones del alumno:', err);
            return of([]);
          })
        ).subscribe((inscripciones: any) => {
          this.inscripcionesAlumno = this.normalizarLista(inscripciones);
          this.cargarComplementosAcademicos();
        });
      },
      error: (err) => {
        console.error('Error al cargar datos académicos del alumno:', err);
        this.limpiarVista();
      }
    });
  }

  private cargarComplementosAcademicos(): void {
    const inscripciones = this.inscripcionesAlumno;

    if (inscripciones.length === 0) {
      this.limpiarVista(false);
      return;
    }

    this.inscripcionesHorarioActivo = inscripciones.filter((ins: any) =>
      this.esInscripcionActiva(ins) &&
      this.esInscripcionDelPeriodo(ins, this.periodoActivoId)
    );

    const infoPeticiones = inscripciones.map((ins: any) =>
      this.materiasService.getMateriaById(ins.materia_id).pipe(
        catchError(() => of(ins.materia || null))
      )
    );

    const horariosPeticiones = this.inscripcionesHorarioActivo.map((ins: any) =>
      this.materiasService.getHorarios({ materia_ofertada_id: ins.materia_id }).pipe(
        catchError(() => of([]))
      )
    );

    const statsPeticion = this.alumnoId
      ? this.reportesService.getEstadisticasAlumno(this.alumnoId).pipe(
          catchError(() => of({ estadisticas: [] }))
        )
      : of({ estadisticas: [] });

    forkJoin({
      materiasInfo: infoPeticiones.length ? forkJoin(infoPeticiones) : of([]),
      horariosActivo: horariosPeticiones.length ? forkJoin(horariosPeticiones) : of([]),
      stats: statsPeticion
    }).subscribe({
      next: ({ materiasInfo, horariosActivo, stats }: any) => {
        this.materiasInfoMap.clear();

        inscripciones.forEach((ins: any, index: number) => {
          const materiaId = String(ins?.materia_id || '');
          this.materiasInfoMap.set(materiaId, materiasInfo[index] || ins?.materia || null);
        });

        this.statsMap = this.crearMapaEstadisticas(stats);

        this.actualizarMateriasPeriodoSeleccionado();
        this.actualizarHorarioActivo(horariosActivo);

        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar materias, horarios o estadísticas:', err);
        this.limpiarVista(false);
      }
    });
  }

  private actualizarMateriasPeriodoSeleccionado(): void {
    const inscripcionesPeriodo = this.inscripcionesAlumno.filter((ins: any) =>
      this.esInscripcionDelPeriodo(ins, this.periodoSeleccionadoId)
    );

    this.materias = inscripcionesPeriodo.map((ins: any) => {
      const info = this.materiasInfoMap.get(String(ins?.materia_id || '')) || {};
      const promedio = this.statsMap.get(String(ins?.materia_id || ''))?.promedio;

      return {
        materia_id: ins.materia_id,
        inscripcion_id: ins.inscripcion_id,
        periodo_id: this.obtenerPeriodoIdInscripcion(ins),
        nrc: ins.nrc_materia || info?.nrc || 'S/N',
        nombre: info?.nombre || ins?.materia_nombre || 'Materia sin nombre',
        docente: info?.docente_nombre || ins?.docente_nombre || 'Asignado',
        creditos: info?.creditos || 6,
        promedio: promedio !== undefined && promedio !== null ? Number(promedio).toFixed(1) : 'N/A',
        activa: this.esInscripcionActiva(ins)
      };
    });
  }

  private actualizarHorarioActivo(horariosActivo: any[][]): void {
    const allHorarios: any[] = [];

    horariosActivo.forEach((horariosMateria: any[], index: number) => {
      const inscripcion = this.inscripcionesHorarioActivo[index];
      const info = this.materiasInfoMap.get(String(inscripcion?.materia_id || ''));

      horariosMateria.forEach(h => {
        allHorarios.push({
          ...h,
          materia_nombre: info?.nombre || 'Materia',
          materia_id: inscripcion.materia_id
        });
      });
    });

    this.scheduleData = allHorarios;
  }

  private configurarPeriodos(periodosResponse: any, periodoActivo: any): void {
    this.periodos = this.normalizarLista(periodosResponse?.items || periodosResponse);

    const periodoActivoReal = periodoActivo || this.periodos.find((p: any) => p?.activo === true);
    this.periodoActivoId = this.obtenerPeriodoId(periodoActivoReal);
    this.periodoActivoNombre = periodoActivoReal?.nombre || 'Periodo no disponible';

    const ids = this.periodos.map(p => this.obtenerPeriodoId(p)).filter(Boolean);
    const seleccionActualValida = Boolean(this.periodoSeleccionadoId && ids.includes(this.periodoSeleccionadoId));

    if (!seleccionActualValida) {
      this.periodoSeleccionadoId = this.periodoActivoId || ids[0] || null;
    }
  }

  private resolverAlumnoActual(alumnos: any[], user: any): any | null {
    const userId = String(user?.user_id || user?.id || '').trim();
    const email = String(user?.email || user?.correo || '').trim().toLowerCase();

    return (alumnos || []).find((alumno: any) => {
      const alumnoUserId = String(alumno?.user_id || alumno?.usuario_id || '').trim();
      const alumnoCorreo = String(alumno?.correo || alumno?.email || '').trim().toLowerCase();

      return Boolean(
        (userId && alumnoUserId && alumnoUserId === userId) ||
        (email && alumnoCorreo && alumnoCorreo === email)
      );
    }) || null;
  }

  private crearMapaEstadisticas(estadisticas: any): Map<string, any> {
    const mapStats = new Map<string, any>();
    const lista = this.normalizarLista(
      estadisticas?.estadisticas ||
      estadisticas?.materias ||
      estadisticas?.data?.estadisticas ||
      []
    );

    lista.forEach((stat: any) => {
      if (stat?.materia_id) {
        mapStats.set(String(stat.materia_id), stat);
      }

      if (stat?.nrc) {
        mapStats.set(String(stat.nrc), stat);
      }
    });

    return mapStats;
  }

  private esInscripcionActiva(inscripcion: any): boolean {
    const estado = String(
      inscripcion?.estado ||
      inscripcion?.estado_inscripcion ||
      ''
    ).trim().toUpperCase();

    return inscripcion?.activa !== false &&
      !['BAJA', 'BAJA_ACADEMICA', 'INACTIVA', 'CANCELADA'].includes(estado);
  }

  private esInscripcionDelPeriodo(inscripcion: any, periodoId: string | null): boolean {
    const periodoInscripcionId = this.obtenerPeriodoIdInscripcion(inscripcion);

    return Boolean(
      periodoId &&
      periodoInscripcionId &&
      periodoInscripcionId === periodoId
    );
  }

  private obtenerPeriodoIdInscripcion(inscripcion: any): string | null {
    return this.obtenerPeriodoId(inscripcion) ||
      this.obtenerPeriodoId(this.materiasInfoMap.get(String(inscripcion?.materia_id || '')));
  }

  obtenerPeriodoId(valor: any): string | null {
    const id = valor?.periodo_id ||
      valor?.id_periodo ||
      valor?.periodo?.periodo_id ||
      valor?.periodo?.id ||
      valor?.id;

    return id ? String(id).trim() : null;
  }

  etiquetaPeriodo(periodo: any): string {
    const nombre = periodo?.nombre || 'Periodo sin nombre';
    const id = this.obtenerPeriodoId(periodo);

    return id && id === this.periodoActivoId ? `${nombre} (Activo)` : nombre;
  }

  private normalizarLista(valor: any): any[] {
    if (Array.isArray(valor)) return valor;
    if (Array.isArray(valor?.data)) return valor.data;
    if (Array.isArray(valor?.items)) return valor.items;
    if (Array.isArray(valor?.results)) return valor.results;
    return [];
  }

  private limpiarVista(resetLoading = true): void {
    this.materias = [];
    this.scheduleData = [];
    this.inscripcionesAlumno = [];
    this.inscripcionesHorarioActivo = [];
    this.materiasInfoMap.clear();
    this.statsMap.clear();

    if (resetLoading) {
      this.cargando = false;
    } else {
      this.cargando = false;
    }
  }

  cerrarMensajeExito() {
    this.mensajeExito = null;
  }

  abrirHorario() {
    this.mostrarHorarioModal = true;
  }

  cerrarHorario() {
    this.mostrarHorarioModal = false;
  }

  abrirBaja(materia: any) {
    this.materiaSeleccionada = materia;
    this.mostrarBajaModal = true;
  }

  cerrarBaja() {
    this.materiaSeleccionada = null;
    this.mostrarBajaModal = false;
  }

  ejecutarBaja() {
    if (!this.alumnoId || !this.materiaSeleccionada || !this.materiaSeleccionada.materia_id) {
      console.error('No se pudo determinar la información para dar de baja.');
      return;
    }

    const nombreMateria = this.materiaSeleccionada?.nombre || 'La materia';
    this.mensajeExito = null;

    this.alumnosService.bajaMateria(this.alumnoId, this.materiaSeleccionada.materia_id).subscribe({
      next: () => {
        this.mensajeExito = `${nombreMateria} fue dada de baja correctamente.`;
        this.cargarDatos();
        this.cerrarBaja();
      },
      error: (err: any) => {
        console.error('Error al intentar dar de baja la materia:', err);
        alert('Ocurrió un error al procesar la baja.');
      }
    });
  }
}
