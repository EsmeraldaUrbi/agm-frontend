import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  materia = {
    nrc: '28491',
    nombre: 'Web Services Architecture',
    seccion: '101',
    horario: 'Lunes, Miércoles 16:00 - 18:00',
    programa: 'Postgrado en Computación',
    periodo: 'Primavera 2026',
  };

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.materia.nrc = id;
      }
    });
  }

  tabs = ['Alumnos', 'Ponderaciones', 'Actividades', 'Asistencias', 'Reportes'];

  ponderaciones = [
    { id: 'p1', nombre: 'Exámenes Parciales', porcentaje: 40 },
    { id: 'p2', nombre: 'Tareas y Taller',    porcentaje: 30 },
    { id: 'p3', nombre: 'Proyecto Final',     porcentaje: 20 },
    { id: 'p4', nombre: 'Asistencia',         porcentaje: 10 },
  ];

  filtroPonderacion = signal<string>('todas');

  actividades = signal<Actividad[]>([
    {
      id: '16655e27-37d5-470a-bac2-f9ebbf48e850',
      ponderacion_id: 'p1',
      ponderacion_nombre: 'Exámenes Parciales',
      nombre: 'Examen Parcial Semana 1',
      descripcion: 'Evaluación teórica de conceptos de microservicios y REST APIs',
      valor_maximo: 10.0,
      fecha_aplicacion: '2026-05-10',
      estado: 'activa',
      evaluados: 30,
      total: 36,
      promedio: 8.42
    },
    {
      id: 'act-2',
      ponderacion_id: 'p2',
      ponderacion_nombre: 'Tareas y Taller',
      nombre: 'Práctica 1: Docker y Compose',
      descripcion: 'Contenerización de una aplicación Node.js con Redis',
      valor_maximo: 10.0,
      fecha_aplicacion: '2026-05-12',
      estado: 'activa',
      evaluados: 35,
      total: 36,
      promedio: 9.10
    },
    {
      id: 'act-3',
      ponderacion_id: 'p2',
      ponderacion_nombre: 'Tareas y Taller',
      nombre: 'Práctica 2: gRPC en Python',
      descripcion: 'Implementación de un servidor y cliente gRPC bidireccional',
      valor_maximo: 10.0,
      fecha_aplicacion: '2026-05-15',
      estado: 'activa',
      evaluados: 28,
      total: 36,
      promedio: 8.75
    },
    {
      id: 'act-4',
      ponderacion_id: 'p3',
      ponderacion_nombre: 'Proyecto Final',
      nombre: 'Definición de Arquitectura',
      descripcion: 'Entrega del diagrama C4 y contratos OpenAPI/Protobuf',
      valor_maximo: 10.0,
      fecha_aplicacion: '2026-05-20',
      estado: 'activa',
      evaluados: 0,
      total: 36,
      promedio: 0.0
    }
  ]);

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
        procesadas: 36,
        insertadas: 30,
        actualizadas: 0,
        omitidas: [
          {
            fila: 7,
            motivo: 'Fila sin puntos; se considera no calificada',
            correo: 'diego.cannata@alumno.buap.mx'
          },
          {
            fila: 11,
            motivo: 'Fila sin puntos; se considera no calificada',
            correo: 'alejandro.garciacon@alumno.buap.mx'
          }
        ]
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
