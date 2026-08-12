import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SolicitarBajaComponent } from '../solicitar-baja/solicitar-baja.component';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { PeriodosService } from '../../../core/services/periodos.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

interface ActividadAgrupada {
  categoria: string;
  porcentaje: number;
  items: any[];
}

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, SolicitarBajaComponent],
  templateUrl: './calificaciones.component.html'
})
export class CalificacionesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private calificacionesService = inject(CalificacionesService);
  private materiasService = inject(MateriasService);
  private authService = inject(AuthService);
  private alumnosService = inject(AlumnosService);
  private inscripcionesService = inject(InscripcionesService);
  private periodosService = inject(PeriodosService);

  mostrarBajaModal = false;

  materiaInfo = signal<any>(null);
  actividades = signal<any[]>([]);
  calificaciones = signal<any[]>([]);
  actividadesAgrupadas = signal<ActividadAgrupada[]>([]);
  promedioActual = signal<number>(0);

  cargando = signal(false);
  errorCarga = signal<string | null>(null);
  procesandoBaja = signal(false);
  puedeSolicitarBaja = signal(false);
  inscripcionActual = signal<any | null>(null);

  private materiaIdActual: string | null = null;
  private alumnoActual: any | null = null;
  private periodoActivoId: string | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const materiaId = params.get('materiaId');

      if (materiaId) {
        this.cargarDatosMateria(materiaId);
      }
    });
  }

  get mensajeBajaNoDisponible(): string {
    const inscripcion = this.inscripcionActual();

    if (!inscripcion) {
      return 'No se encontró una inscripción activa para esta materia.';
    }

    if (!this.esInscripcionActiva(inscripcion)) {
      return 'Esta materia ya fue dada de baja. Solo está disponible para consulta.';
    }

    if (!this.esInscripcionDelPeriodoActivo(inscripcion)) {
      return 'La baja solo está disponible para materias del periodo activo.';
    }

    return 'La baja no está disponible para esta materia.';
  }

  cargarDatosMateria(materiaId: string) {
    const user = this.authService.getCurrentUser();

    this.materiaIdActual = materiaId;
    this.limpiarDetalle();
    this.errorCarga.set(null);

    if (!user) {
      this.errorCarga.set('No se encontró una sesión activa.');
      return;
    }

    this.cargando.set(true);

    forkJoin({
      materia: this.materiasService.getMateriaById(materiaId).pipe(
        catchError((err) => {
          console.error('Error al cargar materia:', err);
          return of(null);
        })
      ),
      alumnos: this.alumnosService.getAlumnos({ limit: 1000 }).pipe(
        catchError((err) => {
          console.error('Error al cargar alumnos:', err);
          return of([]);
        })
      ),
      periodoActivo: this.periodosService.getPeriodoActivo().pipe(
        catchError(() => of(null))
      )
    }).pipe(
      switchMap(({ materia, alumnos, periodoActivo }: any) => {
        this.materiaInfo.set(materia);
        this.periodoActivoId = this.obtenerPeriodoId(periodoActivo);

        const alumno = this.resolverAlumnoActual(this.normalizarLista(alumnos), user);

        if (!alumno?.alumno_id) {
          this.errorCarga.set('No se encontró el registro académico del alumno autenticado.');
          return of(null);
        }

        this.alumnoActual = alumno;

        return forkJoin({
          inscripciones: this.inscripcionesService.getInscripcionesByAlumno(alumno.alumno_id).pipe(
            catchError((err) => {
              console.error('Error al cargar inscripción del alumno:', err);
              return of([]);
            })
          ),
          ponderacion: this.calificacionesService.getPonderaciones(materiaId).pipe(
            catchError(() => of(null))
          ),
          actividades: this.calificacionesService.getActividadesByMateria(materiaId).pipe(
            catchError(() => of([]))
          ),
          calificaciones: this.calificacionesService.getCalificacionesAlumnoMateria(alumno.alumno_id, materiaId).pipe(
            catchError(() => of([]))
          )
        }).pipe(
          map((detalle: any) => ({
            materia,
            alumno,
            ...detalle
          }))
        );
      }),
      catchError((err) => {
        console.error('Error cargando detalle de calificaciones:', err);
        this.errorCarga.set('No fue posible cargar el detalle de calificaciones.');
        return of(null);
      }),
      finalize(() => this.cargando.set(false))
    ).subscribe((data: any | null) => {
      if (!data) return;

      const inscripcion = this.resolverInscripcionActual(data.inscripciones, materiaId);
      this.inscripcionActual.set(inscripcion);
      this.puedeSolicitarBaja.set(
        Boolean(inscripcion) &&
        this.esInscripcionActiva(inscripcion) &&
        this.esInscripcionDelPeriodoActivo(inscripcion)
      );

      this.construirDetalleCalificaciones(
        this.normalizarLista(data.actividades),
        this.normalizarLista(data.calificaciones),
        data.ponderacion
      );
    });
  }

  abrirBaja() {
    if (!this.puedeSolicitarBaja()) {
      alert(this.mensajeBajaNoDisponible);
      return;
    }

    this.mostrarBajaModal = true;
  }

  cerrarBaja() {
    this.mostrarBajaModal = false;
  }

  ejecutarBaja() {
    if (this.procesandoBaja()) return;

    const materiaId = this.materiaIdActual || this.route.snapshot.paramMap.get('materiaId');
    const alumnoId = this.alumnoActual?.alumno_id;
    const nombreMateria = this.materiaInfo()?.nombre || 'La materia';

    if (!materiaId || !alumnoId) {
      alert('No se pudo determinar la información para dar de baja.');
      return;
    }

    if (!this.puedeSolicitarBaja()) {
      alert(this.mensajeBajaNoDisponible);
      return;
    }

    this.procesandoBaja.set(true);

    this.alumnosService.bajaMateria(alumnoId, materiaId).pipe(
      finalize(() => this.procesandoBaja.set(false))
    ).subscribe({
      next: () => {
        this.cerrarBaja();

        this.router.navigate(['/alumno/materias'], {
          state: {
            bajaExitosa: true,
            mensaje: `${nombreMateria} fue dada de baja correctamente.`
          }
        });
      },
      error: (err: any) => {
        console.error('Error al dar de baja:', err);

        const detail = String(err?.error?.detail || err?.message || '');

        if (detail.includes('ya dada de baja')) {
          this.cerrarBaja();

          this.router.navigate(['/alumno/materias'], {
            state: {
              bajaExitosa: true,
              mensaje: `${nombreMateria} ya se encontraba dada de baja.`
            }
          });

          return;
        }

        alert('No se pudo dar de baja la materia.');
      }
    });
  }

  private construirDetalleCalificaciones(actividades: any[], calificaciones: any[], ponderacion: any): void {
    const calificacionesMap = this.crearMapaCalificaciones(calificaciones);

    const actividadesMapeadas = actividades.map((actividad: any) => {
      const actividadId = String(
        actividad?.actividad_id ||
        actividad?.id ||
        ''
      );

      const calificacionObj = calificacionesMap.get(actividadId);
      const calificacion = this.obtenerNumero(
        calificacionObj?.calificacion ??
        calificacionObj?.valor ??
        calificacionObj?.nota
      );

      return {
        ...actividad,
        actividad_id: actividadId || actividad?.actividad_id,
        calificacion,
        observaciones: calificacionObj?.observaciones || ''
      };
    });

    this.actividades.set(actividadesMapeadas);
    this.calificaciones.set(calificaciones);
    this.actividadesAgrupadas.set(this.agruparActividades(actividadesMapeadas, ponderacion));
    this.promedioActual.set(this.calcularPromedio(actividadesMapeadas, ponderacion));
  }

  private agruparActividades(actividades: any[], ponderacion: any): ActividadAgrupada[] {
    const criterios = this.normalizarLista(ponderacion?.criterios);

    if (criterios.length === 0) {
      return [{
        categoria: 'Actividades Generales',
        porcentaje: 100,
        items: actividades
      }];
    }

    const actividadesAsignadas = new Set<any>();

    const grupos: ActividadAgrupada[] = criterios.map((criterio: any) => {
      const items = actividades.filter((actividad: any) =>
        this.actividadPerteneceACriterio(actividad, criterio)
      );

      items.forEach((item: any) => actividadesAsignadas.add(item));

      return {
        categoria: criterio?.nombre || criterio?.categoria || 'Criterio sin nombre',
        porcentaje: this.obtenerNumero(criterio?.porcentaje) ?? 0,
        items
      };
    }).filter((grupo: ActividadAgrupada) => grupo.items.length > 0 || grupo.porcentaje > 0);

    const sinAsignar = actividades.filter((actividad: any) => !actividadesAsignadas.has(actividad));

    if (sinAsignar.length > 0) {
      grupos.push({
        categoria: 'Actividades Generales',
        porcentaje: grupos.length > 0 ? 0 : 100,
        items: sinAsignar
      });
    }

    if (grupos.length === 0) {
      return [{
        categoria: 'Actividades Generales',
        porcentaje: 100,
        items: actividades
      }];
    }

    return grupos;
  }

  private calcularPromedio(actividades: any[], ponderacion: any): number {
    const actividadesConCalificacion = actividades.filter((actividad: any) =>
      this.obtenerNumero(actividad?.calificacion) !== null
    );

    if (actividadesConCalificacion.length === 0) return 0;

    const criterios = this.normalizarLista(ponderacion?.criterios);

    if (criterios.length === 0) {
      return this.redondearPromedio(this.promedioSimple(actividadesConCalificacion));
    }

    let acumuladoPonderado = 0;
    let porcentajeUsado = 0;

    criterios.forEach((criterio: any) => {
      const porcentaje = this.obtenerNumero(criterio?.porcentaje) ?? 0;

      if (porcentaje <= 0) return;

      const actividadesCriterio = actividadesConCalificacion.filter((actividad: any) =>
        this.actividadPerteneceACriterio(actividad, criterio)
      );

      if (actividadesCriterio.length === 0) return;

      acumuladoPonderado += this.promedioSimple(actividadesCriterio) * (porcentaje / 100);
      porcentajeUsado += porcentaje;
    });

    if (porcentajeUsado > 0) {
      return this.redondearPromedio(acumuladoPonderado);
    }

    return this.redondearPromedio(this.promedioSimple(actividadesConCalificacion));
  }

  private promedioSimple(actividades: any[]): number {
    const valores = actividades
      .map((actividad: any) => this.obtenerNumero(actividad?.calificacion))
      .filter((valor: number | null): valor is number => valor !== null);

    if (valores.length === 0) return 0;

    return valores.reduce((sum, value) => sum + value, 0) / valores.length;
  }

  private actividadPerteneceACriterio(actividad: any, criterio: any): boolean {
    const criterioIds = [
      criterio?.criterio_id,
      criterio?.id,
      criterio?.ponderacion_criterio_id,
      criterio?.criterio?.id,
      criterio?.criterio?.criterio_id
    ]
      .filter(Boolean)
      .map((value: any) => String(value).trim());

    const actividadIds = [
      actividad?.criterio_id,
      actividad?.criterio?.id,
      actividad?.criterio?.criterio_id,
      actividad?.ponderacion_criterio_id,
      actividad?.criterio_ponderacion_id,
      actividad?.ponderacion_id,
      actividad?.categoria_id
    ]
      .filter(Boolean)
      .map((value: any) => String(value).trim());

    if (criterioIds.some((id: string) => actividadIds.includes(id))) {
      return true;
    }

    const criterioNombre = String(criterio?.nombre || criterio?.categoria || '').trim().toLowerCase();
    const nombresActividad = [
      actividad?.criterio_nombre,
      actividad?.categoria,
      actividad?.tipo_actividad,
      actividad?.tipo
    ]
      .filter(Boolean)
      .map((value: any) => String(value).trim().toLowerCase());

    return Boolean(criterioNombre && nombresActividad.includes(criterioNombre));
  }

  private crearMapaCalificaciones(calificaciones: any[]): Map<string, any> {
    const mapCalificaciones = new Map<string, any>();

    calificaciones.forEach((calificacion: any) => {
      const actividadId = String(
        calificacion?.actividad_id ||
        calificacion?.actividad?.actividad_id ||
        calificacion?.actividad?.id ||
        ''
      );

      if (actividadId) {
        mapCalificaciones.set(actividadId, calificacion);
      }
    });

    return mapCalificaciones;
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

  private resolverInscripcionActual(inscripciones: any, materiaId: string): any | null {
    return this.normalizarLista(inscripciones).find((inscripcion: any) =>
      String(inscripcion?.materia_id || '').trim() === String(materiaId).trim()
    ) || null;
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

  private esInscripcionDelPeriodoActivo(inscripcion: any): boolean {
    const periodoInscripcionId = this.obtenerPeriodoId(inscripcion);

    return Boolean(
      this.periodoActivoId &&
      periodoInscripcionId &&
      periodoInscripcionId === this.periodoActivoId
    );
  }

  private obtenerPeriodoId(valor: any): string | null {
    const id = valor?.periodo_id ||
      valor?.id_periodo ||
      valor?.periodo?.periodo_id ||
      valor?.periodo?.id ||
      valor?.id;

    return id ? String(id).trim() : null;
  }

  private normalizarLista(valor: any): any[] {
    if (Array.isArray(valor)) return valor;
    if (Array.isArray(valor?.items)) return valor.items;
    if (Array.isArray(valor?.data)) return valor.data;
    if (Array.isArray(valor?.resultados)) return valor.resultados;
    if (Array.isArray(valor?.results)) return valor.results;
    return [];
  }

  private obtenerNumero(valor: unknown): number | null {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }

  private redondearPromedio(valor: number): number {
    if (!Number.isFinite(valor)) return 0;
    return Number(valor.toFixed(1));
  }

  private limpiarDetalle(): void {
    this.materiaInfo.set(null);
    this.actividades.set([]);
    this.calificaciones.set([]);
    this.actividadesAgrupadas.set([]);
    this.promedioActual.set(0);
    this.puedeSolicitarBaja.set(false);
    this.inscripcionActual.set(null);
    this.alumnoActual = null;
    this.periodoActivoId = null;
  }
}
