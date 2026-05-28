import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MateriasService, Materia, PlanEstudio } from '../../../core/services/materias.service';
import { DocentesService, Docente } from '../../../core/services/docentes.service';
import { PeriodosService, Periodo } from '../../../core/services/periodos.service';
import { PlanesEstudioService } from '../../../core/services/planes-estudio.service';
import { AgmButtonComponent, AgmCardComponent } from '../../../shared/components/ui';
import { Router } from '@angular/router';

interface MateriaView extends Materia {
  docenteNombre: string;
}

@Component({
  selector: 'app-materias-directorio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgmButtonComponent,
    AgmCardComponent
  ],
  templateUrl: './materias.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MateriasComponent implements OnInit {
  private materiasService = inject(MateriasService);
  private docentesService = inject(DocentesService);
  private periodosService = inject(PeriodosService);
  private planesEstudioService = inject(PlanesEstudioService);
  public router = inject(Router);

  Math = Math;

  isLoading = signal<boolean>(true);

  materiasList = signal<MateriaView[]>([]);
  docentesList = signal<Docente[]>([]);
  planesList = signal<PlanEstudio[]>([]);
  periodosList = signal<Periodo[]>([]);

  ngOnInit() {
    this.isLoading.set(true);
    import('rxjs').then(({ forkJoin, of }) => {
      import('rxjs/operators').then(({ catchError }) => {
        forkJoin({
          planes: this.materiasService.getPlanesEstudio().pipe(catchError(() => of([]))),
          periodos: this.periodosService.getPeriodos(1, 100).pipe(catchError(() => of({ items: [] }))),
          docentes: this.docentesService.getDocentes({ limit: 1000 }).pipe(catchError(() => of([])))
        }).subscribe({
          next: (res: any) => {
            this.planesList.set(res.planes || []);
            this.periodosList.set(res.periodos.items || []);
            this.docentesList.set(res.docentes || []);
            this.cargarMaterias();
          },
          error: (err) => {
            console.error('Error en carga inicial', err);
            this.cargarMaterias();
          }
        });
      });
    });
  }

  cargarMaterias() {
    import('rxjs').then(({ forkJoin, of }) => {
      import('rxjs/operators').then(({ catchError }) => {
        const planes = this.planesList();
        const requests = planes.map(p => 
          this.planesEstudioService.getMateriasPorPlan(p.plan_estudio_id || '', 1, 100).pipe(
            catchError(() => of({ items: [] }))
          )
        );

        const finalRequest = requests.length > 0 ? forkJoin(requests) : of([]);

        finalRequest.subscribe({
          next: (resultados: any[]) => {
            let todasLasRelaciones: any[] = [];
            resultados.forEach(res => {
              if (res && res.items) todasLasRelaciones.push(...res.items);
            });

            this.materiasService.getAllMaterias().subscribe({
              next: (materias) => {
                const mappedMaterias: MateriaView[] = materias.map((mat: any) => {
                  let docenteNombre = 'Sin asignar';
                  if (mat.docente_id) {
                    const docente = this.docentesList().find(d => d.docente_id === mat.docente_id);
                    if (docente) {
                      docenteNombre = docente.nombre_completo;
                    }
                  }

                  const catalogoId = mat.materia?.materia_catalogo_id || mat.materia_catalogo_id;
                  let nombresPlanes: string[] = [];
                  if (catalogoId) {
                    const planesIds = todasLasRelaciones.filter((r: any) => r.materia_catalogo_id === catalogoId && r.activa !== false).map((r: any) => r.plan_estudio_id);
                    nombresPlanes = planesIds.map((id: string) => {
                      const p = this.planesList().find(plan => plan.plan_estudio_id === id);
                      return p ? p.nombre : null;
                    }).filter((n: string | null) => n !== null) as string[];
                  }
                  
                  const finalPlanes = Array.from(new Set([...(mat.planes_estudio || []), ...nombresPlanes]));

                  return {
                    ...mat,
                    planes_estudio: finalPlanes,
                    docenteNombre
                  };
                });
                this.materiasList.set(mappedMaterias);
                setTimeout(() => {
                  this.isLoading.set(false);
                }, 500);
              },
              error: (err) => {
                console.error('Error cargando materias', err);
                this.triggerToast('Error de conexión al obtener el directorio de materias.', 'error');
                this.isLoading.set(false);
              }
            });
          },
          error: () => {
            this.cargarMateriasFallback();
          }
        });
      });
    });
  }

  cargarMateriasFallback() {
    this.materiasService.getAllMaterias().subscribe({
      next: (materias) => {
        const mappedMaterias: MateriaView[] = materias.map((mat: Materia) => {
          let docenteNombre = 'Sin asignar';
          if (mat.docente_id) {
            const docente = this.docentesList().find(d => d.docente_id === mat.docente_id);
            if (docente) {
              docenteNombre = docente.nombre_completo;
            }
          }
          return {
            ...mat,
            docenteNombre
          };
        });
        this.materiasList.set(mappedMaterias);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando materias', err);
        this.isLoading.set(false);
      }
    });
  }

  searchQuery = signal<string>('');
  selectedStatusFilter = signal<'all' | 'ACTIVA' | 'INACTIVA' | 'CANCELADA'>('all');
  selectedPlan = signal<string>('all');

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  showToast = signal<boolean>(false);

  filteredMaterias = computed(() => {
    const rawQuery = this.searchQuery();
    const query = (rawQuery || '').toLowerCase().trim();
    const status = this.selectedStatusFilter() || 'all';
    const plan = this.selectedPlan() || 'all';

    return (this.materiasList() || []).filter(m => {
      const nombre = (m.nombre || '').toLowerCase();
      const nrc = (m.nrc || '').toLowerCase();
      const docente = (m.docenteNombre || '').toLowerCase();

      const matchesQuery = !query || nombre.includes(query) || nrc.includes(query) || docente.includes(query);
      const matchesStatus = status === 'all' || m.estado === status;
      const matchesPlan = plan === 'all' || (m.planes_estudio && m.planes_estudio.includes(plan));

      return matchesQuery && matchesStatus && matchesPlan;
    });
  });

  limpiarFiltros() {
    this.searchQuery.set('');
    this.selectedStatusFilter.set('all');
    this.selectedPlan.set('all');
    this.resetPagination();
  }

  paginatedMaterias = computed(() => {
    const filtered = this.filteredMaterias();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredMaterias().length / this.pageSize()));
  });

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

  resetPagination() {
    this.currentPage.set(1);
  }

  triggerToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }
}
