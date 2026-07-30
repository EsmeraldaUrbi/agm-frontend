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
          periodo: contexto.periodo
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

  abrirImportarModal(actividad: Actividad) {
    this.actividadSeleccionada.set(actividad);
    this.archivoSeleccionado.set('');
    this.resultadoImportacion.set(null);
    this.showImportModal.set(true);
  }

  seleccionarArchivo(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file.name);
    }
  }

  confirmarImportacion() {
    this.importando.set(true);
    setTimeout(() => {
      this.importando.set(false);
      // Simular respuesta exacta de FastAPI (Imagen 1)
      this.resultadoImportacion.set({
        actividad_id: this.actividadSeleccionada()?.id || '16655e27-37d5-470a-bac2-f9ebbf48e850',
        materia_id: '22222222-2222-2222-2222-222222222222',
        procesadas: 0,
        insertadas: 0,
        actualizadas: 0,
        omitidas: []
      });

      // Actualizar evaluados en la actividad
      if (this.actividadSeleccionada()) {
        this.actividades.update(list => list.map(a => 
          a.id === this.actividadSeleccionada()!.id ? { ...a, evaluados: 30, promedio: 8.5 } : a
        ));
      }
    }, 1500);
  }

  cerrarImportModal() {
    this.showImportModal.set(false);
    this.resultadoImportacion.set(null);
  }

  eliminarActividad(id: string) {
    this.actividades.update(list => list.filter(a => a.id !== id));
  }
}
