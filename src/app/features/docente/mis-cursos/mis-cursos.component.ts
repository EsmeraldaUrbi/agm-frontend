import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';

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

  cursos: Curso[] = [];
  docenteId: string | null = null;
  isLoading = signal(false);

  searchTerm = signal('');
  statusFilter = signal('Todos');

  filteredCursos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    
    return this.cursos.filter(curso => {
      const matchesSearch = curso.nrc.toLowerCase().includes(term) || 
                            curso.nombre.toLowerCase().includes(term) || 
                            curso.seccion.toLowerCase().includes(term);
      const matchesStatus = status === 'Todos' || curso.estado === status;
      return matchesSearch && matchesStatus;
    });
  });

  get totalAlumnos(): number {
    return this.cursos.reduce((sum, c) => sum + c.alumnos, 0);
  }

  isCierreModalOpen = false;
  cursoToClose: Curso | null = null;

  ngOnInit() {
    this.resolverDocenteYCargarCursos();
  }

  resolverDocenteYCargarCursos() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.isLoading.set(true);
    // Para resolver disparidades de IDs, listamos los docentes de MS-3 y filtramos por email
    this.docentesService.getDocentes().subscribe({
      next: (docentes) => {
        const matchingDocente = docentes.find(d => d.email.toLowerCase() === user.email.toLowerCase());
        if (matchingDocente && matchingDocente.docente_id) {
          this.docenteId = matchingDocente.docente_id;
          this.cargarCursos(matchingDocente.docente_id);
        } else {
          // Fallback: usar el user_id de Auth
          this.docenteId = user.user_id;
          this.cargarCursos(user.user_id);
        }
      },
      error: (err) => {
        console.error('Error al resolver docente:', err);
        // Fallback: intentar cargar con el user_id
        this.docenteId = user.user_id;
        this.cargarCursos(user.user_id);
      }
    });
  }

  cargarCursos(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId).subscribe({
      next: (res) => {
        this.cursos = res.items.map((m: any) => {
          const isCanceled = m.estado === 'CANCELADA' || m.estado === 'CERRADA';
          return {
            materia_id: m.materia_id || '',
            nrc: m.nrc || 'N/A',
            seccion: m.seccion || '001',
            nombre: m.nombre || 'Materia sin Nombre',
            alumnos: Math.floor(Math.random() * 15) + 10, // Simulación de alumnos inscritos en UI para UX
            progreso: isCanceled ? 100 : 75,
            progresoColor: isCanceled ? 'bg-red-500' : 'bg-emerald-500',
            estado: m.estado || 'ACTIVA'
          };
        });
        this.isLoading.set(false);
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
      this.materiasService.cancelarMateriaOfertada(materiaId).subscribe({
        next: () => {
          if (this.cursoToClose) {
            this.cursoToClose.estado = 'CANCELADA';
            this.cursoToClose.progresoColor = 'bg-red-500';
          }
          this.cerrarModalCierre();
          if (this.docenteId) {
            this.cargarCursos(this.docenteId);
          }
        },
        error: (err) => {
          console.error('Error al cerrar materia:', err);
          alert('Hubo un error al intentar cancelar/cerrar la materia.');
          this.cerrarModalCierre();
        }
      });
    }
  }
}
