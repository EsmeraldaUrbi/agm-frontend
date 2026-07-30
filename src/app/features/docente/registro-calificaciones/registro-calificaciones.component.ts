import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MateriaContextService } from '../../../core/services/materia-context.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { CalificacionesService, Actividad, Calificacion } from '../../../core/services/calificaciones.service';

interface CalificacionActividad {
  id: string; // calificacion_id si existe, vacío si no
  actividad_id: string;
  materia_id: string;
  alumno_id: string;
  matricula: string;
  nombre: string;
  correo: string;
  calificacion: number | null;
  observaciones: string;
  actividad_nombre: string;
  estatus_entrega?: string;
}

@Component({
  selector: 'app-registro-calificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './registro-calificaciones.component.html'
})
export class RegistroCalificacionesComponent {
  materia = signal<any>({
    materia_id: '',
    nrc: '',
    nombre: 'Cargando materia...',
    seccion: '',
    horario: 'Sin horario asignado',
    programa: 'Cargando programa...',
    periodo: 'Cargando periodo...',
  });

  tabs = ['Alumnos', 'Ponderaciones', 'Actividades'];

  // Estado inicial de carga para evitar valores indefinidos antes de consultar la actividad real
  actividadActual = signal<any>({
    id: '',
    actividad_id: '',
    nombre: 'Cargando actividad...',
    valor_maximo: 10.0,
    ponderacion_nombre: 'Cargando...'
  });

  calificaciones = signal<CalificacionActividad[]>([]);

  constructor(
    private route: ActivatedRoute,
    private materiaContextService: MateriaContextService,
    private alumnosService: AlumnosService,
    private calificacionesService: CalificacionesService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const actividadId = this.route.snapshot.queryParams['actividad'];
      
      if (id) {
        this.cargarDatosMateria(id);
        if (actividadId) {
          this.cargarDatosCalificacion(id, actividadId);
        }
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
      },
      error: (err) => {
        console.error('Error al cargar contexto académico de la materia', err);
      }
    });
  }

  cargarDatosCalificacion(materiaId: string, actividadId: string) {
    // Obtener la actividad real y la ponderación
    this.calificacionesService.getActividadById(actividadId).subscribe({
      next: (act) => {
        // Obtenemos ponderaciones de la materia para saber el nombre de la ponderación
        this.calificacionesService.getPonderaciones(materiaId).subscribe({
          next: (pondRes) => {
            let pondNombre = 'General';
            if (pondRes && pondRes.criterios) {
              const pond = pondRes.criterios.find(p => (p as any).id === act.ponderacion_id || (p as any).ponderacion_id === act.ponderacion_id);
              if (pond) pondNombre = pond.nombre;
            }
            this.actividadActual.set({
              id: act.actividad_id,
              actividad_id: act.actividad_id,
              nombre: act.nombre,
              valor_maximo: act.valor_maximo,
              ponderacion_nombre: pondNombre
            });
          }
        });
      },
      error: (err) => console.error('Error cargando actividad', err)
    });

    // Obtener alumnos inscritos en MS3 y calificaciones existentes en MS4 en paralelo
    forkJoin({
      alumnos: this.alumnosService.getAlumnosByMateria(materiaId),
      calificaciones: this.calificacionesService.getCalificacionesByActividad(actividadId)
    }).subscribe({
      next: ({ alumnos, calificaciones }) => {
        const actividadNombre = this.actividadActual().nombre;
        
        const combinados: CalificacionActividad[] = alumnos.map(alumno => {
          // Buscar si el alumno ya tiene calificación
          const calif = calificaciones.find(c => c.alumno_id === alumno.alumno_id);
          
          return {
            id: calif?.calificacion_id || '',
            actividad_id: actividadId,
            materia_id: materiaId,
            alumno_id: alumno.alumno_id || '',
            matricula: alumno.matricula || 'S/N',
            nombre: alumno.nombre_completo,
            correo: alumno.correo,
            calificacion: calif ? calif.calificacion : null,
            observaciones: calif?.observaciones || '',
            actividad_nombre: actividadNombre,
            estatus_entrega: calif ? 'Entregado a Tiempo' : 'Pendiente'
          };
        });
        
        this.calificaciones.set(combinados);
      },
      error: (err) => {
        console.error('Error cargando alumnos y/o calificaciones', err);
      }
    });
  }

  // Modal Importar Excel
  showImportModal = signal(false);
  archivoSeleccionado = signal<string>('');
  archivoParaSubir: File | null = null;
  importando = signal(false);
  resultadoImportacion = signal<any | null>(null);

  abrirImportarModal() {
    this.archivoSeleccionado.set('');
    this.archivoParaSubir = null;
    this.resultadoImportacion.set(null);
    this.showImportModal.set(true);
  }

  seleccionarArchivo(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
        alert('Por favor selecciona un archivo Excel (.xls o .xlsx)');
        event.target.value = '';
        return;
      }
      this.archivoSeleccionado.set(file.name);
      this.archivoParaSubir = file;
    }
  }

  confirmarImportacion() {
    const actId = this.actividadActual().actividad_id;
    if (!actId) {
      alert('Error: No se encontró el ID de la actividad.');
      return;
    }
    if (!this.archivoParaSubir) {
      alert('Por favor selecciona un archivo primero.');
      return;
    }

    this.importando.set(true);
    
    this.calificacionesService.importarCalificaciones({
      actividad_id: actId,
      archivo: this.archivoParaSubir
    }).subscribe({
      next: (res) => {
        this.importando.set(false);
        this.resultadoImportacion.set(res.data || res);
        
        // Recargar la tabla con calificaciones actualizadas desde MS4
        this.cargarDatosCalificacion(this.materia().materia_id, actId);
      },
      error: (err) => {
        this.importando.set(false);
        console.error('Error al importar calificaciones:', err);
        alert('Hubo un error al procesar el archivo Excel. Verifica el formato y vuelve a intentarlo.');
      }
    });
  }

  cerrarImportModal() {
    this.showImportModal.set(false);
    this.resultadoImportacion.set(null);
    this.archivoParaSubir = null;
  }

  // ==========================================
  // MODAL CALIFICACIÓN MANUAL POR ALUMNO
  // ==========================================
  showManualModal = signal(false);
  alumnoSeleccionado = signal<CalificacionActividad | null>(null);
  formCalificacionManual = signal({
    calificacion: 0,
    observaciones: '',
    estatus_entrega: 'Entregado a Tiempo'
  });
  mensajeExitoManual = signal<string | null>(null);

  abrirManualModal(alumno: CalificacionActividad) {
    this.alumnoSeleccionado.set(alumno);
    this.formCalificacionManual.set({
      calificacion: alumno.calificacion || 0,
      observaciones: alumno.observaciones || '',
      estatus_entrega: alumno.estatus_entrega || 'Entregado a Tiempo'
    });
    this.showManualModal.set(true);
  }

  cerrarManualModal() {
    this.showManualModal.set(false);
    this.alumnoSeleccionado.set(null);
  }

  guardarCalificacionManual() {
    const current = this.alumnoSeleccionado();
    const actId = this.actividadActual().actividad_id;
    
    if (!current || !actId) return;

    const form = this.formCalificacionManual();
    const isActualizacion = !!current.id;

    const payload: Partial<Calificacion> = {
      calificacion: Number(form.calificacion),
      observaciones: form.observaciones
    };

    const request$ = isActualizacion 
      ? this.calificacionesService.updateCalificacion(current.id, payload)
      : this.calificacionesService.createCalificacion({
          ...payload,
          actividad_id: actId,
          alumno_id: current.alumno_id,
          materia_id: current.materia_id
        });

    request$.subscribe({
      next: (res) => {
        this.showManualModal.set(false);
        this.mensajeExitoManual.set(`¡Calificación de ${current.nombre} guardada exitosamente en MS4!`);
        
        // Recargar los datos para asegurar sincronización con MS4
        this.cargarDatosCalificacion(this.materia().materia_id, actId);

        setTimeout(() => {
          this.mensajeExitoManual.set(null);
        }, 4000);
      },
      error: (err) => {
        console.error('Error guardando calificación manual', err);
        alert('Hubo un error al guardar la calificación en MS-Calificaciones.');
      }
    });
  }

  // Contadores y Promedios basados en los datos reales del MS4
  alumnosCalificados = computed(() => {
    return this.calificaciones().filter(c => c.calificacion !== null).length;
  });

  alumnosSinCalificarOCero = computed(() => {
    return this.calificaciones().filter(c => c.calificacion === null || c.calificacion === 0).length;
  });

  alumnosAprobados = computed(() => {
    const max = this.actividadActual().valor_maximo || 10;
    const minimoAprobatorio = max * 0.6; // 60%
    return this.calificaciones().filter(c => c.calificacion !== null && c.calificacion >= minimoAprobatorio).length;
  });

  promedioActividad = computed(() => {
    const list = this.calificaciones().filter(c => c.calificacion !== null);
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, c) => acc + (Number(c.calificacion) || 0), 0);
    return sum / list.length;
  });
}
