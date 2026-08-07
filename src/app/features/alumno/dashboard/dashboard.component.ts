import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { MateriasService } from '../../../core/services/materias.service';
import { PeriodosService } from '../../../core/services/periodos.service';
import { ReportesService } from '../../../core/services/reportes.service';

interface MateriaDashboard {
  materia_id: string;
  nrc: string;
  nombre: string;
  docente: string;
  seccion: string;
  promedio: string;
  asistencia: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private alumnosService = inject(AlumnosService);
  private inscripcionesService = inject(InscripcionesService);
  private materiasService = inject(MateriasService);
  private periodosService = inject(PeriodosService);
  private reportesService = inject(ReportesService);

  isLoading = signal(false);
  errorCarga = signal<string | null>(null);

  periodos: any[] = [];
  periodoSeleccionadoId: string | null = null;
  periodoActivoId: string | null = null;

  alumnoInfo = {
    nombre_completo: 'Alumno',
    matricula: 'N/A',
    tipo_formacion: 'N/A',
    periodo_activo: 'N/A',
    estatus: 'N/A'
  };

  materiasActuales: MateriaDashboard[] = [];

  promedioGeneral = 'N/A';
  asistenciaTotal = 'N/A';
  totalMaterias = 0;

  ngOnInit(): void {
    this.cargarPeriodosYDashboard();
  }

  get primerNombre(): string {
    const nombre = String(this.alumnoInfo.nombre_completo || '').trim();
    return nombre ? nombre.split(/\s+/)[0] : 'Alumno';
  }

  onPeriodoSeleccionadoChange(periodoId: string): void {
    this.periodoSeleccionadoId = periodoId || null;
    this.alumnoInfo.periodo_activo = this.nombrePeriodoSeleccionado();
    this.cargarDashboard();
  }

  private cargarPeriodosYDashboard(): void {
    forkJoin({
      periodos: this.periodosService.getPeriodos(1, 100).pipe(
        catchError(() => of({ items: [] }))
      ),
      periodoActivo: this.periodosService.getPeriodoActivo().pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: ({ periodos, periodoActivo }: any) => {
        this.configurarPeriodos(periodos, periodoActivo);
        this.cargarDashboard();
      },
      error: (err) => {
        console.error('Error al cargar periodos:', err);
        this.cargarDashboard();
      }
    });
  }

  private configurarPeriodos(periodosResponse: any, periodoActivo: any): void {
    this.periodos = this.normalizarLista(periodosResponse?.items || periodosResponse);

    const periodoActivoReal = periodoActivo || this.periodos.find((p: any) => p?.activo === true);
    this.periodoActivoId = this.obtenerPeriodoId(periodoActivoReal);

    const ids = this.periodos.map(p => this.obtenerPeriodoId(p)).filter(Boolean);
    const seleccionActualValida = Boolean(this.periodoSeleccionadoId && ids.includes(this.periodoSeleccionadoId));

    if (!seleccionActualValida) {
      this.periodoSeleccionadoId = this.periodoActivoId || ids[0] || null;
    }

    this.alumnoInfo.periodo_activo = this.nombrePeriodoSeleccionado();
  }

  private cargarDashboard(): void {
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.errorCarga.set('No se encontró una sesión activa.');
      return;
    }

    this.isLoading.set(true);
    this.errorCarga.set(null);

    this.alumnoInfo.nombre_completo =
      user.nombre_completo ||
      user.email ||
      'Alumno';

    this.alumnosService.getAlumnos({ skip: 0, limit: 1000 }).pipe(
      map((alumnos: any[]) => this.resolverAlumnoActual(alumnos, user)),
      switchMap((alumno: any | null) => {
        if (!alumno?.alumno_id) {
          this.errorCarga.set('No se encontró el registro académico del alumno autenticado.');
          return of({
            alumno: null,
            estadisticas: null,
            inscripciones: [],
            materiasInfo: []
          });
        }

        this.aplicarInfoAlumno(alumno);

        return forkJoin({
          estadisticas: this.reportesService.getEstadisticasAlumno(alumno.alumno_id).pipe(
            catchError(() => of(null))
          ),
          inscripciones: this.inscripcionesService.getInscripcionesByAlumno(alumno.alumno_id).pipe(
            catchError(() => of([]))
          )
        }).pipe(
          switchMap(({ estadisticas, inscripciones }) => {
            const inscripcionesPeriodo = this.normalizarLista(inscripciones)
              .filter((ins: any) => this.esInscripcionActiva(ins))
              .filter((ins: any) => this.esInscripcionDelPeriodoSeleccionado(ins));

            if (inscripcionesPeriodo.length === 0) {
              return of({
                alumno,
                estadisticas,
                inscripciones: [],
                materiasInfo: []
              });
            }

            const materiasRequests = inscripcionesPeriodo.map((ins: any) =>
              this.materiasService.getMateriaById(String(ins.materia_id)).pipe(
                catchError(() => of(ins.materia || null))
              )
            );

            return forkJoin(materiasRequests).pipe(
              map((materiasInfo: any[]) => ({
                alumno,
                estadisticas,
                inscripciones: inscripcionesPeriodo,
                materiasInfo
              }))
            );
          })
        );
      })
    ).subscribe({
      next: ({ estadisticas, inscripciones, materiasInfo }: any) => {
        this.construirMateriasActuales(inscripciones, materiasInfo, estadisticas);
        this.calcularResumen();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar dashboard de alumno:', err);
        this.errorCarga.set('No fue posible cargar el dashboard del alumno.');
        this.isLoading.set(false);
      }
    });
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

  private aplicarInfoAlumno(alumno: any): void {
    this.alumnoInfo.nombre_completo =
      alumno?.nombre_completo ||
      alumno?.nombre ||
      this.alumnoInfo.nombre_completo ||
      'Alumno';

    this.alumnoInfo.matricula = alumno?.matricula || 'N/A';

    this.alumnoInfo.tipo_formacion =
      alumno?.tipo_formacion ||
      alumno?.programa ||
      alumno?.carrera ||
      'N/A';

    this.alumnoInfo.estatus = this.formatearEstatus(
      alumno?.estatus_academico ??
      alumno?.estatus ??
      alumno?.estado ??
      alumno?.activo
    );

    this.alumnoInfo.periodo_activo = this.nombrePeriodoSeleccionado();
  }

  private construirMateriasActuales(inscripciones: any[], materiasInfo: any[], estadisticas: any): void {
    const statsMap = this.crearMapaEstadisticas(estadisticas);

    this.materiasActuales = (inscripciones || []).map((ins: any, index: number) => {
      const info = materiasInfo[index] || ins?.materia || {};
      const materiaId = String(ins?.materia_id || info?.materia_id || info?.id || '');
      const nrc = String(ins?.nrc_materia || info?.nrc || 'N/A');
      const stats = statsMap.get(materiaId) || statsMap.get(nrc) || null;

      return {
        materia_id: materiaId,
        nrc,
        nombre:
          info?.nombre ||
          info?.materia?.nombre ||
          info?.materia_nombre ||
          ins?.materia_nombre ||
          'Materia sin nombre',
        docente:
          info?.docente_nombre ||
          info?.docente?.nombre_completo ||
          info?.docente?.nombre ||
          ins?.docente_nombre ||
          'Por asignar',
        seccion:
          ins?.seccion_materia ||
          info?.seccion ||
          'N/A',
        promedio: this.formatearNumero(stats?.promedio ?? stats?.promedio_final),
        asistencia: this.formatearPorcentaje(stats?.porcentaje_asistencia)
      };
    });

    this.totalMaterias = this.materiasActuales.length;
  }

  private calcularResumen(): void {
    this.promedioGeneral = this.formatearNumero(this.promedioDesdeMaterias());
    this.asistenciaTotal = this.formatearPorcentaje(this.asistenciaDesdeMaterias());
  }

  private promedioDesdeMaterias(): number | null {
    const valores = this.materiasActuales
      .map((m) => Number(m.promedio))
      .filter((v) => Number.isFinite(v));

    if (valores.length === 0) return null;

    return valores.reduce((sum, value) => sum + value, 0) / valores.length;
  }

  private asistenciaDesdeMaterias(): number | null {
    const valores = this.materiasActuales
      .map((m) => Number(String(m.asistencia).replace('%', '')))
      .filter((v) => Number.isFinite(v));

    if (valores.length === 0) return null;

    return valores.reduce((sum, value) => sum + value, 0) / valores.length;
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

  private esInscripcionDelPeriodoSeleccionado(inscripcion: any): boolean {
    const periodoInscripcionId = this.obtenerPeriodoId(inscripcion);

    return Boolean(
      this.periodoSeleccionadoId &&
      periodoInscripcionId &&
      periodoInscripcionId === this.periodoSeleccionadoId
    );
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

  private nombrePeriodoSeleccionado(): string {
    const periodo = this.periodos.find((p: any) => this.obtenerPeriodoId(p) === this.periodoSeleccionadoId);
    return periodo?.nombre || 'Periodo no disponible';
  }

  private normalizarLista(res: any): any[] {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.resultados)) return res.resultados;
    return [];
  }

  private formatearNumero(valor: unknown): string {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return 'N/A';
    return numero.toFixed(1);
  }

  private formatearPorcentaje(valor: unknown): string {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return 'N/A';
    return `${Number(numero.toFixed(1))}%`;
  }

  private formatearEstatus(valor: unknown): string {
    if (valor === true) return 'Activo';
    if (valor === false) return 'Inactivo';

    const texto = String(valor || '').trim();

    if (!texto) return 'N/A';

    const normalizado = texto.toLowerCase();

    if (['true', 'activo', 'activa', 'regular'].includes(normalizado)) return 'Activo';
    if (['false', 'inactivo', 'inactiva', 'baja', 'cancelado', 'cancelada'].includes(normalizado)) return 'Inactivo';

    return texto;
  }
}
