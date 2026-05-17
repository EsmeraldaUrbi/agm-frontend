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

  // Lista de materias impartidas históricamente (trayectoria de varios años)
  materiasHistorial = signal<MateriaHistorial[]>([
    // --- 2026 ---
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
    // --- 2025 ---
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
    // --- 2024 ---
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
      totalAlumnos: 32,
      comparativa: {
        periodoAnterior: 'Otoño 2023',
        promedioAnterior: 8.2,
        tasaAnterior: 81,
        alumnosAnterior: 30,
        difPromedio: 0.3,
        difTasa: 4
      }
    },
    {
      id: 'm6',
      nrc: '10115',
      nombre: 'Web Services Architecture',
      seccion: '101',
      horario: 'Lunes, Miércoles 16:00 - 18:00',
      periodo: 'Primavera 2024',
      activo: false,
      promedioGeneral: 8.0,
      tasaAprobacion: 80,
      totalAlumnos: 38,
      comparativa: {
        periodoAnterior: 'Primavera 2023',
        promedioAnterior: 8.3,
        tasaAnterior: 84,
        alumnosAnterior: 42,
        difPromedio: -0.3,
        difTasa: -4
      }
    },
    // --- 2023 ---
    {
      id: 'm7',
      nrc: '98501',
      nombre: 'Sistemas Distribuidos',
      seccion: '001',
      horario: 'Martes, Jueves 14:00 - 16:00',
      periodo: 'Otoño 2023',
      activo: false,
      promedioGeneral: 8.2,
      tasaAprobacion: 81,
      totalAlumnos: 30
    },
    {
      id: 'm8',
      nrc: '95420',
      nombre: 'Web Services Architecture',
      seccion: '101',
      horario: 'Lunes, Miércoles 16:00 - 18:00',
      periodo: 'Primavera 2023',
      activo: false,
      promedioGeneral: 8.3,
      tasaAprobacion: 84,
      totalAlumnos: 42
    },
    // --- 2022 ---
    {
      id: 'm9',
      nrc: '89100',
      nombre: 'Bases de Datos Avanzadas',
      seccion: '102',
      horario: 'Lunes, Miércoles 10:00 - 12:00',
      periodo: 'Otoño 2022',
      activo: false,
      promedioGeneral: 8.5,
      tasaAprobacion: 86,
      totalAlumnos: 34
    },
    {
      id: 'm10',
      nrc: '85211',
      nombre: 'Web Services Architecture',
      seccion: '101',
      horario: 'Lunes, Miércoles 16:00 - 18:00',
      periodo: 'Primavera 2022',
      activo: false,
      promedioGeneral: 8.2,
      tasaAprobacion: 83,
      totalAlumnos: 39
    },
    // --- 2021 ---
    {
      id: 'm11',
      nrc: '78410',
      nombre: 'Sistemas Distribuidos',
      seccion: '001',
      horario: 'Martes, Jueves 14:00 - 16:00',
      periodo: 'Otoño 2021',
      activo: false,
      promedioGeneral: 8.1,
      tasaAprobacion: 80,
      totalAlumnos: 29
    }
  ]);

  // Extraer dinámicamente todos los periodos únicos disponibles en el historial
  periodosDisponibles = computed(() => {
    const lista = this.materiasHistorial();
    const periodos = lista.map(m => m.periodo);
    return Array.from(new Set(periodos)); // Elimina duplicados
  });

  // Lista filtrada según la pestaña/select seleccionado
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

  // ── Cambio de Contraseña ─────────────────────────────────────────────────
  formContrasena = { actual: '', nueva: '', confirmar: '' };

  // Visibilidad de campos de contraseña
  mostrarActual    = signal(false);
  mostrarNueva     = signal(false);
  mostrarConfirmar = signal(false);

  // Estados de foco para resaltar border
  campoActualFocused    = signal(false);
  campoNuevaFocused     = signal(false);
  campoConfirmarFocused = signal(false);

  // Fortaleza de la contraseña nueva
  passwordStrength = computed(() => {
    const p = this.formContrasena.nueva;
    if (p.length === 0) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  });

  passwordStrengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (s === 1) return 'Débil';
    if (s === 2) return 'Regular';
    if (s === 3) return 'Fuerte';
    return '';
  });

  // Habilitar botón de guardar contraseña
  puedeGuardarContrasena = computed(() => {
    return (
      this.formContrasena.actual.length >= 6 &&
      this.formContrasena.nueva.length >= 8 &&
      this.formContrasena.nueva === this.formContrasena.confirmar
    );
  });

  cambiarContrasena() {
    if (!this.puedeGuardarContrasena()) return;
    // Mock: aquí irá la llamada a AuthService.changePassword()
    this.formContrasena = { actual: '', nueva: '', confirmar: '' };
    this.mostrarToast('¡Contraseña actualizada correctamente. Sesión refrescada con nuevo token JWT.');
  }

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
