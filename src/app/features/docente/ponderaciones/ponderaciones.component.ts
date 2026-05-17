import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  materia = {
    nrc: '28491',
    nombre: 'Web Services Architecture',
    seccion: '101',
    horario: 'Lunes, Miércoles 16:00 - 18:00',
    programa: 'Postgrado en Computación',
    periodo: 'Primavera 2026',
  };

  // Criterios de evaluación — reactivos con signal
  criterios = signal<Criterio[]>([
    { id: 1, nombre: 'Exámenes Parciales', descripcion: 'Promedio de 3 periodos',             icono: 'assignment',   porcentaje: 40 },
    { id: 2, nombre: 'Tareas y Taller',    descripcion: 'Ejercicios prácticos semanales',      icono: 'history_edu',  porcentaje: 30 },
    { id: 3, nombre: 'Proyecto Final',     descripcion: 'Implementación de Microservicios',    icono: 'rocket_launch', porcentaje: 20 },
    { id: 4, nombre: 'Asistencia',         descripcion: 'Mínimo 80% requerido',               icono: 'how_to_reg',   porcentaje: 10 },
  ]);

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

  // Guardar (mock — se conectará a POST :8004/calificaciones/ponderaciones)
  guardado = signal(false);
  guardar() {
    if (!this.esValido()) return;
    // POST /calificaciones/ponderaciones con criterios[]
    this.guardado.set(true);
    setTimeout(() => this.guardado.set(false), 3000);
  }

  // Descartar cambios — reset a valores originales
  descartar() {
    this.criterios.set([
      { id: 1, nombre: 'Exámenes Parciales', descripcion: 'Promedio de 3 periodos',          icono: 'assignment',   porcentaje: 40 },
      { id: 2, nombre: 'Tareas y Taller',    descripcion: 'Ejercicios prácticos semanales',   icono: 'history_edu',  porcentaje: 30 },
      { id: 3, nombre: 'Proyecto Final',     descripcion: 'Implementación de Microservicios', icono: 'rocket_launch', porcentaje: 20 },
      { id: 4, nombre: 'Asistencia',         descripcion: 'Mínimo 80% requerido',            icono: 'how_to_reg',   porcentaje: 10 },
    ]);
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
