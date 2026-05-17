import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface CalificacionActividad {
  id: string;
  actividad_id: string;
  materia_id: string;
  alumno_id: string;
  matricula: string;
  nombre: string;
  correo: string;
  calificacion: number;
  observaciones: string;
  actividad_nombre: string;
}

@Component({
  selector: 'app-registro-calificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './registro-calificaciones.component.html'
})
export class RegistroCalificacionesComponent {
  materia = {
    nrc: '28491',
    nombre: 'Web Services Architecture',
    seccion: '101',
    horario: 'Lunes, Miércoles 16:00 - 18:00',
    programa: 'Postgrado en Computación',
    periodo: 'Primavera 2026',
  };

  tabs = ['Resumen', 'Alumnos', 'Ponderaciones', 'Actividades', 'Calificaciones', 'Asistencias', 'Reportes'];

  actividadActual = {
    id: '16655e27-37d5-470a-bac2-f9ebbf48e850',
    nombre: 'Examen Parcial Semana 1',
    valor_maximo: 10.0,
    ponderacion_nombre: 'Exámenes Parciales'
  };

  // Calificaciones obtenidas de GET /calificaciones/actividad/{actividad_id} (Imagen 2)
  calificaciones = signal<CalificacionActividad[]>([
    {
      id: '4ce31fe6-6c07-48b4-b682-140c48f21a5c',
      actividad_id: '16655e27-37d5-470a-bac2-f9ebbf48e850',
      materia_id: '22222222-2222-2222-2222-222222222222',
      alumno_id: '27f6b659-c932-5909-a4ec-6e1ca8125b30',
      matricula: '202012345',
      nombre: 'Diego Cannata',
      correo: 'diego.cannata@alumno.buap.mx',
      calificacion: 10.0,
      observaciones: 'Buen trabajo, solo que te falto el video',
      actividad_nombre: 'Examen Parcial Semana 1'
    },
    {
      id: '42683313-7738-4452-8377-9d64f6f4ff0f',
      actividad_id: '16655e27-37d5-470a-bac2-f9ebbf48e850',
      materia_id: '22222222-2222-2222-2222-222222222222',
      alumno_id: '7c116137-8fa1-5f25-a8af-36fa1dfb4fff',
      matricula: '202015678',
      nombre: 'Alejandro Garcia',
      correo: 'alejandro.garciacon@alumno.buap.mx',
      calificacion: 0.0,
      observaciones: 'No entregado',
      actividad_nombre: 'Examen Parcial Semana 1'
    },
    {
      id: 'cal-3',
      actividad_id: '16655e27-37d5-470a-bac2-f9ebbf48e850',
      materia_id: '22222222-2222-2222-2222-222222222222',
      alumno_id: 'alu-3',
      matricula: '202019921',
      nombre: 'Maria Rodriguez Ortiz',
      correo: 'maria.rodriguez@alumno.buap.mx',
      calificacion: 9.5,
      observaciones: 'Excelente análisis y diagrama C4',
      actividad_nombre: 'Examen Parcial Semana 1'
    },
    {
      id: 'cal-4',
      actividad_id: '16655e27-37d5-470a-bac2-f9ebbf48e850',
      materia_id: '22222222-2222-2222-2222-222222222222',
      alumno_id: 'alu-4',
      matricula: '202113342',
      nombre: 'Ana Beltrán López',
      correo: 'ana.beltran@alumno.buap.mx',
      calificacion: 8.0,
      observaciones: 'Faltó implementar el interceptor gRPC',
      actividad_nombre: 'Examen Parcial Semana 1'
    }
  ]);

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.materia.nrc = id;
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['actividad']) {
        // Podríamos cargar la actividad seleccionada
      }
    });
  }

  guardado = signal(false);
  guardarCalificaciones() {
    // PUT /calificaciones/{calificacion_id}
    this.guardado.set(true);
    setTimeout(() => this.guardado.set(false), 3000);
  }

  // Modal Importar Excel (Mismo flujo de Imagen 1)
  showImportModal = signal(false);
  archivoSeleccionado = signal<string>('');
  importando = signal(false);
  resultadoImportacion = signal<any | null>(null);

  abrirImportarModal() {
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
        actividad_id: this.actividadActual.id,
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

      // Actualizar notas en la tabla
      this.calificaciones.update(list => list.map(c => {
        if (c.correo === 'diego.cannata@alumno.buap.mx') return { ...c, calificacion: 0, observaciones: 'Fila sin puntos; se considera no calificada' };
        if (c.correo === 'alejandro.garciacon@alumno.buap.mx') return { ...c, calificacion: 0, observaciones: 'Fila sin puntos; se considera no calificada' };
        return c;
      }));
    }, 1500);
  }

  cerrarImportModal() {
    this.showImportModal.set(false);
    this.resultadoImportacion.set(null);
  }

  // Promedio de la actividad
  promedioActividad = computed(() => {
    const list = this.calificaciones();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, c) => acc + (Number(c.calificacion) || 0), 0);
    return sum / list.length;
  });
}
