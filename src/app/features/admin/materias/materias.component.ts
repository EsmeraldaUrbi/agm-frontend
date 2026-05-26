import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MateriasService, Materia } from '../../../core/services/materias.service';
import { DocentesService, Docente } from '../../../core/services/docentes.service';
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
  public router = inject(Router);

  Math = Math;

  materiasList = signal<MateriaView[]>([]);
  docentesList = signal<Docente[]>([]);

  ngOnInit() {
    this.cargarDocentesYMaterias();
  }

  cargarDocentesYMaterias() {
    this.docentesService.getDocentes({ limit: 1000 }).subscribe({
      next: (docentes) => {
        this.docentesList.set(docentes || []);
        this.cargarMaterias();
      },
      error: (err) => {
        console.error('Error cargando docentes', err);
        this.cargarMaterias(); // Cargamos materias igual aunque falle docentes
      }
    });
  }

  cargarMaterias() {
    this.materiasService.getAllMaterias().subscribe({
      next: (materias) => {
        const mappedMaterias: MateriaView[] = materias.map((m: Materia) => {
          let docenteNombre = 'Sin asignar';
          if (m.docente_id) {
            const docente = this.docentesList().find(d => d.docente_id === m.docente_id);
            if (docente) {
              docenteNombre = docente.nombre_completo;
            }
          }
          return {
            ...m,
            docenteNombre
          };
        });
        this.materiasList.set(mappedMaterias);
      },
      error: (err) => {
        console.error('Error cargando materias', err);
        this.triggerToast('Error de conexión al obtener el directorio de materias.', 'error');
      }
    });
  }

  searchQuery = signal<string>('');
  selectedStatusFilter = signal<'all' | 'ACTIVA' | 'INACTIVA' | 'CANCELADA'>('all');

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  showToast = signal<boolean>(false);

  filteredMaterias = computed(() => {
    const rawQuery = this.searchQuery();
    const query = (rawQuery || '').toLowerCase().trim();
    const status = this.selectedStatusFilter() || 'all';

    return (this.materiasList() || []).filter(m => {
      const nombre = (m.nombre || '').toLowerCase();
      const nrc = (m.nrc || '').toLowerCase();
      const docente = (m.docenteNombre || '').toLowerCase();

      const matchesQuery = nombre.includes(query) || nrc.includes(query) || docente.includes(query);
      const matchesStatus = status === 'all' || m.estado === status;

      return matchesQuery && matchesStatus;
    });
  });

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
