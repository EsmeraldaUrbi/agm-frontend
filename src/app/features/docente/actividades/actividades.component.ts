import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MateriaContextService } from '../../../core/services/materia-context.service';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface Actividad {
  id: string;
  ponderacion_id: string;
  ponderacion_nombre: string;
  nombre: string;
  descripcion: string;
  valor_maximo: number;
  fecha_aplicacion: string;
  estado: 'activa' | 'cerrada';
  evaluados: number;
  total: number;
  promedio: number;
}

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './actividades.component.html'
})
export class ActividadesComponent {
  materia = signal<any>({
    materia_id: '',
    nrc: '',
    nombre: 'Cargando materia...',
    seccion: '',
    horario: 'Sin horario asignado',
    programa: 'Cargando programa...',
    periodo: 'Cargando periodo...',
    estado: '',
  });

  constructor(
    private route: ActivatedRoute,
    private materiaContextService: MateriaContextService,
    private calificacionesService: CalificacionesService,
    private alumnosService: AlumnosService
  ) {
    this.route.paramMap.subscribe(params => {
      const nrc = params.get('id');
      if (nrc) {
        this.cargarDatosMateria(nrc);
      }
    });
  }

  cargarDatosMateria(id: string) {
    this.materiaContextService.getContextoMateria(id).subscribe({
      next: (contexto) => {
        this.materia.set({
          materia_id: contexto.materia_id,
          nrc: contexto.nrc,
          nombre: contexto.nombre,
          seccion: contexto.seccion,
          horario: contexto.horario,
          programa: contexto.programa,
          periodo: contexto.periodo,
          estado: contexto.estado || contexto.raw?.estado || contexto.raw?.estado_materia || ''
        });

        this.cargarPonderaciones(contexto.materia_id);
      },
      error: (err) => {
        console.error('Error al cargar contexto académico de la materia', err);
      }
    });
  }

  tabs = ['Alumnos', 'Ponderaciones', 'Actividades'];

  ponderaciones: any[] = [];

  filtroPonderacion = signal<string>('todas');

  actividades = signal<Actividad[]>([]);
  errorOperacion = signal('');

  materiaCerrada = computed(() =>
    String(this.materia().estado || '').trim().toUpperCase() === 'CERRADA'
  );

  actividadesFiltradas = computed(() => {
    const filtro = this.filtroPonderacion();
    if (filtro === 'todas') return this.actividades();
    return this.actividades().filter(a => a.ponderacion_id === filtro);
  });

  // Modal Crear Actividad
  showCrearModal = signal(false);
  nuevaActividad = {
    ponderacion_id: 'p1',
    nombre: '',
    descripcion: '',
    valor_maximo: 10.0,
    fecha_aplicacion: new Date().toISOString().split('T')[0]
  };

  cargarPonderaciones(materiaId: string) {
    this.calificacionesService.getPonderaciones(materiaId).subscribe({
      next: (res) => {
        if (res && res.criterios) {
          this.ponderaciones = res.criterios;
        } else {
          this.ponderaciones = [];
        }
        this.cargarActividades(materiaId);
      },
      error: (err) => {
        console.error('Error cargando ponderaciones', err);
        this.ponderaciones = [];
        this.cargarActividades(materiaId);
      }
    });
  }

  cargarActividades(materiaId: string) {
    this.alumnosService.getAlumnosByMateria(materiaId).pipe(
      catchError(() => of([]))
    ).subscribe(alumnos => {
      const totalAlumnos = alumnos.length;

      this.calificacionesService.getActividadesByMateria(materiaId).subscribe({
        next: (data) => {
          if (data.length === 0) {
            this.actividades.set([]);
            return;
          }

          const requests = data.map(act => {
            const actividadId = act.actividad_id || '';
            if (!actividadId) return of({ evaluados: 0, promedio: 0.0 });

            return this.calificacionesService.getCalificacionesByActividad(actividadId).pipe(
              map(califs => {
                const evaluados = califs.length;
                let promedio = 0.0;
                if (evaluados > 0) {
                  const sum = califs.reduce((s, c) => s + (c.calificacion || 0), 0);
                  promedio = Number((sum / evaluados).toFixed(1));
                }
                return { evaluados, promedio };
              }),
              catchError(() => of({ evaluados: 0, promedio: 0.0 }))
            );
          });

          forkJoin(requests).subscribe({
            next: (statsList: any[]) => {
              const mapped = data.map((act, index) => {
                const pond = this.ponderaciones.find(p => p.id === act.ponderacion_id);
                const stats = statsList[index];
                return {
                  ...act,
                  id: act.actividad_id || '',
                  ponderacion_nombre: pond ? pond.nombre : 'General',
                  estado: act.estado || 'activa',
                  evaluados: stats.evaluados,
                  total: totalAlumnos,
                  promedio: stats.promedio
                } as Actividad;
              });
              this.actividades.set(mapped);
            },
            error: (err) => {
              console.error('Error al obtener estadísticas de calificaciones:', err);
              const mapped = data.map(act => {
                const pond = this.ponderaciones.find(p => p.id === act.ponderacion_id);
                return {
                  ...act,
                  id: act.actividad_id || '',
                  ponderacion_nombre: pond ? pond.nombre : 'General',
                  estado: act.estado || 'activa',
                  evaluados: 0,
                  total: totalAlumnos,
                  promedio: 0.0
                } as Actividad;
              });
              this.actividades.set(mapped);
            }
          });
        },
        error: (err) => {
          console.error('Error cargando actividades', err);
        }
      });
    });
  }

  abrirCrearModal() {
    if (this.materiaCerrada()) {
      this.errorOperacion.set('No se pueden crear actividades porque la materia está cerrada.');
      return;
    }

    if (this.ponderaciones.length === 0) {
      alert('Primero debes configurar las ponderaciones de esta materia.');
      return;
    }
    this.nuevaActividad = {
      ponderacion_id: this.ponderaciones[0].id,
      nombre: '',
      descripcion: '',
      valor_maximo: 10.0,
      fecha_aplicacion: new Date().toISOString().split('T')[0]
    };
    this.showCrearModal.set(true);
  }

  guardarActividad() {
    if (this.materiaCerrada()) {
      this.errorOperacion.set('No se pueden guardar actividades porque la materia está cerrada.');
      return;
    }

    if (!this.nuevaActividad.nombre || !this.nuevaActividad.ponderacion_id) return;
    
    const payload = {
      materia_id: this.materia().materia_id,
      ponderacion_id: this.nuevaActividad.ponderacion_id,
      nombre: this.nuevaActividad.nombre,
      descripcion: this.nuevaActividad.descripcion,
      valor_maximo: this.nuevaActividad.valor_maximo,
      fecha_aplicacion: this.nuevaActividad.fecha_aplicacion
    };

    this.calificacionesService.createActividad(payload).subscribe({
      next: (res) => {
        this.showCrearModal.set(false);
        this.cargarActividades(this.materia().materia_id);
      },
      error: (err) => {
        console.error('Error creando actividad', err);
        alert('Hubo un error al guardar la actividad.');
      }
    });
  }

  // Modal Importar Excel
  showImportModal = signal(false);
  actividadSeleccionada = signal<Actividad | null>(null);
  archivoSeleccionado = signal<string>('');
  importando = signal(false);
  resultadoImportacion = signal<any | null>(null);
  private archivoImportacion: File | null = null;

  abrirImportarModal(actividad: Actividad) {
    if (this.materiaCerrada()) {
      this.errorOperacion.set('No se pueden importar calificaciones porque la materia está cerrada.');
      return;
    }

    this.actividadSeleccionada.set(actividad);
    this.archivoSeleccionado.set('');
    this.archivoImportacion = null;
    this.resultadoImportacion.set(null);
    this.errorOperacion.set('');
    this.showImportModal.set(true);
  }

  seleccionarArchivo(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.archivoImportacion = file;
      this.archivoSeleccionado.set(file.name);
      this.errorOperacion.set('');
    }
  }

  confirmarImportacion() {
    if (this.materiaCerrada()) {
      this.errorOperacion.set('No se puede importar: la materia está cerrada.');
      return;
    }

    const actividad = this.actividadSeleccionada();

    if (!actividad || !this.archivoImportacion) {
      this.errorOperacion.set('Selecciona un archivo antes de importar calificaciones.');
      return;
    }

    this.importando.set(true);
    this.errorOperacion.set('');

    this.calificacionesService.importarCalificaciones({
      actividad_id: actividad.id,
      archivo: this.archivoImportacion
    }).subscribe({
      next: (res) => {
        this.importando.set(false);
        const resultado = res?.data || res;
        this.resultadoImportacion.set(resultado);
        this.cargarActividades(this.materia().materia_id);
      },
      error: (err) => {
        this.importando.set(false);
        console.error('Error al importar calificaciones:', err);

        const backendMessage =
          err?.error?.detail ||
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          '';

        this.errorOperacion.set(
          String(backendMessage).trim() ||
          'No se pudieron importar las calificaciones. Verifica que el archivo tenga el formato esperado por el backend.'
        );
      }
    });
  }

  cerrarImportModal() {
    this.showImportModal.set(false);
    this.resultadoImportacion.set(null);
    this.archivoSeleccionado.set('');
    this.archivoImportacion = null;
  }

  eliminarActividad(id: string) {
    if (this.materiaCerrada()) {
      this.errorOperacion.set('No se pueden eliminar actividades porque la materia está cerrada.');
      return;
    }

    const confirmar = confirm('¿Deseas eliminar esta actividad? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    this.errorOperacion.set('');

    this.calificacionesService.deleteActividad(id).subscribe({
      next: () => {
        this.actividades.update(list => list.filter(a => a.id !== id));
      },
      error: (err) => {
        console.error('Error al eliminar actividad:', err);

        const backendMessage =
          err?.error?.detail ||
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          '';

        this.errorOperacion.set(
          String(backendMessage).trim() ||
          'No se pudo eliminar la actividad. Es posible que ya tenga calificaciones registradas.'
        );
      }
    });
  }
}
