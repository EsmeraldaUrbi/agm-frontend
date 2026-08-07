import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CalificacionesService, Criterio as BackendCriterio } from '../../../core/services/calificaciones.service';
import { MateriaContextService } from '../../../core/services/materia-context.service';
import { FinalActService } from '../../../core/services/final-act.service';

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
export class PonderacionesComponent implements OnInit {
  private finalActService = inject(FinalActService);
  private route = inject(ActivatedRoute);
  private materiaContextService = inject(MateriaContextService);
  private calificacionesService = inject(CalificacionesService);

  materia = signal({
    materia_id: '',
    nrc: '',
    nombre: 'Cargando...',
    seccion: '',
    horario: '',
    programa: 'Cargando...',
    periodo: 'Cargando...',
    estado: '',
  });

  // Criterios de evaluación — reactivos con signal
  criterios = signal<Criterio[]>([]);

  // Respaldar original para poder "Descartar"
  private criteriosOriginales: Criterio[] = [];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.materia.update(m => ({ ...m, nrc: id }));
        this.cargarMateria(id);
      }
    });
  }

  cargarMateria(id: string) {
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
          estado: contexto.estado || ''
        });

        this.cargarPonderaciones(contexto.materia_id);
      },
      error: (err) => console.error('Error al cargar contexto académico de la materia:', err)
    });
  }

  cargarPonderaciones(materiaId: string) {
    this.calificacionesService.getPonderaciones(materiaId).subscribe({
      next: (pond) => {
        if (pond && pond.criterios) {
          const mapped = pond.criterios.map((c, index) => ({
            id: index + 1,
            nombre: c.nombre,
            descripcion: '', // Backend no almacena descripción
            icono: this.getIconForName(c.nombre),
            porcentaje: c.porcentaje
          }));
          this.criterios.set(mapped);
          this.criteriosOriginales = JSON.parse(JSON.stringify(mapped));
          this.nextId = mapped.length > 0 ? Math.max(...mapped.map(m => m.id)) + 1 : 1;
        } else {
          this.criterios.set([]);
          this.criteriosOriginales = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar ponderaciones:', err);
        this.criterios.set([]);
        this.criteriosOriginales = [];
      }
    });
  }

  private getIconForName(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('examen') || n.includes('parcial')) return 'assignment';
    if (n.includes('tarea') || n.includes('taller') || n.includes('practica')) return 'history_edu';
    if (n.includes('proyecto')) return 'rocket_launch';
    if (n.includes('asistencia')) return 'how_to_reg';
    return 'grade';
  }

  // Total calculado reactivamente
  totalPonderacion = computed(() =>
    this.criterios().reduce((sum, c) => sum + (Number(c.porcentaje) || 0), 0)
  );

  esValido = computed(() => {
    if (this.totalPonderacion() !== 100) return false;
    const items = this.criterios();
    if (items.length === 0) return false;
    
    // Verificar nombres vacíos
    for (let c of items) {
      if (!c.nombre || c.nombre.trim() === '') return false;
    }
    
    // Verificar nombres únicos
    const nombres = items.map(c => c.nombre.trim().toLowerCase());
    const unicos = new Set(nombres);
    if (unicos.size !== items.length) return false;
    
    return true;
  });

  haCambiado = computed(() => JSON.stringify(this.criterios()) !== JSON.stringify(this.criteriosOriginales));

  materiaFinalizada = computed(() => {
    const estado = String(this.materia().estado || '').trim().toUpperCase();
    return ['FINALIZADA', 'ACTA_IMPRESA', 'ACTA FINAL IMPRESA', 'LISTA_FINAL_IMPRESA'].includes(estado) || this.finalActService.isFinalActPrinted(this.materia().materia_id);
  });

  motivoBloqueo = computed(() => {
    if (this.materiaFinalizada()) {
      return 'La lista final ya fue impresa. No se pueden modificar sus ponderaciones.';
    }

    const items = this.criterios();

    if (items.length === 0) {
      return 'Agrega al menos un criterio de evaluación.';
    }

    if (this.totalPonderacion() > 100) {
      return `El total excede el 100% por ${this.totalPonderacion() - 100}%.`;
    }

    if (this.totalPonderacion() < 100) {
      return `Faltan ${100 - this.totalPonderacion()}% por distribuir.`;
    }

    const nombres = items.map(c => c.nombre.trim()).filter(Boolean);
    if (nombres.length !== items.length) {
      return 'Todos los criterios deben tener nombre.';
    }

    const nombresNormalizados = nombres.map(n => n.toLowerCase());
    if (new Set(nombresNormalizados).size !== nombresNormalizados.length) {
      return 'Los nombres de los criterios no deben repetirse.';
    }

    return '';
  });

  puedeGuardar = computed(() => this.esValido() && !this.materiaFinalizada());

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
  private nextId = 1;
  agregarCriterio() {
    this.criterios.update(list => [...list, {
      id: this.nextId++,
      nombre: 'Nuevo Criterio',
      descripcion: '',
      icono: 'grade',
      porcentaje: 0
    }]);
  }

  // Eliminar criterio
  eliminar(id: number) {
    this.criterios.update(list => list.filter(c => c.id !== id));
  }

  // Guardar (POST /api/v1/ponderaciones/:materia_id)
  guardado = signal(false);
  errorGuardado = signal('');
  guardar() {
    const materiaId = this.materia().materia_id;
    this.errorGuardado.set('');
    if (!this.puedeGuardar() || !materiaId) return;

    const payload: any[] = this.criterios().map((c, idx) => ({
      nombre: c.nombre.trim(),
      porcentaje: Number(c.porcentaje) || 0,
      orden: idx + 1
    }));

    this.calificacionesService.crearPonderaciones(materiaId, payload).subscribe({
      next: (res) => {
        this.guardado.set(true);
        this.criteriosOriginales = JSON.parse(JSON.stringify(this.criterios()));
        setTimeout(() => this.guardado.set(false), 3000);
      },
      error: (err) => {
        console.error('Error al guardar ponderaciones:', err);
        alert('Hubo un error al guardar las ponderaciones. Asegúrese de que los nombres no se repitan y no existan actividades calificadas y/o asociadas.');
      }
    });
  }

  // Descartar cambios — reset a valores originales cargados de BD
  descartar() {
    this.errorGuardado.set('');
    this.criterios.set(JSON.parse(JSON.stringify(this.criteriosOriginales)));
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

