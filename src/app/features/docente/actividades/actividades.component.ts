import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MateriasService } from '../../../core/services/materias.service';

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
          // Algunos datos aún podrían ser mock hasta tener el servicio completo:
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

  abrirCrearModal() {
    this.nuevaActividad = {
      ponderacion_id: 'p1',
      nombre: '',
      descripcion: '',
      valor_maximo: 10.0,
      fecha_aplicacion: new Date().toISOString().split('T')[0]
    };
    this.showCrearModal.set(true);
  }

  guardarActividad() {
    if (!this.nuevaActividad.nombre) return;
    const pond = this.ponderaciones.find(p => p.id === this.nuevaActividad.ponderacion_id);

    const act: Actividad = {
      id: 'act-' + (this.actividades().length + 1),
      ponderacion_id: this.nuevaActividad.ponderacion_id,
      ponderacion_nombre: pond ? pond.nombre : 'General',
      nombre: this.nuevaActividad.nombre,
      descripcion: this.nuevaActividad.descripcion,
      valor_maximo: this.nuevaActividad.valor_maximo,
      fecha_aplicacion: this.nuevaActividad.fecha_aplicacion,
      estado: 'activa',
      evaluados: 0,
      total: 36,
      promedio: 0.0
    };

    this.actividades.update(list => [act, ...list]);
    this.showCrearModal.set(false);
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
