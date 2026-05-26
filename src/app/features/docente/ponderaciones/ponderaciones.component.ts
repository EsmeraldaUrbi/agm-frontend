import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MateriasService } from '../../../core/services/materias.service';

interface Criterio {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  porcentaje: number;
}

@Component({
  selector: 'app-ponderaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ponderaciones.component.html'
})
export class PonderacionesComponent {

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

  // Criterios de evaluación — reactivos con signal
  criterios = signal<Criterio[]>([]);

  // Total calculado reactivamente
  totalPonderacion = computed(() =>
    this.criterios().reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0)
  );

  // ¿Es válido para guardar?
  esValido = computed(() => this.totalPonderacion() === 100);

  // Color del indicador circular según el total
  colorIndicador = computed(() => {
    const t = this.totalPonderacion();
    if (t === 100) return { ring: 'ring-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Ponderación Completa', desc: 'correcto' };
    if (t > 100)   return { ring: 'ring-red-500',     text: 'text-red-600',     bg: 'bg-red-500',     label: 'Excede el 100%',        desc: 'error'    };
    return           { ring: 'ring-amber-400',    text: 'text-amber-600',   bg: 'bg-amber-400',   label: 'Incompleto',             desc: 'pendiente' };
  });

  // Actualizar porcentaje de un criterio
  updatePorcentaje(id: number, valor: string) {
    const num = Math.min(100, Math.max(0, Number(valor) || 0));
    this.criterios.update(list =>
      list.map(c => c.id === id ? { ...c, porcentaje: num } : c)
    );
  }

  // Agregar nuevo criterio
  private nextId = 5;
  agregarCriterio() {
    this.criterios.update(list => [...list, {
      id: this.nextId++,
      nombre: 'Nuevo Criterio',
      descripcion: 'Descripción del criterio',
      icono: 'grade',
      porcentaje: 0
    }]);
  }

  // Eliminar criterio
  eliminar(id: number) {
    this.criterios.update(list => list.filter(c => c.id !== id));
  }

  // Guardar (se conectará a POST :8004/calificaciones/ponderaciones)
  guardado = signal(false);
  guardar() {
    if (!this.esValido()) return;
    // POST /calificaciones/ponderaciones con criterios[]
    this.guardado.set(true);
    setTimeout(() => this.guardado.set(false), 3000);
  }

  // Descartar cambios — reset a valores originales
  descartar() {
    this.criterios.set([]);
  }

  // Altura de barra en gráfico visual (max = 100% → 192px)
  alturaBarra(porcentaje: number): string {
    return `${Math.max(4, (porcentaje / 100) * 192)}px`;
  }

  // Color de barra por índice
  coloresBarra = ['#003b5c', '#00566d', '#006782', '#42d0fe', '#7aa5cc', '#a0cbf3'];
  colorBarra(i: number): string {
    return this.coloresBarra[i % this.coloresBarra.length];
  }
}
