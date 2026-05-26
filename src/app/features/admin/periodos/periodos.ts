import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgmButtonComponent, AgmInputComponent, AgmCardComponent } from '../../../shared/components/ui';
import { PeriodosService, Periodo } from '../../../core/services/periodos.service';

@Component({
  selector: 'app-periodos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgmButtonComponent,
    AgmInputComponent,
    AgmCardComponent
  ],
  templateUrl: './periodos.html',
  styles: [`
    :host {
      display: block;
    }
    .animate-modal-in {
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class PeriodosComponent implements OnInit {
  private periodosService = inject(PeriodosService);

  periodosList = signal<Periodo[]>([]);

  // Filtros y control de UI
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  // Formulario del Periodo
  periodoId = '';
  periodoName = '';
  periodoStartDate = '';
  periodoEndDate = '';
  periodoActivo = false;

  // Alertas / Toasts
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  showToast = signal<boolean>(false);

  ngOnInit() {
    this.cargarPeriodos();
  }

  cargarPeriodos() {
    this.periodosService.getPeriodos(1, 100).subscribe({
      next: (res) => {
        this.periodosList.set(res.items);
      },
      error: (err) => {
        console.error('Error cargando periodos:', err);
        const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error al cargar la lista de periodos';
        this.triggerToast(errorMsg, 'error');
      }
    });
  }

  // Obtener periodo actualmente activo (Computed)
  activePeriodo = computed(() => {
    return this.periodosList().find(p => p.activo);
  });

  // Calcular el progreso visual del periodo activo
  activePeriodProgress = computed(() => {
    const active = this.activePeriodo();
    if (!active) return 0;

    const start = new Date(active.fecha_inicio).getTime();
    const end = new Date(active.fecha_fin).getTime();
    const now = new Date().getTime(); 

    if (now <= start) return 0;
    if (now >= end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  });

  // Obtener periodos que no están activos
  otherPeriodos = computed(() => {
    return this.periodosList().filter(p => !p.activo);
  });

  // Abrir Modal de Creación
  openCreateModal() {
    this.isEditing.set(false);
    this.periodoId = '';
    this.periodoName = '';
    this.periodoStartDate = '';
    this.periodoEndDate = '';
    this.periodoActivo = false;
    this.showModal.set(true);
  }

  // Abrir Modal de Edición
  openEditModal(periodo: Periodo) {
    this.isEditing.set(true);
    this.periodoId = periodo.periodo_id || '';
    this.periodoName = periodo.nombre;
    this.periodoStartDate = periodo.fecha_inicio;
    this.periodoEndDate = periodo.fecha_fin;
    this.periodoActivo = periodo.activo;
    this.showModal.set(true);
  }

  // Guardar datos
  savePeriodo() {
    if (!this.periodoName || !this.periodoStartDate || !this.periodoEndDate) {
      this.triggerToast('Por favor, rellena todos los campos obligatorios.', 'error');
      return;
    }

    const start = new Date(this.periodoStartDate).getTime();
    const end = new Date(this.periodoEndDate).getTime();
    if (start >= end) {
      this.triggerToast('La fecha de término debe ser posterior a la fecha de inicio.', 'error');
      return;
    }

    const payload: Partial<Periodo> = {
      nombre: this.periodoName,
      fecha_inicio: this.periodoStartDate,
      fecha_fin: this.periodoEndDate,
      activo: this.periodoActivo
    };

    if (this.isEditing() && this.periodoId) {
      this.periodosService.updatePeriodo(this.periodoId, payload).subscribe({
        next: () => {
          this.triggerToast('Periodo académico actualizado con éxito.');
          this.cargarPeriodos();
          this.showModal.set(false);
        },
        error: (err) => {
          console.error(err);
          const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error al actualizar el periodo.';
          this.triggerToast(errorMsg, 'error');
        }
      });
    } else {
      this.periodosService.createPeriodo(payload).subscribe({
        next: () => {
          this.triggerToast('¡Nuevo periodo académico creado exitosamente!');
          this.cargarPeriodos();
          this.showModal.set(false);
        },
        error: (err) => {
          console.error(err);
          const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error al crear el periodo.';
          this.triggerToast(errorMsg, 'error');
        }
      });
    }
  }

  // Activar directamente un periodo de la lista
  setAsActive(periodo: Periodo) {
    if (!periodo.periodo_id) return;
    this.periodosService.activarPeriodo(periodo.periodo_id).subscribe({
      next: () => {
        this.triggerToast(`Se ha activado el periodo académico: ${periodo.nombre}`);
        this.cargarPeriodos();
      },
      error: (err) => {
        console.error(err);
        const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error al activar el periodo.';
        this.triggerToast(errorMsg, 'error');
      }
    });
  }

  // Eliminar periodo
  deletePeriodo(periodo: Periodo) {
    if (periodo.activo) {
      this.triggerToast('No se puede eliminar el periodo actualmente activo. Primero activa otro.', 'error');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el periodo ${periodo.nombre}?`)) {
      if (!periodo.periodo_id) return;
      this.periodosService.deletePeriodo(periodo.periodo_id).subscribe({
        next: () => {
          this.triggerToast('Periodo académico eliminado.');
          this.cargarPeriodos();
        },
        error: (err) => {
          console.error(err);
          const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error al eliminar el periodo.';
          this.triggerToast(errorMsg, 'error');
        }
      });
    }
  }

  // Toast Helper
  triggerToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 4000);
  }
}
