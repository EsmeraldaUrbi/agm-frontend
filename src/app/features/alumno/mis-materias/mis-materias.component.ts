import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HorarioComponent } from '../../../shared/components/horario/horario.component';
import { SolicitarBajaComponent } from '../solicitar-baja/solicitar-baja.component';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { PeriodosService } from '../../../core/services/periodos.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-mis-materias',
  standalone: true,
  imports: [CommonModule, RouterModule, HorarioComponent, SolicitarBajaComponent],
  templateUrl: './mis-materias.component.html',
  styleUrl: './mis-materias.component.css'
})
export class MisMateriasComponent implements OnInit {
  mostrarHorarioModal = false;
  mostrarBajaModal = false;
  cargando = true;

  filtroActivo: 'todas' | 'activas' | 'bajas' = 'todas';

  get materiasFiltradas() {
    if (this.filtroActivo === 'activas') {
      return this.materias.filter(m => m.activa);
    }
    if (this.filtroActivo === 'bajas') {
      return this.materias.filter(m => !m.activa);
    }
    return this.materias;
  }

  materias: any[] = [];
  scheduleData: any[] = [];
  periodoActivoNombre = 'Periodo por consultar';
  periodoActivoId: string | null = null;

  get totalMateriasHorario(): number {
    return this.materias.filter(m => m.activa).length;
  }

  private inscripcionesService = inject(InscripcionesService);
  private materiasService = inject(MateriasService);
  private alumnosService = inject(AlumnosService);
  private authService = inject(AuthService);
  private reportesService = inject(ReportesService);
  private periodosService = inject(PeriodosService);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarPeriodoActivo() {
    this.periodosService.getPeriodoActivo().subscribe({
      next: (periodo) => {
        this.periodoActivoNombre = periodo?.nombre || 'Periodo no disponible';
        this.periodoActivoId = this.obtenerPeriodoId(periodo);
      },
      error: (err) => {
        console.error('Error al cargar periodo activo:', err);
        this.periodoActivoNombre = 'Periodo no disponible';
        this.periodoActivoId = null;
      }
    });
  }

  alumnoId: string | null = null;

  cargarDatos() {
    this.cargando = true;

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.materias = [];
      this.scheduleData = [];
      this.cargando = false;
      return;
    }

    this.periodosService.getPeriodoActivo().pipe(
      switchMap((periodo: any) => {
        this.periodoActivoNombre = periodo?.nombre || 'Periodo no disponible';
        this.periodoActivoId = this.obtenerPeriodoId(periodo);
        return this.alumnosService.getAlumnos({ limit: 1000 });
      }),
      switchMap((alumnos: any[]) => {
        const miRegistro = this.resolverAlumnoActual(alumnos, user);

        if (!miRegistro || !miRegistro.alumno_id) {
          this.alumnoId = null;
          return of([]);
        }

        this.alumnoId = miRegistro.alumno_id;
        return this.inscripcionesService.getInscripcionesByAlumno(miRegistro.alumno_id);
      }),
      catchError((err) => {
        console.error('Error al cargar datos académicos del alumno:', err);
        return of([]);
      })
    ).subscribe({
      next: (inscripciones) => {
        const inscripcionesPeriodo = this.normalizarLista(inscripciones)
          .filter((ins: any) => this.esInscripcionDelPeriodoActivo(ins));

        if (!this.periodoActivoId || inscripcionesPeriodo.length === 0) {
          this.materias = [];
          this.scheduleData = [];
          this.cargando = false;
          return;
        }

        const infoPeticiones = inscripcionesPeriodo.map((ins: any) =>
          this.materiasService.getMateriaById(ins.materia_id).pipe(
            catchError(() => of(null))
          )
        );

        const horariosPeticiones = inscripcionesPeriodo.map((ins: any) =>
          this.materiasService.getHorarios({ materia_ofertada_id: ins.materia_id }).pipe(
            catchError(() => of([]))
          )
        );

        const statsPeticion = this.alumnoId
          ? this.reportesService.getEstadisticasAlumno(this.alumnoId).pipe(
              catchError(() => of({ estadisticas: [] }))
            )
          : of({ estadisticas: [] });

        forkJoin([forkJoin(infoPeticiones), forkJoin(horariosPeticiones), statsPeticion]).subscribe({
          next: ([materiasInfo, horariosData, statsData]: [any[], any[], any]) => {
            const statsMap = new Map();

            if (statsData && statsData.estadisticas) {
              statsData.estadisticas.forEach((s: any) => {
                statsMap.set(s.materia_id, s.promedio);
              });
            }

            this.materias = inscripcionesPeriodo.map((ins: any, index: number) => {
              const info = materiasInfo[index] as any;
              const promedio = statsMap.get(ins.materia_id);

              return {
                materia_id: ins.materia_id,
                inscripcion_id: ins.inscripcion_id,
                periodo_id: this.obtenerPeriodoId(ins),
                nrc: ins.nrc_materia || info?.nrc || 'S/N',
                nombre: info?.nombre || 'Materia sin nombre',
                docente: info?.docente_nombre || 'Asignado',
                creditos: info?.creditos || 6,
                promedio: promedio !== undefined && promedio !== null ? Number(promedio).toFixed(1) : 'N/A',
                activa: ins.activa !== false
              };
            });

            const allHorarios: any[] = [];

            horariosData.forEach((horariosMateria: any[], index: number) => {
              const inscripcion = inscripcionesPeriodo[index];

              if (inscripcion.activa === false) return;

              const info = materiasInfo[index];

              horariosMateria.forEach(h => {
                allHorarios.push({
                  ...h,
                  materia_nombre: info?.nombre || 'Materia',
                  materia_id: inscripcion.materia_id
                });
              });
            });

            this.scheduleData = allHorarios;
            this.cargando = false;
          },
          error: (err) => {
            console.error('Error al cargar materias u horarios del periodo activo:', err);
            this.materias = [];
            this.scheduleData = [];
            this.cargando = false;
          }
        });
      },
      error: (err) => {
        console.error("Error al cargar inscripciones", err);
        this.materias = [];
        this.scheduleData = [];
        this.cargando = false;
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
    if (Array.isArray(valor?.data)) return valor.data;
    if (Array.isArray(valor?.items)) return valor.items;
    if (Array.isArray(valor?.results)) return valor.results;
    return [];
  }

  materiaSeleccionada: any = null;

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
    
    this.alumnosService.bajaMateria(this.alumnoId, this.materiaSeleccionada.materia_id).subscribe({
      next: () => {
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
