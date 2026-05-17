import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface MateriaHistorial {
  id: string;
  nrc: string;
  nombre: string;
  seccion: string;
  horario: string;
  periodo: string;
  activo: boolean; // true para periodo actual, false para inactivos
  promedioGeneral: number;
  tasaAprobacion: number;
  totalAlumnos: number;
  // Comparativa si se ha impartido en periodos anteriores
  comparativa?: {
    periodoAnterior: string;
    promedioAnterior: number;
    tasaAnterior: number;
    alumnosAnterior: number;
    difPromedio: number;
    difTasa: number;
  };
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent {
  // Datos personales del docente
  docente = {
    nombre: 'Dr. Carlos Eduardo Fernández',
    titulo: 'Docente Titular - Nivel VI',
    facultad: 'Facultad de Ciencias de la Computación (FCC - BUAP)',
    correo: 'carlos.fernandez@correo.buap.mx',
    idEmpleado: '1004521',
    departamento: 'Sistemas y Servicios Web',
    fechaIngreso: 'Agosto 2021',
  };

  // KPIs globales de trayectoria
  kpis = {
    totalMaterias: 14,
    alumnosAtendidos: 452,
    promedioGlobal: 8.4,
    tasaAprobacionGlobal: 78
  };

  // Filtro de periodo seleccionado
  periodoFiltro = signal<string>('Todos');

  // Lista de materias impartidas históricamente (cumpliendo el requerimiento del proyecto)
  materiasHistorial = signal<MateriaHistorial[]>([
    {
      id: 'm1',
      nrc: '15842',
      nombre: 'Web Services Architecture',
      seccion: '101',
      horario: 'Lunes, Miércoles 16:00 - 18:00',
      periodo: 'Primavera 2026',
      activo: true,
      promedioGeneral: 8.4,
      tasaAprobacion: 75,
      totalAlumnos: 36,
      comparativa: {
        periodoAnterior: 'Primavera 2025',
        promedioAnterior: 8.1,
        tasaAnterior: 82,
        alumnosAnterior: 40,
        difPromedio: 0.3,
        difTasa: -7
      }
    },
    {
      id: 'm2',
      nrc: '28491',
      nombre: 'Sistemas Distribuidos',
      seccion: '002',
      horario: 'Martes, Jueves 14:00 - 16:00',
      periodo: 'Otoño 2025',
      activo: false,
      promedioGeneral: 8.6,
      tasaAprobacion: 88,
      totalAlumnos: 28,
      comparativa: {
        periodoAnterior: 'Otoño 2024',
        promedioAnterior: 8.5,
        tasaAnterior: 85,
        alumnosAnterior: 32,
        difPromedio: 0.1,
        difTasa: 3
      }
    },
    {
      id: 'm3',
      nrc: '12450',
      nombre: 'Bases de Datos Avanzadas',
      seccion: '103',
      horario: 'Lunes, Miércoles 10:00 - 12:00',
      periodo: 'Otoño 2025',
      activo: false,
      promedioGeneral: 7.9,
      tasaAprobacion: 70,
      totalAlumnos: 35
    },
    {
      id: 'm4',
      nrc: '11022',
      nombre: 'Web Services Architecture',
      seccion: '101',
      horario: 'Lunes, Miércoles 16:00 - 18:00',
      periodo: 'Primavera 2025',
      activo: false,
      promedioGeneral: 8.1,
      tasaAprobacion: 82,
      totalAlumnos: 40,
      comparativa: {
        periodoAnterior: 'Primavera 2024',
        promedioAnterior: 8.0,
        tasaAnterior: 80,
        alumnosAnterior: 38,
        difPromedio: 0.1,
        difTasa: 2
      }
    },
    {
      id: 'm5',
      nrc: '10580',
      nombre: 'Sistemas Distribuidos',
      seccion: '002',
      horario: 'Martes, Jueves 14:00 - 16:00',
      periodo: 'Otoño 2024',
      activo: false,
      promedioGeneral: 8.5,
      tasaAprobacion: 85,
      totalAlumnos: 32
    }
  ]);

  // Lista filtrada según la pestaña seleccionada
  materiasFiltradas = computed(() => {
    const filtro = this.periodoFiltro();
    const lista = this.materiasHistorial();
    if (filtro === 'Todos') return lista;
    if (filtro === 'Activos') return lista.filter(m => m.activo);
    if (filtro === 'Inactivos') return lista.filter(m => !m.activo);
    return lista.filter(m => m.periodo === filtro);
  });

  // Modal de edición de perfil
  showEditModal = signal(false);
  formPerfil = signal({ ...this.docente });
  mensajeToast = signal<string | null>(null);

  abrirEditarPerfil() {
    this.formPerfil.set({ ...this.docente });
    this.showEditModal.set(true);
  }

  cerrarEditarPerfil() {
    this.showEditModal.set(false);
  }

  guardarPerfil() {
    this.docente = { ...this.formPerfil() };
    this.showEditModal.set(false);
    this.mostrarToast('¡Perfil actualizado y sincronizado con MS-Auth exitosamente!');
  }

  exportarHistorial() {
    this.mostrarToast('¡Constancia de Historial Académico y Trayectoria generada en PDF vía MS-Reportes!');
  }

  mostrarToast(mensaje: string) {
    this.mensajeToast.set(mensaje);
    setTimeout(() => {
      this.mensajeToast.set(null);
    }, 4000);
  }
}
