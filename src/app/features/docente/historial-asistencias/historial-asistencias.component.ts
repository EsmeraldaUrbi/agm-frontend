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

interface MateriaActiva {
  nrc: string;
  nombre: string;
  seccion: string;
  horario: string;
  programa: string;
  periodo: string;
  alumnos: Alumno[];
}

@Component({
  selector: 'app-historial-asistencias',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historial-asistencias.component.html'
})
export class HistorialAsistenciasComponent {
  
  listaMateriasDisponibles: MateriaActiva[] = [
    {
      nrc: '15842',
      nombre: 'Web Services Architecture',
      seccion: '101',
      horario: 'Lunes, Miércoles 16:00 - 18:00',
      programa: 'Postgrado en Computación',
      periodo: 'Primavera 2026',
      alumnos: [
        { matricula: '202145678', nombre: 'Aguilar Moreno, Mariana',    iniciales: 'AM', colorAvatar: 'bg-[#baeaff] text-[#001f29]',    hora: '08:02 AM', estado: 'presente'     },
        { matricula: '202138902', nombre: 'Bautista Cruz, Roberto',      iniciales: 'BC', colorAvatar: 'bg-[#ffdcc3] text-[#2f1500]',    hora: '08:14 AM', estado: 'retardo'      },
        { matricula: '202100432', nombre: 'Díaz Morales, Sofía Elena',   iniciales: 'DM', colorAvatar: 'bg-[#cce5ff] text-[#001d31]',    hora: '--:-- --',  estado: 'falta'        },
        { matricula: '202188231', nombre: 'García Ruiz, Fernando',       iniciales: 'GR', colorAvatar: 'bg-[#42d0fe] text-[#00566d]',    hora: '08:01 AM', estado: 'presente'     },
        { matricula: '202155612', nombre: 'Lopez Torres, Ricardo',       iniciales: 'LT', colorAvatar: 'bg-[#d29460] text-white',         hora: '--:-- --',  estado: 'justificado'  },
      ]
    },
    {
      nrc: '28491',
      nombre: 'Sistemas Distribuidos',
      seccion: '002',
      horario: 'Martes, Jueves 14:00 - 16:00',
      programa: 'Postgrado en Computación',
      periodo: 'Primavera 2026',
      alumnos: [
        { matricula: '202144551', nombre: 'Carlos Mendoza Rivas', iniciales: 'CM', colorAvatar: 'bg-indigo-100 text-indigo-900', hora: '14:05 PM', estado: 'presente' },
        { matricula: '202188992', nombre: 'Sofia Castro Vega', iniciales: 'SC', colorAvatar: 'bg-pink-100 text-pink-900', hora: '14:12 PM', estado: 'retardo' },
        { matricula: '202199003', nombre: 'Luis Fernando Torres', iniciales: 'LT', colorAvatar: 'bg-teal-100 text-teal-900', hora: '14:01 PM', estado: 'presente' },
      ]
    }
  ];

  materiaSeleccionadaNrc = signal<string>('15842');
  materia = this.listaMateriasDisponibles[0];
  fechaSeleccionada = new Date().toISOString().split('T')[0];
  busqueda = '';

  alumnos = signal<Alumno[]>(this.materia.alumnos);

  constructor() {}

  cambiarMateria(nrc: string) {
    const mat = this.listaMateriasDisponibles.find(m => m.nrc === nrc);
    if (mat) {
      this.materiaSeleccionadaNrc.set(mat.nrc);
      this.materia = mat;
      this.alumnos.set(mat.alumnos);
    }
  }

  // Resumen calculado reactivamente
  resumen = computed(() => {
    const lista = this.alumnos();
    return {
      total:        lista.length,
      presentes:    lista.filter(a => a.estado === 'presente').length,
      faltas:       lista.filter(a => a.estado === 'falta').length,
      retardos:     lista.filter(a => a.estado === 'retardo').length,
      justificados: lista.filter(a => a.estado === 'justificado').length,
      porcentaje:   Math.round((lista.filter(a => a.estado === 'presente' || a.estado === 'retardo').length / lista.length) * 100) || 0,
    };
  });

  // Guardar cambios (placeholder — conectará a MS-Asistencias POST /asistencias/registrar)
  guardando = signal<boolean>(false);
  mensajeExito = signal<string | null>(null);

  justificarFalta(matricula: string) {
    this.alumnos.update(lista => 
      lista.map(a => a.matricula === matricula ? { ...a, estado: 'justificado' } : a)
    );
    this.mensajeExito.set(`Se ha justificado la inasistencia del alumno con matrícula ${matricula}. Recuerde confirmar los cambios.`);
    setTimeout(() => this.mensajeExito.set(null), 4000);
  }

  confirmarAsistencia() {
    this.guardando.set(true);
    setTimeout(() => {
      this.guardando.set(false);
      this.mensajeExito.set('El pase de lista ha sido confirmado y cerrado oficialmente en MS-Asistencias.');
      setTimeout(() => this.mensajeExito.set(null), 5000);
    }, 2000);
  }

  solicitarDeNuevo() {
    // Aquí se invalidaría la sesión y se reiniciaría el escáner
    this.alumnos.update(lista => lista.map(a => ({ ...a, estado: 'falta', hora: '--:-- --' })));
    this.mensajeExito.set('Sesión descartada. Puede iniciar un nuevo pase de lista por QR.');
    setTimeout(() => this.mensajeExito.set(null), 5000);
  }
}
