import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MateriasService } from '../../../core/services/materias.service';

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
    asistencias: 100
  });

  constructor(
    private route: ActivatedRoute,
    private materiasService: MateriasService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDatosMateria(id);
      }
    });
  }

  cargarDatosMateria(id: string) {
    this.materiasService.getMateriaById(id).subscribe({
      next: (data: any) => {
        let horarioFormat = 'Horario no definido';
        if (data.horarios && data.horarios.length > 0) {
          const gruposHorarios: { [key: string]: string[] } = {};
          data.horarios.forEach((h: any) => {
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

        this.materia.set({
          materia_id: id,
          nrc: data.nrc || 'N/A',
          nombre: data.nombre || 'Materia sin nombre',
          seccion: data.seccion || '001',
          alumnos: data.alumnos_inscritos || 0,
          promedioGrupal: 0, // Por ahora mock
          asistencias: 100, // Por ahora mock
          horario: horarioFormat,
          programa: data.programa || 'Licenciatura en Ciencias de la Computación',
          periodo: data.periodo?.nombre || 'Otoño 2024'
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
    this.mostrarModalCierre = true;
  }

  confirmarCierre() {
    // Aquí se llamará a DELETE /sesiones/:id/cerrar (MS-5) y
    // el backend notifica por correo a los alumnos vía MS-6
    this.estadoMateria.set('cerrada');
    // Marcar checklist de acta como pendiente
    this.mostrarModalCierre = false;
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
