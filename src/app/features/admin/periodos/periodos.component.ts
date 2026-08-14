import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgmButtonComponent, AgmInputComponent, AgmCardComponent } from '../../../shared/components/ui';
import { PeriodosService, Periodo } from '../../../core/services/periodos.service';
import { LoadingService } from '../../../core/services/loading.service';
import Swal from 'sweetalert2';

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
  templateUrl: './periodos.component.html',
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
  protected loadingService = inject(LoadingService);

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

  calcularDuracionSemanas(periodo: Periodo): number {
    const start = new Date(periodo.fecha_inicio).getTime();
    const end = new Date(periodo.fecha_fin).getTime();

    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      return 0;
    }

    const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.max(1, Math.round((end - start) / millisecondsPerWeek));
  }

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
      activo: this.isEditing() ? this.periodoActivo : false
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

  // Desactivar periodo activo actual
  deactivatePeriodo(periodo: Periodo) {
    if (!periodo.periodo_id) return;
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas apagar (desactivar) el periodo ${periodo.nombre}? Todos los módulos dejarán de mostrarlo como el ciclo actual.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#003B5C',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg px-4 py-2 text-white font-bold',
        cancelButton: 'rounded-lg px-4 py-2 text-slate-700 font-bold'
      }
    }).then((result) => {
      if (result.isConfirmed && periodo.periodo_id) {
        // Usamos el updatePeriodo normal para mandarlo a inactivo
        this.periodosService.updatePeriodo(periodo.periodo_id, { activo: false }).subscribe({
          next: () => {
            this.triggerToast('El periodo ha sido desactivado exitosamente.', 'success');
            this.cargarPeriodos();
          },
          error: (err) => {
            console.error(err);
            const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error al desactivar el periodo.';
            this.triggerToast(errorMsg, 'error');
          }
        });
      }
    });
  }

  // Nota: La función deletePeriodo fue removida. 
  // El backend no permite borrado físico (hard-delete) de periodos por integridad referencial,
  // únicamente se permite desactivarlos (apagar ciclo activo).

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
