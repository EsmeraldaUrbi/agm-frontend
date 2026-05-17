import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

type EstadoAsistencia = 'presente' | 'retardo' | 'falta' | 'justificado' | null;

interface Alumno {
  matricula: string;
  nombre: string;
  iniciales: string;
  colorAvatar: string;
  hora: string;
  estado: EstadoAsistencia;
}

@Component({
  selector: 'app-historial-asistencias',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historial-asistencias.component.html'
})
export class HistorialAsistenciasComponent {
  materia = {
    nrc: '28491',
    nombre: 'Web Services Architecture',
    seccion: '101',
    horario: 'Lunes, Miércoles 16:00 - 18:00',
    programa: 'Postgrado en Computación',
    periodo: 'Primavera 2026',
  };

  tabs = ['Alumnos', 'Ponderaciones', 'Actividades', 'Asistencias', 'Reportes'];

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.materia.nrc = id;
      }
    });
  }

  // Filtros
  materiaSeleccionada = 'Programación I - Sec. 001';
  fechaSeleccionada = '2024-10-15';
  busqueda = '';

  materias = [
    'Programación I - Sec. 001',
    'Estructuras de Datos - Sec. 002',
    'Sistemas Operativos - Sec. 001',
    'Base de Datos - Sec. 003',
  ];

  // Datos mockeados de alumnos
  alumnos = signal<Alumno[]>([
    { matricula: '202145678', nombre: 'Aguilar Moreno, Mariana',    iniciales: 'AM', colorAvatar: 'bg-[#baeaff] text-[#001f29]',    hora: '08:02 AM', estado: 'presente'     },
    { matricula: '202138902', nombre: 'Bautista Cruz, Roberto',      iniciales: 'BC', colorAvatar: 'bg-[#ffdcc3] text-[#2f1500]',    hora: '08:14 AM', estado: 'retardo'      },
    { matricula: '202100432', nombre: 'Díaz Morales, Sofía Elena',   iniciales: 'DM', colorAvatar: 'bg-[#cce5ff] text-[#001d31]',    hora: '--:-- --',  estado: 'falta'        },
    { matricula: '202188231', nombre: 'García Ruiz, Fernando',       iniciales: 'GR', colorAvatar: 'bg-[#42d0fe] text-[#00566d]',    hora: '08:01 AM', estado: 'presente'     },
    { matricula: '202155612', nombre: 'Lopez Torres, Ricardo',       iniciales: 'LT', colorAvatar: 'bg-[#d29460] text-white',         hora: '--:-- --',  estado: 'justificado'  },
  ]);

  // Resumen calculado reactivamente
  resumen = computed(() => {
    const lista = this.alumnos();
    return {
      total:        lista.length,
      presentes:    lista.filter(a => a.estado === 'presente').length,
      faltas:       lista.filter(a => a.estado === 'falta').length,
      retardos:     lista.filter(a => a.estado === 'retardo').length,
      justificados: lista.filter(a => a.estado === 'justificado').length,
      porcentaje:   Math.round((lista.filter(a => a.estado === 'presente').length / lista.length) * 100),
    };
  });

  // Cambiar el estado de asistencia de un alumno
  setEstado(matricula: string, estado: EstadoAsistencia) {
    this.alumnos.update(lista =>
      lista.map(a => a.matricula === matricula ? { ...a, estado } : a)
    );
  }

  // Helpers para colores de los botones toggle
  btnClass(estado: EstadoAsistencia, tipo: EstadoAsistencia): string {
    if (estado === tipo) {
      const colores: Record<string, string> = {
        presente:    'bg-green-600 text-white shadow-sm',
        retardo:     'bg-amber-500 text-white shadow-sm',
        falta:       'bg-red-600 text-white shadow-sm',
        justificado: 'bg-blue-600 text-white shadow-sm',
      };
      return colores[tipo!] ?? '';
    }
    return 'text-[#42474e] hover:bg-white/60 transition-colors';
  }

  // Guardar cambios (placeholder — conectará a MS-5 POST /asistencias/registrar)
  hayPendientes = true;
  guardarCambios() {
    this.hayPendientes = false;
  }
  descartarCambios() {
    this.hayPendientes = false;
  }
}
