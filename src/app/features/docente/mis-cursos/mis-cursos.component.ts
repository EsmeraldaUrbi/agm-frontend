import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';
import { PeriodosService } from '../../../core/services/periodos.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface Curso {
  materia_id: string;
  nrc: string;
  seccion: string;
  nombre: string;
  alumnos: number;
  progreso: number;
  progresoColor: string;
  estado: string;
}

@Component({
  selector: 'app-mis-cursos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mis-cursos.component.html'
})
export class MisCursosComponent implements OnInit {
  private authService = inject(AuthService);
  private docentesService = inject(DocentesService);
  private materiasService = inject(MateriasService);
  private periodosService = inject(PeriodosService);
  private alumnosService = inject(AlumnosService);
  private calificacionesService = inject(CalificacionesService);

  cursos = signal<Curso[]>([]);
  docenteId: string | null = null;
  isLoading = signal(false);
  periodoActivoNombre = signal('Periodo por consultar');

  searchTerm = signal('');
  statusFilter = signal('Todos');

  filteredCursos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    
    return this.cursos().filter(curso => {
      const matchesSearch = curso.nrc.toLowerCase().includes(term) || 
                            curso.nombre.toLowerCase().includes(term) || 
                            curso.seccion.toLowerCase().includes(term);
      const matchesStatus = status === 'Todos' || curso.estado === status;
      return matchesSearch && matchesStatus;
    });
  });

  get totalAlumnos(): number {
    return this.cursos().reduce((sum, c) => sum + c.alumnos, 0);
  }

  isCierreModalOpen = false;
  cursoToClose: Curso | null = null;

  ngOnInit() {
    this.cargarPeriodoActivo();
    this.resolverDocenteYCargarCursos();
  }

  cargarPeriodoActivo() {
    this.periodosService.getPeriodoActivo().subscribe({
      next: (periodo) => {
        this.periodoActivoNombre.set(periodo?.nombre || 'Periodo no disponible');
      },
      error: (err) => {
        console.error('Error al cargar periodo activo:', err);
        this.periodoActivoNombre.set('Periodo no disponible');
      }
    });
  }

  resolverDocenteYCargarCursos() {
    const user = this.authService.getCurrentUser();
    if (!user?.email) {
      this.isLoading.set(false);
      this.cursos.set([]);
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
          return;
        }

        this.docenteId = null;
        this.cursos.set([]);
        this.isLoading.set(false);
        console.warn('No se encontró docente en MS-3 para el correo autenticado:', user.email);
      },
      error: (err) => {
        console.error('Error al resolver docente:', err);
        this.docenteId = null;
        this.cursos.set([]);
        this.isLoading.set(false);
      }
    });
  }

  cargarCursos(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId).subscribe({
      next: (res) => {
        const mappedCursos = res.items.map((m: any) => {
          const isCanceled = m.estado === 'CANCELADA' || m.estado === 'CERRADA';
          return {
            materia_id: m.materia_id || '',
            nrc: m.nrc || 'N/A',
            seccion: m.seccion || '001',
            nombre: m.nombre || 'Materia sin Nombre',
            alumnos: 0,
            progreso: isCanceled ? 100 : 75,
            progresoColor: isCanceled ? 'bg-red-500' : 'bg-emerald-500',
            estado: m.estado || 'ACTIVA'
          };
        });

        if (mappedCursos.length === 0) {
          this.cursos.set([]);
          this.isLoading.set(false);
          return;
        }

        const requests = mappedCursos.map((curso: any) => {
          if (!curso.materia_id) return of(0);
          return this.alumnosService.getAlumnosByMateria(curso.materia_id).pipe(
            map(alumnos => alumnos.length),
            catchError(() => of(0))
          );
        });

        forkJoin(requests).subscribe({
          next: (counts: any) => {
            mappedCursos.forEach((curso: any, index: number) => {
              curso.alumnos = counts[index];
            });
            this.cursos.set(mappedCursos);
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error('Error al obtener conteos de alumnos:', err);
            this.cursos.set(mappedCursos);
            this.isLoading.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar cursos de docente:', err);
        this.isLoading.set(false);
      }
    });
  }

  abrirModalCierre(curso: Curso) {
    this.cursoToClose = curso;
    this.isCierreModalOpen = true;
  }

  cerrarModalCierre() {
    this.isCierreModalOpen = false;
    this.cursoToClose = null;
  }

  confirmarCierre() {
    if (this.cursoToClose && this.cursoToClose.materia_id) {
      const materiaId = this.cursoToClose.materia_id;
      // Primero cerramos la materia en el MS de Periodos/Materias
      this.materiasService.cerrarMateriaOfertada(materiaId).subscribe({
        next: () => {
          // Luego notificamos a todos los alumnos
          this.calificacionesService.notificarCierreMateria(materiaId).subscribe({
            next: () => {
              if (this.cursoToClose) {
                this.cursoToClose.estado = 'CERRADA';
                this.cursoToClose.progresoColor = 'bg-slate-400';
              }
              this.cerrarModalCierre();
              if (this.docenteId) {
                this.isLoading.set(true);
                this.materiasService.clearDocenteMateriasCache(this.docenteId);
                // Le damos un pequeño delay (500ms) para que el ms-notificaciones / RabbitMQ 
                // terminen de procesar, y la experiencia visual se vea mejor.
                setTimeout(() => {
                  if (this.docenteId) this.cargarCursos(this.docenteId);
                }, 500);
              }
            },
            error: (err) => {
              console.error('Materia cerrada, pero error al notificar alumnos:', err);
              // Igual actualizamos la vista
              if (this.cursoToClose) {
                this.cursoToClose.estado = 'CERRADA';
                this.cursoToClose.progresoColor = 'bg-slate-400';
              }
              this.cerrarModalCierre();
              if (this.docenteId) {
                this.isLoading.set(true);
                this.materiasService.clearDocenteMateriasCache(this.docenteId);
                setTimeout(() => {
                  if (this.docenteId) this.cargarCursos(this.docenteId);
                }, 500);
              }
            }
          });
        },
        error: (err) => {
          console.error('Error al cerrar materia:', err);
          alert('Hubo un error al intentar cerrar la materia.');
          this.cerrarModalCierre();
        }
      });
    }
  }
}
