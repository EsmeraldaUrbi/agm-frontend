import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MateriasService } from '../../../core/services/materias.service';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';

type EstadoMateria = 'activa' | 'cerrada' | 'finalizada';

@Component({
  selector: 'app-cierre-materia',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cierre-materia.component.html'
})
export class CierreMateriaComponent {
  // Estado actual de la materia — cambia el UI dinámicamente
  // 'activa'    → Puede cerrarse (notifica alumnos por correo)
  // 'cerrada'   → Cerrada, puede recibir cambios hasta imprimir acta
  // 'finalizada'→ Acta impresa, no acepta más cambios
  estadoMateria = signal<EstadoMateria>('activa');

  materia = signal<any>({
    materia_id: '',
    nrc: '',
    nombre: 'Cargando materia...',
    seccion: '',
    horario: 'Sin horario asignado',
    programa: 'Cargando programa...',
    periodo: 'Cargando periodo...',
    alumnos: 0,
    promedioGrupal: 0,
    asistencias: 0
  });

  // Estado de la operación de cierre
  cerrando = signal<boolean>(false);
  errorCierre = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private materiasService: MateriasService,
    private calificacionesService: CalificacionesService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDatosMateria(id);
      }
    });
  }

  cargarDatosMateria(id: string) {
    // Cargamos en paralelo: datos de la materia + rendimiento de calificaciones
    forkJoin({
      materia: this.materiasService.getMateriaById(id),
      rendimiento: this.calificacionesService.getRendimientoMateria(id).pipe(
        catchError(() => of({ rendimiento_promedio: 0 }))
      )
    }).subscribe({
      next: ({ materia: data, rendimiento }) => {
        let horarioFormat = 'Horario no definido';
        if ((data as any).horarios && (data as any).horarios.length > 0) {
          const gruposHorarios: { [key: string]: string[] } = {};
          (data as any).horarios.forEach((h: any) => {
            const ini = h.hora_inicio?.substring(0, 5) || '';
            const fin = h.hora_fin?.substring(0, 5) || '';
            const rango = `${ini} - ${fin}`;
            if (!gruposHorarios[rango]) gruposHorarios[rango] = [];
            gruposHorarios[rango].push(h.dia);
          });
          const partes = Object.entries(gruposHorarios).map(([rango, dias]) => {
            return `${dias.join(', ')} ${rango}`;
          });
          horarioFormat = partes.join(' | ');
        }

        const promedioReal = rendimiento?.rendimiento_promedio ?? 0;

        this.materia.set({
          materia_id: id,
          nrc: (data as any).nrc || 'N/A',
          nombre: (data as any).nombre || 'Materia sin nombre',
          seccion: (data as any).seccion || '001',
          alumnos: (data as any).alumnos_inscritos || 0,
          promedioGrupal: Number(promedioReal.toFixed(1)),
          asistencias: 0, // Se puede conectar a MS-5 en el futuro
          horario: horarioFormat,
          programa: (data as any).programa || 'Licenciatura en Ciencias de la Computación',
          periodo: (data as any).periodo?.nombre || 'Otoño 2024'
        });
      },
      error: (err) => {
        console.error('Error al cargar la materia', err);
      }
    });
  }

  checklist = [
    { label: 'Calificaciones registradas', completado: true },
    { label: 'Asistencias finalizadas', completado: true },
    { label: 'Observaciones académicas', completado: true },
    { label: 'Generación de Acta Final', completado: false },
  ];

  // Modal de confirmación
  mostrarModalCierre = false;
  mostrarModalActa = false;

  abrirModalCierre() {
    this.errorCierre.set(null);
    this.mostrarModalCierre = true;
  }

  confirmarCierre() {
    const materiaId = this.materia().materia_id;
    if (!materiaId) return;

    this.cerrando.set(true);
    this.errorCierre.set(null);

    this.calificacionesService.cerrarConcentrado(materiaId).subscribe({
      next: () => {
        this.cerrando.set(false);
        this.estadoMateria.set('cerrada');
        this.mostrarModalCierre = false;
      },
      error: (err) => {
        this.cerrando.set(false);
        this.mostrarModalCierre = false;

        // Interpretar el error correctamente sin redirigir
        const status = err?.status;
        const mensaje = err?.error?.message || err?.error?.detail || err?.message;

        if (status === 400) {
          this.errorCierre.set(
            mensaje || 'No se puede cerrar la materia: verifica que todas las calificaciones estén registradas.'
          );
        } else if (status === 403) {
          // 403 de negocio ≠ 403 de permisos de rol
          // El interceptor ya redirige a /acceso-denegado si el backend devuelve 403 genérico.
          // Por eso, el backend del concentrado debería devolver 400 o 422 para errores de validación.
          this.errorCierre.set(
            mensaje || 'Error al cerrar la materia: verifica que la materia tenga ponderaciones configuradas.'
          );
        } else if (status === 404) {
          this.errorCierre.set('No se encontró el concentrado de calificaciones para esta materia.');
        } else if (status === 422) {
          this.errorCierre.set(
            mensaje || 'Validación fallida: verifica que todas las ponderaciones y calificaciones estén completas.'
          );
        } else {
          this.errorCierre.set(
            mensaje || `Error inesperado (${status}). Intente de nuevo o contacte a soporte.`
          );
        }

        console.error('Error al cerrar concentrado:', err);
      }
    });
  }

  abrirModalActa() {
    this.mostrarModalActa = true;
  }

  confirmarImpresionActa() {
    // Al confirmar, la materia queda finalizada y no acepta más cambios
    // Llamada a MS-7: GET /reportes/calificaciones/:materiaId?formato=pdf
    this.checklist[3].completado = true;
    this.estadoMateria.set('finalizada');
    this.mostrarModalActa = false;
  }

  cancelarModal() {
    this.mostrarModalCierre = false;
    this.mostrarModalActa = false;
  }

  get esCerrada() { return this.estadoMateria() === 'cerrada'; }
  get esFinalizada() { return this.estadoMateria() === 'finalizada'; }
  get esActiva() { return this.estadoMateria() === 'activa'; }
}
