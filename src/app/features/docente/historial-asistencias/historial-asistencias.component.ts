import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';

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
export class HistorialAsistenciasComponent implements OnInit {
  
  private authService = inject(AuthService);
  private docentesService = inject(DocentesService);
  private materiasService = inject(MateriasService);

  listaMateriasDisponibles: MateriaActiva[] = [];
  materiaSeleccionadaNrc = signal<string>('');
  materia: MateriaActiva | null = null;
  fechaSeleccionada = new Date().toISOString().split('T')[0];
  busqueda = '';
  alumnos = signal<Alumno[]>([]);
  isLoading = signal(false);
  docenteId: string | null = null;

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
          nrc: m.nrc || 'N/A',
          nombre: m.nombre || 'Materia sin Nombre',
          seccion: m.seccion || '001',
          horario: 'Por definir',
          programa: 'Licenciatura',
          periodo: m.periodo_id || 'Actual',
          alumnos: []
        }));
        
        if (this.listaMateriasDisponibles.length > 0) {
          this.cambiarMateria(this.listaMateriasDisponibles[0].nrc);
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
      porcentaje:   lista.length > 0 ? Math.round((lista.filter(a => a.estado === 'presente' || a.estado === 'retardo').length / lista.length) * 100) : 0,
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
