import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Curso {
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
export class MisCursosComponent {
  cursos: Curso[] = [
    { nrc: '15842', seccion: '101', nombre: 'Arquitectura de Servicios Web', alumnos: 34, progreso: 65, progresoColor: 'bg-[#42d0fe]', estado: 'ACTIVA' },
    { nrc: '15845', seccion: '102', nombre: 'Ingeniería de Software II', alumnos: 28, progreso: 100, progresoColor: 'bg-[#fcb882]', estado: 'CERRADA' },
    { nrc: '16021', seccion: '101', nombre: 'Programación Paralela', alumnos: 22, progreso: 12, progresoColor: 'bg-[#ba1a1a]', estado: 'ACTIVA' },
    { nrc: '16110', seccion: '104', nombre: 'Seguridad de la Información', alumnos: 40, progreso: 45, progresoColor: 'bg-[#42d0fe]', estado: 'ACTIVA' },
  ];

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

  abrirModalCierre(curso: Curso) {
    this.cursoToClose = curso;
    this.isCierreModalOpen = true;
  }

  cerrarModalCierre() {
    this.isCierreModalOpen = false;
    this.cursoToClose = null;
  }

  confirmarCierre() {
    if(this.cursoToClose) {
      this.cursoToClose.estado = 'CERRADA';
    }
    this.cerrarModalCierre();
  }
}
