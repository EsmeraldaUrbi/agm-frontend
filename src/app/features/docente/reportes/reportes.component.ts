import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HorarioComponent } from '../../../shared/components/horario/horario.component';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface AlumnoRendimiento {
  matricula: string;
  nombre: string;
  promedioActual: number;
  promedioFinal: number;
  promedioPonderadoReal: number;
  promedioRedondeadoOficial: number;
  asistencia: number;
  estatus: string;
}

interface MateriaActiva {
  materia_id: string;
  nrc: string;
  nombre: string;
  seccion: string;
  horario: string;
  programa: string;
  periodo: string;
  promedioGeneral: string;
  tasaAprobacion: string;
  alumnosRiesgo: string;
  asistenciaPromedio: string;
  alumnos: AlumnoRendimiento[];
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  private authService = inject(AuthService);
  private docentesService = inject(DocentesService);
  private materiasService = inject(MateriasService);
  private reportesService = inject(ReportesService);
  private calificacionesService = inject(CalificacionesService);
  private alumnosService = inject(AlumnosService);
  
  // Lista de materias asignadas en el periodo activo para seleccionar dinámicamente
  listaMateriasDisponibles: MateriaActiva[] = [];

  materiaSeleccionadaNrc = signal<string>('');
  materia: MateriaActiva | null = null;
  tabs = ['Alumnos', 'Ponderaciones', 'Actividades'];
  alumnos = signal<AlumnoRendimiento[]>([]);

  // Horario modal state
  scheduleData: any[] = [];

  // Pagination states
  currentPage = signal(1);
  itemsPerPage = 10;
  isLoading = signal(false);
  docenteId: string | null = null;

  paginatedAlumnos = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.alumnos().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.alumnos().length / this.itemsPerPage));
  });

  // --- Historial Académico ---
  selectedPeriodoId = signal<string>('');
  periodosHistorial = signal<import('../../../core/services/reportes.service').EstadisticasPeriodo[]>([]);
  isLoadingHistorial = signal(false);
  errorHistorial = signal<string | null>(null);

  currentPeriodoData = computed(() => {
    return this.periodosHistorial().find(p => p.periodo_id === this.selectedPeriodoId()) || null;
  });

  getPorcentajeAprobacion(aprobados: number, reprobados: number): number {
    const total = aprobados + reprobados;
    if (total === 0) return 0;
    return Math.round((aprobados / total) * 100);
  }

  cargarHistorialAcademico(docenteId: string) {
    this.isLoadingHistorial.set(true);
    this.errorHistorial.set(null);
    this.reportesService.getEstadisticasDocente(docenteId).subscribe({
      next: (res) => {
        const periodos = res?.periodos || [];
        this.periodosHistorial.set(periodos);
        if (periodos.length > 0) {
          this.selectedPeriodoId.set(periodos[0].periodo_id);
        }

        // Actualizar la asistencia promedio de las materias disponibles con los datos reales
        this.listaMateriasDisponibles.forEach(mat => {
           for (const p of periodos) {
              const mStats = p.materias.find((m: any) => m.materia_id === mat.materia_id);
              if (mStats) {
                 mat.asistenciaPromedio = (mStats.porcentaje_asistencia || 0) + '%';
                 // Actualizar también la lista local de alumnos para la tabla
                 mat.alumnos.forEach((a: any) => {
                    a.asistencia = mStats.porcentaje_asistencia || 0; 
                 });
              }
           }
        });

        this.isLoadingHistorial.set(false);
      },
      error: (err) => {
        console.error('Error cargando historial académico:', err);
        this.errorHistorial.set('No se pudo cargar el historial académico. Intente nuevamente más tarde.');
        this.isLoadingHistorial.set(false);
      }
    });
  }
  // ---------------------------

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }



  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        // Handle direct routing if necessary
        // this.cambiarMateria(id);
      }
    });
  }

  ngOnInit() {
    this.resolverDocenteYCargarCursos();
  }

  resolverDocenteYCargarCursos() {
    const user = this.authService.getCurrentUser();
    if (!user?.email) {
      this.isLoading.set(false);
      this.isLoadingHistorial.set(false);
      this.errorHistorial.set('No se pudo identificar el correo del usuario autenticado.');
      return;
    }

    const normalizarCorreo = (correo?: string | null) =>
      (correo || '').trim().toLowerCase();

    this.isLoading.set(true);
    this.docentesService.getDocentes({ limit: 500 }).subscribe({
      next: (docentes) => {
        const userEmail = normalizarCorreo(user.email);
        const matchingDocente = docentes.find(d => {
          const docenteEmail = normalizarCorreo((d as any).email || d.correo);
          return docenteEmail === userEmail;
        });

        if (matchingDocente?.docente_id) {
          this.docenteId = matchingDocente.docente_id;
          this.cargarCursos(matchingDocente.docente_id);
          this.cargarHistorialAcademico(matchingDocente.docente_id);
          return;
        }

        this.docenteId = null;
        this.listaMateriasDisponibles = [];
        this.errorHistorial.set('No se encontró un docente asociado al correo del usuario autenticado.');
        this.isLoading.set(false);
        this.isLoadingHistorial.set(false);
        console.warn('No se encontró docente en MS-3 para el correo autenticado:', user.email);
      },
      error: (err) => {
        console.error('Error al resolver docente:', err);
        this.docenteId = null;
        this.listaMateriasDisponibles = [];
        this.errorHistorial.set('No se pudo resolver el docente asociado al usuario autenticado.');
        this.isLoading.set(false);
        this.isLoadingHistorial.set(false);
      }
    });
  }

  cargarCursos(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId).subscribe({
      next: (res) => {
        this.listaMateriasDisponibles = res.items.map((m: any) => ({
          materia_id: m.materia_id || m.id_materia || '',
          nrc: m.nrc || 'N/A',
          nombre: m.nombre || 'Materia sin Nombre',
          seccion: m.seccion || '001',
          horario: 'Por definir',
          programa: 'Licenciatura',
          periodo: m.periodo_id || 'Actual',
          promedioGeneral: 'N/A',
          tasaAprobacion: 'N/A',
          alumnosRiesgo: 'N/A',
          asistenciaPromedio: 'N/A',
          alumnos: []
        }));
        
        if (this.listaMateriasDisponibles.length > 0) {
          this.cambiarMateria(this.listaMateriasDisponibles[0].nrc);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar materias:', err);
        this.isLoading.set(false);
      }
    });
  }

  cambiarMateria(nrc: string) {
    const mat = this.listaMateriasDisponibles.find(m => m.nrc === nrc);
    if (mat) {
      this.materiaSeleccionadaNrc.set(mat.nrc);
      this.materia = mat;
      
      // Consultar detalles de la materia para obtener horario y programa reales
      this.materiasService.getMateriaById(mat.materia_id).subscribe({
        next: (data: any) => {
          let horarioFormat = 'Horario no definido';
          if (data.horarios && data.horarios.length > 0) {
            const gruposHorarios: { [key: string]: string[] } = {};
            data.horarios.forEach((h: any) => {
              const ini = h.hora_inicio?.substring(0, 5) || '';
              const fin = h.hora_fin?.substring(0, 5) || '';
              const rango = `${ini} - ${fin}`;
              if (!gruposHorarios[rango]) gruposHorarios[rango] = [];
              gruposHorarios[rango].push(h.dia);
            });
            const partes = Object.entries(gruposHorarios).map(([rango, dias]) => {
              return `${dias.join(', ')} ${rango}`;
            });
            horarioFormat = partes.join(' | ');
          }

          mat.horario = horarioFormat;
          mat.programa = data.programa || 'Licenciatura en Ciencias de la Computación';
          mat.periodo = data.periodo?.nombre || 'Otoño 2024';
        }
      });
      this.alumnos.set(mat.alumnos);
      this.currentPage.set(1);
      
      this.scheduleData = [];
      if (mat.materia_id) {
        this.materiasService.getHorarios({ materia_ofertada_id: mat.materia_id }).subscribe({
          next: (horarios) => {
            this.scheduleData = (horarios || []).map((h: any) => ({
              ...h,
              materia_nombre: mat.nombre,
              materia_id: mat.materia_id
            }));
          },
          error: (err) => console.error('Error al cargar horarios de la materia:', err)
        });

        // Obtener alumnos y concentrado (estadísticas reales)
        forkJoin({
          alumnosDetalle: this.alumnosService.getAlumnosByMateria(mat.materia_id).pipe(catchError(() => of([]))),
          concentrado: this.calificacionesService.getConcentrado(mat.materia_id).pipe(catchError(() => of({ alumnos: [] } as any)))
        }).subscribe({
          next: ({ alumnosDetalle, concentrado }) => {
            let alumnosRendimiento: AlumnoRendimiento[] = [];
            let sumaPromedios = 0;
            let alumnosAprobados = 0;
            let enRiesgo = 0;

            const listaAlumnosConcentrado = concentrado?.alumnos || [];
            
            if (listaAlumnosConcentrado.length > 0) {
              alumnosRendimiento = listaAlumnosConcentrado.map((ac: any) => {
                const infoAlumno = alumnosDetalle.find((a: any) => a.alumno_id === ac.alumno_id);
                const promedioReal = ac.promedio_real || 0;
                
                sumaPromedios += promedioReal;
                if (promedioReal >= 6) alumnosAprobados++;
                if (promedioReal < 6) enRiesgo++;
                
                return {
                  matricula: infoAlumno?.matricula || 'S/N',
                  nombre: infoAlumno?.nombre_completo || 'Alumno Desconocido',
                  promedioActual: promedioReal,
                  promedioFinal: ac.promedio_redondeado || 0,
                  promedioPonderadoReal: ac.peso_considerado || 0,
                  promedioRedondeadoOficial: ac.promedio_redondeado || 0,
                  asistencia: null,
                  estatus: promedioReal >= 6 ? 'Regular' : 'En Riesgo'
                };
              });

              // Buscar en el historial (si ya cargó) el porcentaje real
              let asisPromedio = '0%';
              for (const p of this.periodosHistorial()) {
                const mStats = p.materias.find((m: any) => m.materia_id === mat.materia_id);
                if (mStats) {
                  asisPromedio = (mStats.porcentaje_asistencia || 0) + '%';
                  break;
                }
              }

              const total = alumnosRendimiento.length;
              mat.promedioGeneral = (sumaPromedios / total).toFixed(2);
              mat.tasaAprobacion = Math.round((alumnosAprobados / total) * 100).toString() + '%';
              mat.alumnosRiesgo = enRiesgo.toString();
              mat.asistenciaPromedio = asisPromedio;
            } else {
              mat.promedioGeneral = '0.00';
              mat.tasaAprobacion = '0%';
              mat.alumnosRiesgo = '0';
              mat.asistenciaPromedio = '0%';
            }

            mat.alumnos = alumnosRendimiento;
            this.alumnos.set(alumnosRendimiento);
          },
          error: (err) => console.error('Error al cargar concentrado y alumnos:', err)
        });
      }
    }
  }

  // Estado de descarga de reportes
  descargando = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  errorDescarga = signal<string | null>(null);

  descargarReporte(tipo: string, formato: string) {
    if (!this.materia) return;
    
    this.descargando.set(`${tipo} (${formato})`);
    this.mensajeExito.set(null);
    this.errorDescarga.set(null);

    const nrc = this.materia.nrc;
    const materiaId = this.materia.materia_id;
    let request$;

    if (tipo === 'Calificaciones Finales') {
      request$ = this.reportesService.descargarReporteCalificaciones(materiaId, formato as 'pdf' | 'xlsx');
    } else {
      request$ = this.reportesService.descargarReporteAsistencias(materiaId, formato as 'pdf' | 'xlsx');
    }

    request$.subscribe({
      next: (blob: Blob) => {
        this.descargando.set(null);
        
        // Iniciar descarga del archivo en el navegador
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const timestamp = new Date().toISOString().split('T')[0];
        const extension = formato.toLowerCase();
        const filename = `${tipo.replace(/ /g, '_')}_${nrc}_${timestamp}.${extension}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        a.remove();

        this.mensajeExito.set(`¡El reporte "${tipo}" para la materia ${this.materia?.nombre || ''} (NRC: ${nrc}) en formato ${formato.toUpperCase()} se ha generado y descargado exitosamente vía MS-Reportes!`);
        
        setTimeout(() => {
          this.mensajeExito.set(null);
        }, 5000);
      },
      error: (err) => {
        console.error('Error al descargar el reporte:', err);
        this.descargando.set(null);
        this.errorDescarga.set(`Ocurrió un error al descargar el reporte "${tipo}". Por favor intente de nuevo.`);
      }
    });
  }
}
