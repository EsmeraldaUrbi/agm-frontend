import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HorarioComponent } from '../../../shared/components/horario/horario.component';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';
import { ReportesService } from '../../../core/services/reportes.service';

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
  imports: [CommonModule, RouterModule, FormsModule, HorarioComponent],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  private authService = inject(AuthService);
  private docentesService = inject(DocentesService);
  private materiasService = inject(MateriasService);
  private reportesService = inject(ReportesService);
  
  // Lista de materias asignadas en el periodo activo para seleccionar dinámicamente
  listaMateriasDisponibles: MateriaActiva[] = [];

  materiaSeleccionadaNrc = signal<string>('');
  materia: MateriaActiva | null = null;
  tabs = ['Alumnos', 'Ponderaciones', 'Actividades'];
  alumnos = signal<AlumnoRendimiento[]>([]);

  // Horario modal state
  scheduleData: any[] = [];
  mostrarHorarioModal = false;

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

  periodosHistoricos = computed(() => {
    const materias = this.listaMateriasDisponibles;
    const periodosMap = new Map<string, { id: string, nombre: string, materias: any[] }>();
    materias.forEach(m => {
      const p = m.periodo || 'Periodo Actual';
      if (!periodosMap.has(p)) {
        periodosMap.set(p, { id: p, nombre: p, materias: [] });
      }
      periodosMap.get(p)!.materias.push({
        nrc: m.nrc,
        nombre: m.nombre,
        aprobacion: m.tasaAprobacion !== 'N/A' ? parseInt(m.tasaAprobacion) : 0
      });
    });
    return Array.from(periodosMap.values());
  });

  currentPeriodoData = computed(() => {
    return this.periodosHistoricos().find(p => p.id === this.selectedPeriodoId()) || null;
  });
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

  abrirHorario() {
    this.mostrarHorarioModal = true;
  }

  cerrarHorario() {
    this.mostrarHorarioModal = false;
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
          const firstPeriod = this.periodosHistoricos()[0];
          if (firstPeriod) this.selectedPeriodoId.set(firstPeriod.id);
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
      }
    }
  }

  // Estado de descarga simulada
  descargando = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);
  errorDescarga = signal<string | null>(null);

  descargarReporte(tipo: string, formato: string) {
    if (!this.materia) return;
    
    this.descargando.set(`${tipo} (${formato})`);
    this.mensajeExito.set(null);
    this.errorDescarga.set(null);

    const nrc = this.materia.nrc;
    let request$;

    if (tipo === 'Calificaciones Finales') {
      request$ = this.reportesService.descargarReporteCalificaciones(nrc, formato as 'pdf' | 'xlsx');
    } else {
      request$ = this.reportesService.descargarReporteAsistencias(nrc, formato as 'pdf' | 'xlsx');
    }

    request$.subscribe({
      next: (blob: Blob) => {
        this.descargando.set(null);
        
        // Trigger browser download
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
